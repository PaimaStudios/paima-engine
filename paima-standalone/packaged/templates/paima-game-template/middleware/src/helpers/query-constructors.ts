import { getBackendUri } from '../state';
import type { QueryOptions, QueryValue } from '../types';

function queryValueToString(value: QueryValue): string {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    return value.toString(10);
  } else if (typeof value === 'boolean') {
    return value.toString();
  } else {
    throw new Error('[queryValueToString] Invalid query value');
  }
}

function buildQuery(endpoint: string, options: QueryOptions): string {
  const optStrings: string[] = [];
  for (const opt in options) {
    const valString = queryValueToString(options[opt]);
    optStrings.push(`${opt}=${valString}`);
  }
  if (optStrings.length === 0) {
    return endpoint;
  } else {
    return `${endpoint}?${optStrings.join('&')}`;
  }
}

function buildBackendQuery(endpoint: string, options: QueryOptions): string {
  return `${getBackendUri()}/${buildQuery(endpoint, options)}`;
}

export function backendQueryUser(wallet: string): string {
  const endpoint = 'user_state';
  const options = {
    wallet,
  };
  return buildBackendQuery(endpoint, options);
}
