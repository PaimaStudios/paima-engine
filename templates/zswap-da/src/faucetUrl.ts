export const DEFAULT_FAUCET_URL = 'https://mint-test-tokens.pages.dev/';
export const DEFAULT_MIDNIGHT_NETWORK_ID = 'preprod';

/** Build the external faucet destination without contacting the service. */
export function buildFaucetUrl(
  baseUrl: string | null | undefined,
  networkId: string | null | undefined,
): string {
  const url = new URL(baseUrl?.trim() || DEFAULT_FAUCET_URL);
  const network = networkId?.trim().toLowerCase() || DEFAULT_MIDNIGHT_NETWORK_ID;
  url.searchParams.set('network', network);
  return url.toString();
}
