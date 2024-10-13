import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { awaitBlock } from '../helpers/auxiliary-queries.js';
import { postConciseData } from '../helpers/posting.js';
import type { PostDataResponse, LoginInfo } from '../types.js';
import type { IProvider } from '@paima/providers';
import {
  EvmInjectedConnector,
  CardanoConnector,
  PolkadotConnector,
  AlgorandConnector,
  WalletMode,
  MinaConnector,
} from '@paima/providers';
import { AddressType } from '@paima/utils';
import type { FailedResult, SuccessfulResult } from '@paima/utils';
import { paimaEndpoints } from '../index.js';
import assertNever from 'assert-never';
import { BuiltinGrammar, BuiltinGrammarPrefix, generateStmInput } from '@paima/concise';

export async function walletConnect(
  from: string | null,
  to: string | null,
  from_signature: string,
  to_signature: string
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('delegate-wallet');

  const input = generateStmInput(BuiltinGrammar, BuiltinGrammarPrefix.delegateWallet, {
    from,
    to,
    from_signature,
    to_signature,
  });
  try {
    const result = await postConciseData(JSON.stringify(input), errorFxn);
    if (!result.success) {
      return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN);
    }
    const blockHeightTX = result.blockHeight;
    await awaitBlock(blockHeightTX);
    return { success: true, result };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN, err);
  }
}

export async function walletConnectMigrate(
  from: string | null,
  to: string | null,
  from_signature: string,
  to_signature: string
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('delegate-wallet-migrate');

  const input = generateStmInput(BuiltinGrammar, BuiltinGrammarPrefix.migrateWallet, {
    from,
    to,
    from_signature,
    to_signature,
  });
  try {
    const result = await postConciseData(JSON.stringify(input), errorFxn);
    if (!result.success) {
      return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN);
    }
    const blockHeightTX = result.blockHeight;
    await awaitBlock(blockHeightTX);
    return { success: true, result };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN, err);
  }
}

export async function walletConnectCancelDelegations(
  to: string | null
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('delegate-wallet-cancel');

  const input = generateStmInput(BuiltinGrammar, BuiltinGrammarPrefix.cancelDelegations, {
    to,
  });
  try {
    const result = await postConciseData(JSON.stringify(input), errorFxn);
    if (!result.success) {
      return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN);
    }
    const blockHeightTX = result.blockHeight;
    await awaitBlock(blockHeightTX);
    return { success: true, result };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN, err);
  }
}

export class WalletConnectHelper {
  private static readonly DELEGATE_WALLET_PREFIX = 'DELEGATE-WALLET';
  private static readonly SEP = ':';

  public buildMessageToSign(subMessage: string): string {
    return `${WalletConnectHelper.DELEGATE_WALLET_PREFIX}${WalletConnectHelper.SEP}${subMessage.toLocaleLowerCase()}`;
  }

  private getProvider(walletType: AddressType): IProvider<unknown> {
    let provider: IProvider<unknown> | undefined;
    switch (walletType) {
      case AddressType.EVM:
        provider = EvmInjectedConnector.instance().getProvider();
        break;
      case AddressType.CARDANO:
        provider = CardanoConnector.instance().getProvider();
        break;
      case AddressType.POLKADOT:
        provider = PolkadotConnector.instance().getProvider();
        break;
      case AddressType.ALGORAND:
        provider = AlgorandConnector.instance().getProvider();
        break;
      case AddressType.MINA:
        provider = MinaConnector.instance().getProvider();
        break;
    }
    if (!provider) throw new Error('Cannot get provider ' + walletType);
    return provider;
  }

  private async signWithExternalWallet(walletType: AddressType, message: string): Promise<string> {
    return await this.getProvider(walletType).signMessage(message);
  }

  private getLoginInfo(walletType: AddressType, walletName: string): LoginInfo {
    let loginInfo: LoginInfo | undefined;
    switch (walletType) {
      case AddressType.EVM:
        loginInfo = {
          mode: WalletMode.EvmInjected,
          preferBatchedMode: false,
          preference: {
            name: walletName,
          },
          checkChainId: false,
        };
        break;
      case AddressType.CARDANO:
        loginInfo = {
          mode: WalletMode.Cardano,
          preference: {
            name: walletName,
          },
        };
        break;
      case AddressType.POLKADOT:
        loginInfo = { mode: WalletMode.Polkadot };
        break;
      case AddressType.ALGORAND:
        loginInfo = { mode: WalletMode.Algorand };
        break;
      case AddressType.MINA:
        loginInfo = { mode: WalletMode.Mina };
        break;
      default:
        assertNever.default(walletType);
    }
    if (!loginInfo) throw new Error(`Cannot get loginInfo for ${walletType} ${walletName}`);
    return loginInfo;
  }

  // This function connects an external wallet and signs a message for wallet-connect
  // The signed message format is: DELEGATE-WALLET:subMessage:contractAddress
  public async connectExternalWalletAndSign(
    walletType: AddressType,
    walletName: string,
    subMessage: string
  ): Promise<{
    message: string;
    signedMessage: string;
    walletAddress: string;
  }> {
    const loginInfo = this.getLoginInfo(walletType, walletName);
    const response = await paimaEndpoints.userWalletLogin(loginInfo, false);
    if (!response.success) throw new Error(`Cannot connect wallet ${walletType} ${walletName}`);

    const messageToSign = this.buildMessageToSign(subMessage);
    return {
      message: messageToSign,
      signedMessage: await this.signWithExternalWallet(walletType, messageToSign),
      walletAddress: response.result.walletAddress,
    };
  }
}
