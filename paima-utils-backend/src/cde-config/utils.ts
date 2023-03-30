import type { ChainDataExtension } from '@paima/utils';

export function getEarliestStartBlockheight(config: ChainDataExtension[]): number {
  const startBlockheights = config.map(cde => cde.startBlockHeight).filter(sbh => !!sbh);
  return Math.min(0, ...startBlockheights);
}
