import { INNER_BATCH_DIVIDER, OUTER_BATCH_DIVIDER } from '../batcher';

export const separator = '|';
export const stateIdentifier = '*';

export const FORBIDDEN_CHARACTERS = [separator, INNER_BATCH_DIVIDER, OUTER_BATCH_DIVIDER];
