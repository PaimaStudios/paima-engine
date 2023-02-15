export async function rawWalletLogin(): Promise<string> {
  const accounts = await window.ethereum.request<string[]>({
    method: 'eth_requestAccounts',
  });
  if (!accounts || accounts.length === 0 || !accounts[0]) {
    throw new Error('Unknown error while receiving accounts');
  }
  return accounts[0];
}

export async function sendWalletTransaction(tx: Record<string, any>): Promise<string> {
  const hash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });
  if (typeof hash !== 'string') {
    console.error('[sendWalletTransaction] invalid signature:', hash);
    throw new Error(`[sendWalletTransaction] Received "hash" of type ${typeof hash}`);
  }
  return hash;
}
