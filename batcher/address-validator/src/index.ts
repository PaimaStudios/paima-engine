import type Web3 from 'web3';
import type { Pool } from 'pg';

import { addressTypeName, GenericRejectionCode, ENV } from '@paima-batcher/utils';
import type { ErrorCode } from '@paima-batcher/utils';
import {
  getUserTrackingEntry,
  addUserTrackingEntry,
  incrementUserTrackingSameMinute,
  incrementUserTrackingSameDay,
  incrementUserTrackingAnotherDay,
} from '@paima-batcher/db';

import { isSameDay, isSameMinute } from './date-utils.js';
import type { BatchedSubunit } from '@paima/concise';
import { CryptoManager } from '@paima/crypto';
import { createMessageForBatcher } from '@paima/concise';
import { initWeb3, AddressType, getReadNamespaces } from '@paima/utils';

class PaimaAddressValidator {
  private web3: Web3 | undefined;
  private nodeUrl: string;
  private pool: Pool;

  constructor(nodeUrl: string, pool: Pool) {
    this.web3 = undefined;
    this.nodeUrl = nodeUrl;
    this.pool = pool;
  }

  public initialize = async (): Promise<void> => {
    this.web3 = await initWeb3(this.nodeUrl);
  };

  public validateUserInput = async (input: BatchedSubunit, height: number): Promise<ErrorCode> => {
    // Determine address type:
    const addressType = input.addressType;
    console.log(`[address-validator] Processing ${addressTypeName(addressType)} address...`);

    // Is the address valid / one of the supported schemes?
    const addressValid = await this.validateAddress(input.userAddress, addressType);
    if (!addressValid) {
      console.log('[address-validator] Invalid address!');
      return GenericRejectionCode.INVALID_ADDRESS;
    }

    // Does the input match the supplied signature?
    const signatureValid = await this.verifySignature(input, addressType, height);
    if (!signatureValid) {
      console.log(`[address-validator] Invalid signature!\n${JSON.stringify(input)}`);
      return GenericRejectionCode.INVALID_SIGNATURE;
    }

    // Is the address allowed to post input?
    const addressAllowed = await this.authenticateUserAddress(input.userAddress);
    if (!addressAllowed) {
      console.log('[address-validator] Address not allowed!');
      return GenericRejectionCode.ADDRESS_NOT_ALLOWED;
    }

    // All tests passed:
    return 0;
  };

  private validateAddress = async (address: string, addressType: AddressType): Promise<boolean> => {
    switch (addressType) {
      case AddressType.EVM: {
        if (this.web3 == null)
          throw new Error(`[address-validator] web3 not initialized before address validations`);
        return await CryptoManager.Evm(this.web3).verifyAddress(address);
      }
      case AddressType.CARDANO:
        return await CryptoManager.Cardano().verifyAddress(address);
      case AddressType.POLKADOT:
        return await CryptoManager.Polkadot().verifyAddress(address);
      case AddressType.ALGORAND:
        return await CryptoManager.Algorand().verifyAddress(address);
      default:
        return false;
    }
  };

  // TODO: this function is a duplicate of validateSubunitSignature
  private verifySignature = async (
    input: BatchedSubunit,
    addressType: AddressType,
    height: number
  ): Promise<boolean> => {
    const namespaces = await getReadNamespaces(height);

    const tryVerifySig = async (message: string): Promise<boolean> => {
      switch (addressType) {
        case AddressType.EVM:
          if (!this.web3) {
            throw new Error('[PaimaAddressValidator::verifySignature] web3 not initialized!');
          }
          return await CryptoManager.Evm(this.web3).verifySignature(
            input.userAddress,
            message,
            input.userSignature
          );
        case AddressType.CARDANO:
          return await CryptoManager.Cardano().verifySignature(
            input.userAddress,
            message,
            input.userSignature
          );
        case AddressType.POLKADOT:
          return await CryptoManager.Polkadot().verifySignature(
            input.userAddress,
            message,
            input.userSignature
          );
        case AddressType.ALGORAND:
          return await CryptoManager.Algorand().verifySignature(
            input.userAddress,
            message,
            input.userSignature
          );
        default:
          return false;
      }
    };
    for (const namespace of namespaces) {
      const message: string = createMessageForBatcher(
        namespace,
        input.gameInput,
        input.millisecondTimestamp
      );
      if (await tryVerifySig(message)) {
        return true;
      }
    }
    return false;
  };

  private authenticateUserAddress = async (userAddress: string): Promise<boolean> => {
    console.log(`[address-validator] authenticating ${userAddress}...`);
    const currentTimestamp = new Date();

    try {
      const result = await getUserTrackingEntry.run({ user_address: userAddress }, this.pool);

      if (result.length < 1) {
        // New user, add new entry:
        await addUserTrackingEntry.run(
          { user_address: userAddress, current_timestamp: currentTimestamp },
          this.pool
        );
        console.log(`[address-validator] ${userAddress}: new user, creating entry`);
        return true;
      }

      const userEntry = result[0];
      const latestTimestamp = userEntry.latest_timestamp;

      if (!isSameDay(latestTimestamp, currentTimestamp)) {
        if (this.evaluatePostingLimits(0, 0, userEntry.inputs_total)) {
          await incrementUserTrackingAnotherDay.run(
            { user_address: userAddress, current_timestamp: currentTimestamp },
            this.pool
          );
          return true;
        }
      } else if (!isSameMinute(latestTimestamp, currentTimestamp)) {
        if (this.evaluatePostingLimits(0, userEntry.inputs_day, userEntry.inputs_total)) {
          await incrementUserTrackingSameDay.run(
            { user_address: userAddress, current_timestamp: currentTimestamp },
            this.pool
          );
          return true;
        }
      } else {
        console.log(`[address-validator] ${userAddress}: same minute, updating entry`);
        if (
          this.evaluatePostingLimits(
            userEntry.inputs_minute,
            userEntry.inputs_day,
            userEntry.inputs_total
          )
        ) {
          await incrementUserTrackingSameMinute.run(
            { user_address: userAddress, current_timestamp: currentTimestamp },
            this.pool
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.log('[address-validator] Error while authenticating user:', err);
      return false;
    }
  };

  private evaluatePostingLimits(
    inputsMinute: number,
    inputsDay: number,
    // TODO: we never implemented an env variable to check this limit
    inputsTotal: number
  ): boolean {
    return inputsMinute < ENV.MAX_USER_INPUTS_PER_MINUTE && inputsDay < ENV.MAX_USER_INPUTS_PER_DAY;
  }
}

export default PaimaAddressValidator;
