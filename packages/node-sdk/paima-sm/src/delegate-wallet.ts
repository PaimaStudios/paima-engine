import type { PoolClient } from 'pg';

import { ENV, doLog } from '@paima/utils';
import { CryptoManager } from '@paima/crypto';
import type { IGetAddressFromAddressResult } from '@paima/db';
import {
  addressCache,
  deleteDelegationTo,
  deleteDelegationsFrom,
  enableManualCache,
  getAddressFromAddress,
  getDelegation,
  getDelegationsTo,
  getDelegationsToWithAddress,
  newAddress,
  newDelegation,
  updateAddress,
} from '@paima/db';
import { BuiltinGrammar, BuiltinGrammarPrefix, INTERNAL_COMMAND_PREFIX, KeyedBuiltinGrammar, parseStmInput } from '@paima/concise';

type AddressExists = { address: IGetAddressFromAddressResult; exists: true };
type AddressDoesNotExist = { address: string; exists: false };
type AddressWrapper = AddressExists | AddressDoesNotExist;

// Delegate Wallet manages cache cleanup.
enableManualCache();

export class DelegateWallet {
  private static readonly DELEGATE_WALLET_PREFIX = 'DELEGATE-WALLET';

  private static readonly SEP = ':';

  constructor(private DBConn: PoolClient) {}

  /* Generate Plaintext Message */
  private generateMessage(internalMessage: string = ''): string {
    return `${DelegateWallet.DELEGATE_WALLET_PREFIX}${DelegateWallet.SEP}${internalMessage.toLocaleLowerCase()}`;
  }

  private validateSender(to: string, from: string, realAddress: string): void {
    if (to === from) throw new Error('Cannot delegate self');
    const isSelf = to === realAddress || from === realAddress;
    if (!isSelf) throw new Error('Either to or from must bt the sender address');
  }

  // Regex must match all possible wallets for the network.
  private static readonly WALLET_VALIDATORS = [
    CryptoManager.Evm(),
    CryptoManager.Cardano(),
    CryptoManager.Algorand(),
    CryptoManager.Polkadot(),
  ];

  /* Verify Signature with all possible wallets. */
  private async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<void> {
    if (!walletAddress || !signature) throw new Error('No Signature');

    for (const validator of DelegateWallet.WALLET_VALIDATORS) {
      try {
        if (!(await validator.verifyAddress(walletAddress))) continue;
        if (await validator.verifySignature(walletAddress, message, signature)) {
          return;
        }
      } catch {
        // do nothing, some validators throw errors if the signature is invalid
      }
    }
    throw new Error(`Invalid Signature for ${walletAddress} : ${message}`);
  }

  public async createAddress(address: string): Promise<IGetAddressFromAddressResult> {
    await newAddress.run({ address: address }, this.DBConn);
    const [createdAddress] = await getAddressFromAddress.run({ address }, this.DBConn);
    return createdAddress;
  }

  public async getAddress(address: string): Promise<AddressWrapper> {
    const [exitingAddress] = await getAddressFromAddress.run({ address: address }, this.DBConn);
    if (!exitingAddress) return { address, exists: false };
    return { address: exitingAddress, exists: true };
  }

  public async getExistingAddress(address: string): Promise<AddressExists> {
    const existingAddress = await this.getAddress(address);
    if (!existingAddress.exists) throw new Error('Address does not exist');
    return existingAddress;
  }

  // Swap:
  // addressB gains addressA ID.
  // addressA is assigned a new ID
  private async swap(
    existingAddress: AddressExists,
    nonExistingAddress: AddressDoesNotExist
  ): Promise<[AddressExists, AddressExists]> {
    await updateAddress.run(
      {
        new_address: nonExistingAddress.address,
        old_address: existingAddress.address.address,
      },
      this.DBConn
    );
    await newAddress.run({ address: existingAddress.address.address }, this.DBConn);

    return await Promise.all([
      this.getExistingAddress(existingAddress.address.address),
      this.getExistingAddress(nonExistingAddress.address),
    ]);
  }

  private async validateDelegate(
    fromAddress: AddressWrapper,
    toAddress: AddressWrapper
  ): Promise<void> {
    if (!fromAddress.exists || !toAddress.exists) {
      return; // both are new.
    }
    if (fromAddress.address.id === toAddress.address.id) {
      throw new Error('Cannot delegate to itself');
    }
    if (fromAddress.exists && toAddress.exists) {
      throw new Error('Both A and B have progress. Cannot merge.');
    }

    const [currentDelegation, reverseDelegation, toAddressHasTo] = await Promise.all([
      getDelegation.run(
        { from_id: fromAddress.address.id, to_id: toAddress.address.id },
        this.DBConn
      ),
      getDelegation.run(
        { from_id: toAddress.address.id, to_id: fromAddress.address.id },
        this.DBConn
      ),
      getDelegationsTo.run({ to_id: toAddress.address.id }, this.DBConn),
    ]);

    if (currentDelegation.length) throw new Error('Delegation already exists');
    if (reverseDelegation.length) throw new Error('Reverse Delegation already exists');
    if (toAddressHasTo.length) throw new Error('To Address has delegations. Cannot merge.');
  }

  private async cmdDelegate(from: string, to: string): Promise<void> {
    let [fromAddress, toAddress] = await Promise.all([this.getAddress(from), this.getAddress(to)]);
    await this.validateDelegate(fromAddress, toAddress);

    if (!fromAddress.exists && toAddress.exists) {
      // Case 1:
      // "from" is New, "to" has progress.
      // swap IDs.
      const [newToAddress, newFromAddress] = await this.swap(toAddress, fromAddress);
      fromAddress = newFromAddress;
      toAddress = newToAddress;
    } else {
      // Case  2:
      // Do not swap progress.
      // Create new addresses
      await Promise.all([
        (async (): Promise<void> => {
          if (!fromAddress.exists)
            fromAddress = { address: await this.createAddress(fromAddress.address), exists: true };
        })(),
        (async (): Promise<void> => {
          if (!toAddress.exists)
            toAddress = { address: await this.createAddress(toAddress.address), exists: true };
        })(),
      ]);
    }
    if (!fromAddress.exists || !toAddress.exists)
      throw new Error('Critical Error. Address not created');

    // Case 2:
    // W->B && B->A ; then W->A && W->B
    // Lets get master address, if there is any parent address of the from address.
    const [fromAddressIsTo] = await getDelegationsToWithAddress.run(
      { to_id: fromAddress.address.id },
      this.DBConn
    );

    const masterAddress = fromAddressIsTo
      ? { address: fromAddressIsTo.from_address, id: fromAddressIsTo.from_id }
      : fromAddress.address;

    // Write new delegation, for all cases.
    await newDelegation.run(
      { from_id: masterAddress.id, to_id: toAddress.address.id },
      this.DBConn
    );

    addressCache.clear();
  }

  // Migrate.
  // To gains From ID, and From is assigned a new ID.
  private async cmdMigrate(from: string, to: string): Promise<void> {
    const [fromAddress, toAddress] = await Promise.all([
      this.getAddress(from),
      this.getAddress(to),
    ]);
    await this.validateDelegate(fromAddress, toAddress);
    if (fromAddress.exists && !toAddress.exists) {
      await this.swap(fromAddress, toAddress);
    } else {
      throw new Error('Cannot migrate');
    }
    addressCache.clear();
  }

  // Cancel Delegations.
  // if "to" is provided, delete delegations for "from" -> "to"
  // if "to" is not provided, delete all delegations for "from" -> *
  private async cmdCancelDelegations(from: string, to: null | string): Promise<void> {
    const [fromAddress] = await getAddressFromAddress.run({ address: from }, this.DBConn);
    if (!fromAddress) throw new Error('Invalid Address');

    if (to) {
      const [toAddress] = await getAddressFromAddress.run({ address: to }, this.DBConn);
      if (!toAddress) throw new Error('Invalid Address');

      await deleteDelegationTo.run(
        {
          to_id: toAddress.id,
          from_id: fromAddress.id,
        },
        this.DBConn
      );
    } else {
      await deleteDelegationsFrom.run({ from_id: fromAddress.id }, this.DBConn);
    }

    addressCache.clear();
  }

  /*
   * Main entry point. Verify if command is valid and execute it.
   *
   * If returns TRUE if execution was valid and should be passed
   * into the SFT to apply side-effects.
   */
  public async process(
    realAddress: string,
    userAddress: string,
    command: string
  ): Promise<boolean> {
    try {
      if (!command.startsWith(INTERNAL_COMMAND_PREFIX)) {
        return true;
      }
      const parsedInput = parseStmInput(command, BuiltinGrammar, KeyedBuiltinGrammar);
      switch (parsedInput.prefix) {
        case BuiltinGrammarPrefix.delegateWallet: {
          const from = parsedInput.data.from || realAddress;
          const to = parsedInput.data.to || realAddress;
          this.validateSender(to, from, realAddress);

          const { from_signature, to_signature } = parsedInput.data;
          await Promise.all([
            this.verifySignature(from, this.generateMessage(to), from_signature),
            this.verifySignature(to, this.generateMessage(from), to_signature),
          ]);
          await this.cmdDelegate(from.toLocaleLowerCase(), to.toLocaleLowerCase());
          doLog(`Delegate Wallet ${from.substring(0, 8)}... -> ${to.substring(0, 8)}...`);
          return true;
        }
        case BuiltinGrammarPrefix.migrateWallet: {
          const from = parsedInput.data.from || realAddress;
          const to = parsedInput.data.to || realAddress;
          this.validateSender(to, from, realAddress);

          const { from_signature, to_signature } = parsedInput.data;
          await Promise.all([
            this.verifySignature(from, this.generateMessage(to), from_signature),
            this.verifySignature(to, this.generateMessage(from), to_signature),
          ]);
          await this.cmdMigrate(from.toLocaleLowerCase(), to.toLocaleLowerCase());

          doLog(`Migrate Wallet ${from.substring(0, 8)}... -> ${to.substring(0, 8)}...`);
          return true;
        }
        case BuiltinGrammarPrefix.cancelDelegations: {
          const { to } = parsedInput.data;
          await this.cmdCancelDelegations(userAddress.toLocaleLowerCase(), to?.toLocaleLowerCase() ?? null);
          doLog(
            `Cancel Delegate ${userAddress.substring(0, 8)}... -> ${to ? to.substring(0, 8) + '...' : '*'}`
          );
          return true;
        }
        default:
          throw new Error(
            `Delegate Wallet Internal Error : ${JSON.stringify({ parsed: parsedInput.data, command })}`
          );
      }
    } catch (e) {
      doLog(`Error parsing command: ${command} ${String(e)}`);
    }
    return false;
  }
}
