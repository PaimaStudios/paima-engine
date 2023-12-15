import { LRUCache } from 'lru-cache';
import Web3 from 'web3';
import type { PoolClient } from 'pg';

import { PaimaParser } from '@paima/concise';
import { ENV, doLog } from '@paima/utils';
import { CryptoManager } from '@paima/crypto';
import type { IGetAddressFromAddressResult } from '@paima/db';
import {
  deleteAddress,
  deleteDelegationsFrom,
  getAddressFromAddress,
  getAddressFromId,
  getDelegation,
  getDelegationsFrom,
  getDelegationsTo,
  newAddress,
  newDelegation,
  updateAddress,
} from '@paima/db';

export type WalletDelegate = { address: string; id: number };

type ParsedDelegateWalletCommand =
  | {
      command: 'delegate';
      args: { from: string; to: string; from_signature: string; to_signature: string };
    }
  | {
      command: 'migrate';
      args: { from: string; to: string; from_signature: string; to_signature: string };
    }
  | { command: 'cancelDelegations'; args: { to: string; to_signature: string } };

export class DelegateWallet {
  public static readonly NO_USER_ID = -1;

  private static readonly DELEGATE_WALLET_PREFIX = 'DELEGATE-WALLET';

  public static readonly INTERNAL_COMMAND_PREFIX = '&';

  private static readonly SEP = ':';

  private static readonly delegationGrammar = `
    delegate            =   &wd|from|to|from_signature|to_signature
    migrate             =   &wm|from|to|from_signature|to_signature
    cancelDelegations   =   &wc|to|to_signature
    `;

  private static readonly parserCommands = {
    delegate: {
      from: PaimaParser.WalletAddress(),
      to: PaimaParser.WalletAddress(),
      from_signature: PaimaParser.NCharsParser(0, 1024),
      to_signature: PaimaParser.NCharsParser(0, 1024),
    },
    migrate: {
      from: PaimaParser.WalletAddress(),
      to: PaimaParser.WalletAddress(),
      from_signature: PaimaParser.NCharsParser(0, 1024),
      to_signature: PaimaParser.NCharsParser(0, 1024),
    },
    cancelDelegations: {
      to: PaimaParser.WalletAddress(),
      to_signature: PaimaParser.NCharsParser(0, 1024),
    },
  };

  private static parser = new PaimaParser(
    DelegateWallet.delegationGrammar,
    DelegateWallet.parserCommands
  );

  private static addressCache = new LRUCache<string, WalletDelegate>({
    max: 2000,
  });

  constructor(private DBConn: PoolClient) {}

  /* Generate Plaintext Message */
  private generateMessage(internalMessage: string = ''): string {
    return `${DelegateWallet.DELEGATE_WALLET_PREFIX}${
      DelegateWallet.SEP
    }${internalMessage.toLocaleLowerCase()}${DelegateWallet.SEP}${ENV.CONTRACT_ADDRESS}`;
  }

  /* Verify Signature with all possible wallets. */
  private async verifySignature(
    walletAddress: string,
    internalMessage: string,
    signature: string
  ): Promise<boolean> {
    if (!walletAddress || !signature) throw new Error('No Signature');
    const wallets = [
      CryptoManager.Evm(new Web3()),
      CryptoManager.Algorand(),
      CryptoManager.Cardano(),
      CryptoManager.Polkadot(),
    ];
    const message = this.generateMessage(internalMessage);
    for (const wallet of wallets) {
      try {
        if (await wallet.verifySignature(walletAddress, message, signature)) {
          return true;
        }
      } catch {
        // do nothing.
      }
    }
    throw new Error(`Invalid Signature for ${walletAddress} : ${message}`);
  }

  public async getOrCreateNewAddress(
    address: string
  ): Promise<{ address: IGetAddressFromAddressResult; isNew: boolean }> {
    const [exitingAddress] = await getAddressFromAddress.run({ address: address }, this.DBConn);
    if (exitingAddress) return { address: exitingAddress, isNew: false };
    // create new.
    await newAddress.run({ address }, this.DBConn);
    const [createdAddress] = await getAddressFromAddress.run({ address }, this.DBConn);
    return { address: createdAddress, isNew: true };
  }

  // Swap:
  // addressA gains addressB ID
  // addressB is assigned a new ID
  private async swap(addressA: string, addressB: string): Promise<void> {
    await deleteAddress.run({ address: addressA }, this.DBConn);
    await updateAddress.run(
      {
        new_address: addressA,
        old_address: addressB,
      },
      this.DBConn
    );
    await newAddress.run({ address: addressB }, this.DBConn);
  }

  private async cmdDelegate(from: string, to: string): Promise<void> {
    const fromAddress = await this.getOrCreateNewAddress(from);
    const toAddress = await this.getOrCreateNewAddress(to);

    // Check if delegation or reverse delegation does not exist TODO.
    const [currentDelegation] = await getDelegation.run(
      { from_id: fromAddress.address.id, set_id: toAddress.address.id },
      this.DBConn
    );
    if (currentDelegation) throw new Error('Delegation already exists');
    const [reverseDelegation] = await getDelegation.run(
      { from_id: toAddress.address.id, set_id: fromAddress.address.id },
      this.DBConn
    );
    if (reverseDelegation) throw new Error('Reverse Delegation already exists');

    // Case 1:
    // If  A->Y && B->Y, if B is new.
    // Check if address needs to be replaced.
    // This is a special case where FROM takes TO identity.
    // As the identity is taken, no other updates are required.
    const toAddressHasFrom = await getDelegationsFrom.run(
      { from_id: toAddress.address.id },
      this.DBConn
    );
    if (toAddressHasFrom.length > 0) {
      if (fromAddress.isNew) {
        await this.swap(fromAddress.address.address, toAddress.address.address);

        const [newToAddressId] = await getAddressFromAddress.run(
          { address: toAddress.address.address },
          this.DBConn
        );
        await newDelegation.run(
          { from_id: toAddress.address.id, set_id: newToAddressId.id },
          this.DBConn
        );
        DelegateWallet.addressCache.clear();
        return;
      }

      throw new Error('Both A and B have progress. Cannot merge.');
    }

    const [toAddressHasTo] = await getDelegationsTo.run(
      { set_id: toAddress.address.id },
      this.DBConn
    );
    if (toAddressHasTo) {
      throw new Error('Both A and B have progress. Cannot merge.');
    }

    // Case 2:
    // W->B && B->A ; then W->A && W->B
    // Lets get master address, if there is any parent address of the from address.
    let masterAddress = fromAddress.address;
    const [fromAddressIsTo] = await getDelegationsTo.run(
      { set_id: fromAddress.address.id },
      this.DBConn
    );
    if (fromAddressIsTo) {
      const [f] = await getAddressFromId.run({ id: fromAddressIsTo.from_id }, this.DBConn);
      masterAddress = f;
    }

    // Write new delegation, for all cases.
    await newDelegation.run(
      { from_id: masterAddress.id, set_id: toAddress.address.id },
      this.DBConn
    );

    DelegateWallet.addressCache.clear();
  }

  // Migrate.
  // To gains From ID, and From is assigned a new ID.
  private async cmdMigrate(from: string, to: string): Promise<void> {
    const [fromAddress] = await getAddressFromAddress.run({ address: from }, this.DBConn);
    if (!fromAddress) throw new Error('Invalid Address');

    const toAddress = await this.getOrCreateNewAddress(to);
    await this.swap(fromAddress.address, toAddress.address.address);
    DelegateWallet.addressCache.clear();
  }

  // Cancel Delegations.
  // Delete all delegations from where TO=to
  private async cmdCancelDelegations(to: string): Promise<void> {
    const [toAddress] = await getAddressFromAddress.run({ address: to }, this.DBConn);
    if (!toAddress) throw new Error('Invalid Address');
    await deleteDelegationsFrom.run({ from_id: toAddress.id }, this.DBConn);
    DelegateWallet.addressCache.clear();
  }

  // Get Main Wallet and ID for address.
  // If wallet does not exist, It will NOT be created in address, table.
  public async getMainAddress(address: string): Promise<WalletDelegate> {
    let addressMapping: WalletDelegate | undefined = DelegateWallet.addressCache.get(address);
    if (addressMapping) return addressMapping;

    // get main address.
    // const addressResult = await this.getOrCreateNewAddress(address);
    const [addressResult] = await getAddressFromAddress.run({ address }, this.DBConn);
    if (!addressResult) {
      // This wallet has never been used before.
      // This value will get updated before sent to the STF.
      return { address, id: DelegateWallet.NO_USER_ID };
    }

    // if exists we have to check if it is a delegation.
    const [delegate] = await getDelegationsTo.run({ set_id: addressResult.id }, this.DBConn);
    if (!delegate) {
      // is main address or has no delegations.
      addressMapping = { address: addressResult.address, id: addressResult.id };
      DelegateWallet.addressCache.set(address, addressMapping);
      return addressMapping;
    }

    // if is delegation, get main address.
    const [mainAddress] = await getAddressFromId.run({ id: delegate.from_id }, this.DBConn);
    addressMapping = { address: mainAddress.address, id: mainAddress.id };
    DelegateWallet.addressCache.set(address, addressMapping);
    return addressMapping;
  }

  /*
   * Main entry point. Verify if command is valid and execute it.
   *
   * If returns TRUE this is was an intend as internal command,
   * and the paima-concise command should not passed into the game STF.
   */
  public async process(command: string): Promise<boolean> {
    try {
      if (!command.startsWith(DelegateWallet.INTERNAL_COMMAND_PREFIX)) return false;
      const parsed: ParsedDelegateWalletCommand = DelegateWallet.parser.start(
        command
      ) as ParsedDelegateWalletCommand;
      switch (parsed.command) {
        case 'delegate':
          {
            const { from, to, from_signature, to_signature } = parsed.args;
            await this.verifySignature(from, this.generateMessage(to), from_signature);
            await this.verifySignature(to, this.generateMessage(from), to_signature);
            await this.cmdDelegate(from, to);
          }
          break;
        case 'migrate':
          {
            const { from, to, from_signature, to_signature } = parsed.args;
            await this.verifySignature(from, this.generateMessage(to), from_signature);
            await this.verifySignature(to, this.generateMessage(from), to_signature);
            await this.cmdMigrate(from, to);
          }
          break;
        case 'cancelDelegations':
          {
            const { to, to_signature } = parsed.args;
            await this.verifySignature(to, this.generateMessage(), to_signature);
            await this.cmdCancelDelegations(to);
          }
          break;
        default:
          throw new Error(
            `Delegate Wallet Internal Error : ${JSON.stringify({ parsed, command })}`
          );
      }
    } catch (e) {
      doLog(`Error parsing command: ${command} ${String(e)}`);
    }
    return true;
  }
}
