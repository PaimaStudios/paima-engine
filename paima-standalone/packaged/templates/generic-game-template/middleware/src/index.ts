import { accountsEndpoints } from './endpoints/accounts';
import { queryEndpoints } from './endpoints/queries';
import { writeEndpoints } from './endpoints/write';

const endpoints = {
  ...accountsEndpoints,
  ...queryEndpoints,
  ...writeEndpoints,
};

export * from './types';

export default endpoints;
