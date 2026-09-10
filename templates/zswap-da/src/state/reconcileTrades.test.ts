// The reconcile rule (project 00040). The bug it pins: a created offer that
// left the book while the SPA was closed or reloaded stayed "Live" forever,
// because the old poll only probed ids THIS page session had seen in the book
// and the old startup probe ran before the wallet scope existed.
import { describe, expect, test } from 'bun:test';
import type { MyTrade, MyTradeStatus } from './myTrades';
import { reconcileTrades, type ProbeResult } from './reconcileTrades';

const rec = (over: Partial<MyTrade> = {}): MyTrade => ({
  id: over.id ?? 't1',
  kind: 'create',
  give: { sym: 'TWBTC', amt: 1_000_000, decimals: 8 },
  get: { sym: 'TWETH', amt: 10_000_000_000_000_000, decimals: 18 },
  at: 1,
  status: 'live',
  shielded: true,
  offerId: 'a'.repeat(64),
  ...over,
});

type Harness = {
  probes: string[];
  updates: Array<[string, MyTradeStatus]>;
  ids: Array<[string, string]>;
  inflight: Set<string>;
  run: (trades: MyTrade[], bookIds?: string[]) => Promise<void>;
};

/** Fake kernel: `answers` maps offerId → status; anything else is not_found. */
function harness(
  answers: Record<string, ProbeResult | (() => Promise<ProbeResult>)> = {},
  deriveId: (blob: string) => string | null = () => null,
): Harness {
  const h: Harness = {
    probes: [],
    updates: [],
    ids: [],
    inflight: new Set<string>(),
    run: (trades, bookIds = []) =>
      reconcileTrades({
        trades,
        bookIds: new Set(bookIds),
        probe: (id) => {
          h.probes.push(id);
          const a = answers[id];
          if (typeof a === 'function') return a();
          return Promise.resolve(a ?? 'not_found');
        },
        inflight: h.inflight,
        update: (tid, s) => { h.updates.push([tid, s]); },
        setOfferId: (tid, id) => { h.ids.push([tid, id]); },
        deriveId,
      }),
  };
  return h;
}

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);

describe('reconcileTrades — the reload case (the reported bug)', () => {
  test('live record absent from the book, kernel says consumed → Filled', async () => {
    const h = harness({ [A]: 'consumed' });
    await h.run([rec({ status: 'live' })]);
    expect(h.probes).toEqual([A]);
    expect(h.updates).toEqual([['t1', 'consumed']]);
  });

  test('… kernel says expired → Expired', async () => {
    const h = harness({ [A]: 'expired' });
    await h.run([rec({ status: 'live' })]);
    expect(h.updates).toEqual([['t1', 'expired']]);
  });

  test('… kernel says cancelled → Cancelled', async () => {
    const h = harness({ [A]: 'cancelled' });
    await h.run([rec({ status: 'live' })]);
    expect(h.updates).toEqual([['t1', 'cancelled']]);
  });

  test('a fresh session (nothing "seen" before) still probes', async () => {
    // The old code required the id to have appeared in the book during this
    // page session. A brand-new inflight set stands for a brand-new session.
    const h = harness({ [A]: 'consumed' });
    expect(h.inflight.size).toBe(0);
    await h.run([rec()]);
    expect(h.probes).toEqual([A]);
    expect(h.updates).toEqual([['t1', 'consumed']]);
  });

  test('not_public records absent from the book are probed too', async () => {
    // An offer that expired before this page ever saw it in the book.
    const h = harness({ [A]: 'expired' });
    await h.run([rec({ status: 'not_public' })]);
    expect(h.updates).toEqual([['t1', 'expired']]);
  });
});

describe('reconcileTrades — kernel lag', () => {
  test('live or not_found leaves the record alone and asks again next poll', async () => {
    const h = harness({ [A]: 'live', [B]: 'not_found' });
    const trades = [rec({ id: 't1', offerId: A }), rec({ id: 't2', offerId: B })];
    await h.run(trades);
    expect(h.updates).toEqual([]);
    await h.run(trades);
    expect(h.probes).toEqual([A, B, A, B]);
    expect(h.inflight.size).toBe(0);
  });

  test('a probe that throws synchronously still releases the id', async () => {
    let n = 0;
    const h = harness({ [A]: () => { if (n++ === 0) throw new Error('sync'); return Promise.resolve('consumed'); } });
    const trades = [rec()];
    await h.run(trades);
    expect(h.updates).toEqual([]);
    expect(h.inflight.size).toBe(0);
    await h.run(trades);
    expect(h.updates).toEqual([['t1', 'consumed']]);
  });

  test('a rejected probe is swallowed and retried', async () => {
    let n = 0;
    const h = harness({ [A]: () => (n++ === 0 ? Promise.reject(new Error('net')) : Promise.resolve('consumed')) });
    const trades = [rec()];
    await h.run(trades);
    expect(h.updates).toEqual([]);
    expect(h.inflight.size).toBe(0);
    await h.run(trades);
    expect(h.updates).toEqual([['t1', 'consumed']]);
  });
});

describe('reconcileTrades — in the book', () => {
  test('present ⇒ no probe; not_public is promoted to live', async () => {
    const h = harness({ [A]: 'consumed' }); // would be wrong to ask
    await h.run([rec({ id: 't1', status: 'not_public' }), rec({ id: 't2', status: 'live' })], [A]);
    expect(h.probes).toEqual([]);
    expect(h.updates).toEqual([['t1', 'live']]);
  });
});

describe('reconcileTrades — dedup', () => {
  test('an id with a probe in flight is not probed again until it settles', async () => {
    let release!: (s: ProbeResult) => void;
    const h = harness({ [A]: () => new Promise<ProbeResult>((r) => { release = r; }) });
    const trades = [rec()];
    const first = h.run(trades);
    expect(h.inflight.has(A)).toBe(true);
    await h.run(trades); // second poll while the first is pending
    expect(h.probes).toEqual([A]);
    release('consumed');
    await first;
    expect(h.updates).toEqual([['t1', 'consumed']]);
    expect(h.inflight.size).toBe(0);
  });

  test('two records sharing one offerId share one probe', async () => {
    const h = harness({ [A]: 'consumed' });
    await h.run([rec({ id: 't1' }), rec({ id: 't2' })]);
    expect(h.probes).toEqual([A]);
    // Only the first record is updated by this pass; the second is picked up
    // on the next poll once the id is no longer in flight.
    expect(h.updates).toEqual([['t1', 'consumed']]);
  });
});

describe('reconcileTrades — legacy blob-only records', () => {
  test('derives, persists and then applies the same rule', async () => {
    const h = harness({ [B]: 'expired' }, (blob) => (blob === 'swapoffer1legacy' ? B : null));
    await h.run([rec({ offerId: undefined, blob: 'swapoffer1legacy' })]);
    expect(h.ids).toEqual([['t1', B]]);
    expect(h.probes).toEqual([B]);
    expect(h.updates).toEqual([['t1', 'expired']]);
  });

  test('a blob that does not decode is left untouched', async () => {
    const h = harness({}, () => null);
    await h.run([rec({ offerId: undefined, blob: 'garbage' })]);
    expect(h.ids).toEqual([]);
    expect(h.probes).toEqual([]);
    expect(h.updates).toEqual([]);
  });

  test('no blob and no id: nothing to do', async () => {
    const h = harness();
    await h.run([rec({ offerId: undefined, blob: undefined })]);
    expect(h.probes).toEqual([]);
  });
});

describe('reconcileTrades — never touches', () => {
  test('take records and terminal create records', async () => {
    const h = harness({ [A]: 'consumed' });
    await h.run([
      rec({ id: 'take', kind: 'take', status: 'consumed' }),
      rec({ id: 'done', status: 'consumed' }),
      rec({ id: 'cxl', status: 'cancelled' }),
      rec({ id: 'exp', status: 'expired' }),
    ]);
    expect(h.probes).toEqual([]);
    expect(h.updates).toEqual([]);
  });

  test('an empty log (no wallet) issues nothing', async () => {
    const h = harness({ [A]: 'consumed' });
    await h.run([]);
    expect(h.probes).toEqual([]);
  });
});
