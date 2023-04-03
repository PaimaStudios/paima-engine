import type { ChainDataExtension } from '@paima/utils';

export function getEarliestStartBlockheight(config: ChainDataExtension[]): number {
  const startBlockheights = config.map(cde => cde.startBlockHeight).filter(sbh => !!sbh);
  const minStartBlockheight = Math.min(...startBlockheights);
  return isFinite(minStartBlockheight) ? minStartBlockheight : 0;
}
