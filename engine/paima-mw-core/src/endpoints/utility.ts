import { joinLogs, pushLog as log } from '../helpers/logging';

const exportLogs = (): string => {
  return joinLogs();
};

/**
 * Re-exported simply to follow the structure of functions utilized from Unity
 */
export const utilityEndpoints = {
  exportLogs,
  pushLog: log,
};
