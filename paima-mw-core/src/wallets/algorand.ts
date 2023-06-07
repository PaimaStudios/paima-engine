import { PeraWalletConnect } from "@perawallet/connect";
import { getAlgorandAddress, setAlgorandAddress, setAlgorandApi } from "../state";
import type { Result, Wallet } from "../types";
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from "../errors";

async function peraLogin() {
    const peraWallet = new PeraWalletConnect();
    const newAccounts = await peraWallet.connect();
    if (newAccounts.length < 1) {
        throw new Error('[peraLogin] no addresses returned!');
    }
    const address = newAccounts[0];
    setAlgorandAddress(address);
    setAlgorandApi(peraWallet);
}

export async function algorandLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  try {
    await peraLogin();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ALGORAND_LOGIN, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getAlgorandAddress(),
    },
  };
}
