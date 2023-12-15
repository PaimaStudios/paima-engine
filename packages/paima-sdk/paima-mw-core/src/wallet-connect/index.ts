/*
 * delegate            =   &wd|from|to|from_signature|to_signature
 * migrate             =   &wm|from|to|from_signature|to_signature
 * cancelDelegations   =   &wc|to|to_signature
 */

import { builder } from '@paima/concise';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { awaitBlock } from '../helpers/auxiliary-queries.js';
import { postConciseData } from '../helpers/posting.js';
import type { FailedResult, SuccessfulResult, PostDataResponse, LoginInfo } from '../types.js';
import { WalletMode } from '@paima/providers/src/utils.js';
import {
  EvmInjectedConnector,
  CardanoConnector,
  PolkadotConnector,
  AlgorandConnector,
} from '@paima/providers';
import { ENV } from '@paima/utils';
import { paimaEndpoints } from '../index.js';

export async function walletConnect(
  from: string,
  to: string,
  from_signature: string,
  to_signature: string
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('wallet-connect');

  // walletConnect = &wc|from|to|from_signature|to_signature
  const conciseBuilder = builder.initialize();
  conciseBuilder.setPrefix('&wd');
  conciseBuilder.addValue({ value: from });
  conciseBuilder.addValue({ value: to });
  conciseBuilder.addValue({ value: from_signature });
  conciseBuilder.addValue({ value: to_signature });
  try {
    const result = await postConciseData(conciseBuilder.build(), errorFxn);
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
  from: string,
  to: string,
  from_signature: string,
  to_signature: string
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('wallet-connect');

  // migrate = &wm|from|to|from_signature|to_signature
  const conciseBuilder = builder.initialize();
  conciseBuilder.setPrefix('&wm');
  conciseBuilder.addValue({ value: from });
  conciseBuilder.addValue({ value: to });
  conciseBuilder.addValue({ value: from_signature });
  conciseBuilder.addValue({ value: to_signature });
  try {
    const result = await postConciseData(conciseBuilder.build(), errorFxn);
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
  to: string,
  to_signature: string
): Promise<SuccessfulResult<PostDataResponse> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('wallet-cancel-delegations');

  // walletConnect = &wc|to|to_signature
  const conciseBuilder = builder.initialize();
  conciseBuilder.setPrefix('&wc');
  conciseBuilder.addValue({ value: to });
  conciseBuilder.addValue({ value: to_signature });
  try {
    const result = await postConciseData(conciseBuilder.build(), errorFxn);
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

export type WalletConnectHelperTypes = 'EVM' | 'Cardano' | 'Polkadot' | 'Algorand';

export class WalletConnectHelper {
  private static readonly DELEGATE_WALLET_PREFIX = 'DELEGATE-WALLET';
  private static readonly SEP = ':';

  public buildMessageToSign(subMessage: string): string {
    return `${WalletConnectHelper.DELEGATE_WALLET_PREFIX}${
      WalletConnectHelper.SEP
    }${subMessage.toLocaleLowerCase()}${WalletConnectHelper.SEP}${ENV.CONTRACT_ADDRESS}`;
  }

  private async signWithExternalWallet(
    walletType: WalletConnectHelperTypes,
    message: string
  ): Promise<string> {
    switch (walletType) {
      case 'EVM':
        return (await EvmInjectedConnector.instance().getProvider()?.signMessage(message)) || '';
      case 'Cardano':
        return (await CardanoConnector.instance().getProvider()?.signMessage(message)) || '';
      case 'Polkadot':
        return (await PolkadotConnector.instance().getProvider()?.signMessage(message)) || '';
      case 'Algorand':
        return (await AlgorandConnector.instance().getProvider()?.signMessage(message)) || '';
      default:
        throw new Error('Invalid wallet type');
    }
  }

  public async connectExternalWalletAndSign(
    walletType: WalletConnectHelperTypes,
    walletName: string,
    subMessage: string
  ): Promise<{
    message: string;
    signedMessage: string;
    walletAddress: string;
  }> {
    let loginInfo: LoginInfo;
    switch (walletType) {
      case 'EVM':
        loginInfo = {
          mode: WalletMode.EvmInjected,
          preferBatchedMode: false,
          preference: {
            name: walletName,
          },
          checkChainId: false,
        };
        break;
      case 'Cardano':
        loginInfo = {
          mode: WalletMode.Cardano,
          preference: {
            name: walletName,
          },
        };
        break;
      case 'Polkadot':
        loginInfo = { mode: WalletMode.Polkadot };
        break;
      case 'Algorand':
        loginInfo = { mode: WalletMode.Algorand };
        break;
      default:
        throw new Error('No supported wallet type.');
    }

    const response = await paimaEndpoints.userWalletLogin(loginInfo, false);
    if (!response.success) throw new Error('Cannot connect wallet');

    const toSign = this.buildMessageToSign(subMessage);

    return {
      message: toSign,
      signedMessage: await this.signWithExternalWallet(walletType, toSign),
      walletAddress: response.result.walletAddress,
    };
  }
}
