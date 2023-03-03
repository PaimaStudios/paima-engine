const LOG_LIMIT = 1000;
let logBuffer: string[] = [];

function stringify(blob: any): string {
  switch (typeof blob) {
    case 'object':
      if (Array.isArray(blob)) {
        return `${blob.map(stringify)}`;
      } else if (blob instanceof Error) {
        return `${blob.toString()}\n${blob.stack}`;
      }
      return JSON.stringify(blob);
    case 'function':
      return 'function';
    default:
      return `${blob}`;
  }
}

export const pushLog = (message: any, ...optionalParams: any[]): void => {
  if (logBuffer.length >= LOG_LIMIT) {
    logBuffer.shift();
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  console.log(message, ...optionalParams);
  const timestamp = new Date().toISOString();
  const fileMessage = `[${timestamp}] ${stringify(message)} ${stringify(optionalParams)}`;
  logBuffer.push(fileMessage);
};

export const joinLogs = (): string => {
  return logBuffer.join('\n');
};
