import { PaimaParser } from '@paima/concise';
import { ENV, doLog } from '@paima/utils';
import { CryptoManager } from '@paima/crypto';
import Web3 from 'web3';
import type { PoolClient } from 'pg';
import { error } from 'console';
import {
  deleteAddress,
  deleteAddressId,
  deleteDelegationFrom,
  getAddressFromAddress,
  getDelegationsFrom,
  getDelegationsTo,
  newAddress,
  newDelegation,
  updateDelegateTo,
} from '@paima/db';

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
    if (!walletAddress || !signature) return false;
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
    return false;
  }

  private async createBothAddressesAndDelegate(from: string, to: string): Promise<void> {
    await newAddress.run({ address: from }, this.DBConn);
    await newAddress.run({ address: to }, this.DBConn);
    const [fromAddress] = await getAddressFromAddress.run({ address: from }, this.DBConn);
    const [toAddress] = await getAddressFromAddress.run({ address: to }, this.DBConn);
    await newDelegation.run({ from_id: fromAddress.id, set_id: toAddress.id }, this.DBConn);
  }

  private async deleteDelegationsAndAddress(addressId: number): Promise<void> {
    await deleteDelegationFrom.run({ from_id: addressId }, this.DBConn);
    await deleteAddressId.run({ id: addressId }, this.DBConn);
  }

  private async redelegateTo(oldId: number, newId: number): Promise<void> {
    // the 'from' address may have to delegations, update.
    await updateDelegateTo.run(
      {
        new_to: newId,
        old_to: oldId,
      },
      this.DBConn
    );
  }

  private async cmdDelegate(
    from: string,
    to: string,
    from_signature: string,
    to_signature: string
  ): Promise<void> {
    if (await this.verifySignature(from, this.generateMessage(to), from_signature)) {
      throw new Error('Invalid Signature');
    }
    if (await this.verifySignature(to, this.generateMessage(from), to_signature)) {
      throw new Error('Invalid Signature');
    }
    let [fromAddress] = await getAddressFromAddress.run({ address: from }, this.DBConn);
    let [toAddress] = await getAddressFromAddress.run({ address: to }, this.DBConn);

    if (fromAddress && toAddress) {
      throw new Error('Both addresses are already registered');
    }

    if (!fromAddress && !toAddress) {
      await this.createBothAddressesAndDelegate(from, to);
      return;
    }

    if (fromAddress) {
      const fromDelegations = await getDelegationsFrom.run(
        { from_id: fromAddress.id },
        this.DBConn
      );
      // A address cannot have both from and to delegations.
      if (fromDelegations.length) {
        // Remove all delegations from this address.
        await this.deleteDelegationsAndAddress(fromAddress.id);
        await this.createBothAddressesAndDelegate(from, to);
        return;
      } else {
        await newAddress.run({ address: to }, this.DBConn);
        const [toAddress] = await getAddressFromAddress.run({ address: to }, this.DBConn);
        await this.redelegateTo(fromAddress.id, toAddress.id);
        await newDelegation.run({ from_id: fromAddress.id, set_id: toAddress.id }, this.DBConn);
        return;
      }
    }

    // always true
    if (toAddress) {
      const fromDelegations = await getDelegationsFrom.run({ from_id: toAddress.id }, this.DBConn);
      const toDelegations = await getDelegationsFrom.run({ from_id: toAddress.id }, this.DBConn);
      // A address cannot have both from and to delegations.
      if (fromDelegations.length) {
        // this is a delegated wallet.
        await this.deleteDelegationsAndAddress(toAddress.id);
        await this.createBothAddressesAndDelegate(from, to);
      } else {
      }
    }

    return;
  }

  private async cmdMigrate(
    from: string,
    to: string,
    from_signature: string,
    to_signature: string
  ): Promise<void> {
    if (await this.verifySignature(from, this.generateMessage(to), from_signature)) {
      throw new Error('Invalid Signature');
    }
    if (await this.verifySignature(to, this.generateMessage(from), to_signature)) {
      throw new Error('Invalid Signature');
    }
    const [fromAddress] = getAddressFromAddress.run({ address: from }, this.DBConn);
    const [toAddress] = getAddressFromAddress.run({ address: to }, this.DBConn);
    return;
  }

  private async cmdCancelDelegations(to: string, to_signature: string): Promise<void> {
    if (await this.verifySignature(to, this.generateMessage(), to_signature)) {
      throw new Error('Invalid Signature');
    }
    const [toAddress] = getAddressFromAddress.run({ address: to }, this.DBConn);
    if (!toAddress) return;
  }

  public async getAddressMapping(address: string): Promise<string> {
    const [addressId] = getAddressFromAddress.run({ address }, this.DBConn);
    if (addressId) return;
    // insert new addres
    await newAddress.run({ address }, this.DBConn);
  }

  /*
   * Main entry point. Verify if command is valid and execute it.
   *
   * If returns TRUE this is was an intened as internal command,
   * and the paima-concise command should not passed into the game STF.
   */
  public async process(command: string): Promise<boolean> {
    try {
      if (!command.startsWith(DelegateWallet.INTERNAL_COMMAND_PREFIX)) return false;
      const parsed: ParsedDelegateWalletCommand = DelegateWallet.parser.start(command) as any;
      switch (parsed.command) {
        case 'delegate':
          await this.cmdDelegate(
            parsed.args.from,
            parsed.args.to,
            parsed.args.from_signature,
            parsed.args.to_signature
          );
          break;
        case 'migrate':
          await this.cmdMigrate(
            parsed.args.from,
            parsed.args.to,
            parsed.args.from_signature,
            parsed.args.to_signature
          );
          break;
        case 'cancelDelegations':
          await this.cmdCancelDelegations(parsed.args.to, parsed.args.to_signature);
          break;
        default:
          throw new Error(
            `Delegate Wallet Internal Error : ${JSON.stringify({ parsed, command })}`
          );
      }
    } catch (e) {
      doLog(`Error parsing command: ${command} ${String(error)}`);
    }
    return true;
  }
}
