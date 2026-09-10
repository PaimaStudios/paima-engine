// Reconcile the local trade log against the node — the ONE place that decides
// what a created offer's status is.
//
// The rule, applied to every non-terminal `create` record of the active wallet
// on every order-book refresh and every wallet connect:
//
//   in the book            → live   (and never probed: presence is proof)
//   not in the book        → ask GET /v1/offers/:id/status and apply a
//                            terminal answer (consumed / cancelled / expired)
//   'live' or 'not_found'  → leave the record alone; ask again next time
//
// Disappearing from the book is NOT evidence of a fill: it could be a fill, the
// maker spending the inputs elsewhere (cancelled), a TTL lapse (expired), or the
// offer sitting past the first page. So we ask instead of guessing. What we do
// NOT do any more is remember whether THIS page session ever saw the id in the
// book before asking: that memory (`seenIds`) is empty after every reload, so
// an offer filled while the tab was closed stayed "Live" forever (issue behind
// project 00040). The kernel is the authority; page-session memory is not.
//
// Pure: no React, no storage. The hook wires inputs and outputs.

import type { MyTrade, MyTradeStatus } from './myTrades';

export type ProbeResult = 'live' | 'consumed' | 'cancelled' | 'expired' | 'not_found';

export interface ReconcileInput {
  /** The active wallet's records (`listTrades()`). */
  trades: readonly MyTrade[];
  /** offerIds currently in the order book. */
  bookIds: ReadonlySet<string>;
  /** `GET /v1/offers/:id/status`. Must not throw; a failed request is 'not_found'. */
  probe: (offerId: string) => Promise<ProbeResult>;
  /** offerIds with a probe in flight — shared across calls so one poll never
   *  re-issues a request the previous poll is still waiting on. */
  inflight: Set<string>;
  update: (tradeId: string, status: MyTradeStatus) => void;
  /** Persist an offerId derived for a legacy blob-only record. */
  setOfferId: (tradeId: string, offerId: string) => void;
  /** Content hash of a blob, or null when the blob does not decode. */
  deriveId: (blob: string) => string | null;
}

const isTerminal = (s: ProbeResult): s is 'consumed' | 'cancelled' | 'expired' =>
  s === 'consumed' || s === 'cancelled' || s === 'expired';

/**
 * Resolves once every probe issued by THIS call has settled. Callers in the UI
 * fire-and-forget; tests await it.
 */
export function reconcileTrades(input: ReconcileInput): Promise<void> {
  const { trades, bookIds, probe, inflight, update, setOfferId, deriveId } = input;
  const pending: Promise<void>[] = [];

  for (const t of trades) {
    if (t.kind !== 'create') continue;
    if (t.status !== 'not_public' && t.status !== 'live') continue;

    // Records written before content addressing carry only the blob. The id is
    // a pure function of the blob (sha256 of the raw offer bytes), so derive it
    // once, persist it, and treat the record like any other from then on.
    let id = t.offerId;
    if (!id) {
      if (!t.blob) continue;
      const derived = deriveId(t.blob);
      if (!derived) continue;
      setOfferId(t.id, derived);
      id = derived;
    }

    if (bookIds.has(id)) {
      if (t.status === 'not_public') update(t.id, 'live');
      continue;
    }

    if (inflight.has(id)) continue;
    inflight.add(id);
    const tradeId = t.id;
    const probeId = id;
    pending.push(
      probe(probeId)
        .then((srv) => {
          if (isTerminal(srv)) update(tradeId, srv);
          // 'live' here means the book page we hold is stale or filtered;
          // 'not_found' means the node has not indexed it (yet). Neither is a
          // reason to invent a terminal state — the next poll asks again.
        })
        .catch(() => { /* transient; retried on the next poll */ })
        .finally(() => { inflight.delete(probeId); }),
    );
  }

  return Promise.all(pending).then(() => undefined);
}
