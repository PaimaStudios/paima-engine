import { getBackendUri, getBatcherUri } from '../state.js';
import type { QueryOptions, QueryValue } from '../types.js';

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

export function buildQuery(endpoint: string, options: QueryOptions): string {
  const optStrings: string[] = [];
  for (let opt in options) {
    const valString = queryValueToString(options[opt]);
    optStrings.push(`${opt}=${valString}`);
  }
  if (optStrings.length === 0) {
    return endpoint;
  } else {
    return `${endpoint}?${optStrings.join('&')}`;
  }
}

export function buildBackendQuery(endpoint: string, options: QueryOptions): string {
  return `${getBackendUri()}/${buildQuery(endpoint, options)}`;
}

export function buildBatcherQuery(endpoint: string, options: QueryOptions): string {
  return `${getBatcherUri()}/${buildQuery(endpoint, options)}`;
}

export function backendQueryLatestProcessedBlockHeight(): string {
  const endpoint = 'latest_processed_blockheight';
  const options = {};
  return buildBackendQuery(endpoint, options);
}

export function backendQueryBackendVersion(): string {
  const endpoint = 'backend_version';
  const options = {};
  return buildBackendQuery(endpoint, options);
}

export function backendQueryEmulatedBlocksActive(): string {
  const endpoint = 'emulated_blocks_active';
  const options = {};
  return buildBackendQuery(endpoint, options);
}

export function backendQueryDeploymentBlockheightToEmulated(deploymentBlockheight: number): string {
  const endpoint = 'deployment_blockheight_to_emulated';
  const options = {
    deploymentBlockheight,
  };
  return buildBackendQuery(endpoint, options);
}

export function batcherQuerySubmitUserInput(): string {
  const endpoint = 'submit_user_input';
  const options = {};
  return buildBatcherQuery(endpoint, options);
}

export function batcherQueryTrackUserInput(inputHash: string): string {
  const endpoint = 'track_user_input';
  const options = {
    input_hash: inputHash,
  };
  return buildBatcherQuery(endpoint, options);
}
