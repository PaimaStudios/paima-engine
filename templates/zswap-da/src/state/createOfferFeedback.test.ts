import { describe, expect, test } from 'bun:test';
import { createOfferToast } from './createOfferFeedback';

const ID = 'd6b94d6ce300959bbfc4a6ba737f02864e2db3f6b7e34bb2392f46f55ba0521f';

describe('createOfferToast', () => {
  test('a fresh post says the offer was created, never "already active"', () => {
    const t = createOfferToast({ offerId: ID, duplicate: false, duplicateStatus: null });
    expect(t.kind).toBe('ok');
    expect(t.msg).toBe('Offer created (d6b94d…521f)');
    expect(t.msg).not.toContain('already');
  });

  test('a fresh post without an id still reads as created', () => {
    expect(createOfferToast({ offerId: null, duplicate: false, duplicateStatus: null }).msg).toBe('Offer created');
  });

  test('a duplicate with a known status reports that status as a plain notice', () => {
    const t = createOfferToast({ offerId: ID, duplicate: true, duplicateStatus: 'filled' });
    expect(t.msg).toBe('This offer was already posted (filled)');
    expect(t.kind).toBeUndefined();
  });

  test('a duplicate without a status falls back to the active-intent line', () => {
    const t = createOfferToast({ offerId: ID, duplicate: true, duplicateStatus: null });
    expect(t.msg).toBe('This intent was already active (d6b94d…521f)');
    expect(createOfferToast({ offerId: null, duplicate: true, duplicateStatus: null }).msg)
      .toBe('This intent was already active (existing offer)');
  });
});
