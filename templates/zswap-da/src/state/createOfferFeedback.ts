// The toast shown after `createOffer` resolves. Kept as a pure function because
// the three outcomes (posted, already indexed with a known status, already
// active without one) once collapsed into a single "already active" line that
// fired on every successful post — the offer had landed, but the copy said
// otherwise.
import { shortToken } from '../utils';
import type { OfferStatus } from '../types';

export interface CreateOfferOutcome {
  /** Id from `POST /v1/offers`, or the active offer's id on a 409 duplicate. */
  offerId: string | null;
  /** True when the node answered 409 DUPLICATE_OFFER / DUPLICATE_MARKERS. */
  duplicate: boolean;
  /** Lifecycle status the node reported alongside the duplicate, if any. */
  duplicateStatus: OfferStatus | null;
}

export function createOfferToast(o: CreateOfferOutcome): { msg: string; kind: 'ok' | undefined } {
  if (!o.duplicate) {
    return { msg: o.offerId ? `Offer created (${shortToken(o.offerId)})` : 'Offer created', kind: 'ok' };
  }
  if (o.duplicateStatus) {
    return { msg: `This offer was already posted (${o.duplicateStatus})`, kind: undefined };
  }
  return { msg: `This intent was already active (${o.offerId ? shortToken(o.offerId) : 'existing offer'})`, kind: 'ok' };
}
