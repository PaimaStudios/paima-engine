import { Type } from '@sinclair/typebox';

/**
 * How deep a block needs to be before the funnel considers it
 * ex: 0 -> instant finality
 * DANGER: this will block all funnels if we're waiting for this block to become finalized
 *
 * See parallel funnel docs for more
 */
export const ConfirmationDepth = (defaultDepth: number) => Type.Number({ default: defaultDepth });

/**
 * How old should a block be before we block waiting for it to become finalized
 * ex: 0 -> consider the block as soon as it appears onchain
 * Note: this is generally (confirmationDepth * blockTime) + some buffer
 *
 *  The delay is used to account for the fact that
 *  a) some chains have approximate block time (ex: 2s +- 0.1)
 *  b) network latency means a block created might take a bit longer to get to you
 *
 * See parallel funnel docs for more
 */
export const Delay = (defaultDepth: number) => Type.Number({ default: defaultDepth });

export function waitingPeriodFromDepth(
  defaultDepth: number,
  blockTimeMs: number,
  offset: { factor?: number; absolute?: number } = {}
) {
  let delayMs = defaultDepth * blockTimeMs;
  if (offset.factor != null) delayMs *= offset.factor;
  if (offset.absolute != null) delayMs += offset.absolute;
  return {
    confirmationDepth: ConfirmationDepth(defaultDepth),
    delayMs: Delay(delayMs),
  };
}
