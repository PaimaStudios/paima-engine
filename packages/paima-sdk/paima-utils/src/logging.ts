import { stringify } from 'flatted';

export function logError(error: unknown): void {
  doLog(`***ERROR***`);
  doLog(error);
  doLog(`***`);
}

type LoggerFunc = (str: string) => void;

class LoggerHolder {
  static INSTANCE = new LoggerHolder();
  log: LoggerFunc = _s => {};
}

export function setLogger(newLogger: LoggerFunc): void {
  LoggerHolder.INSTANCE.log = newLogger;
}

// TODO: probably we want to unify this with pushLog
export function doLog(...s: unknown[]): void {
  console.log(...s);
  for (const str of s) {
    if (typeof str !== 'object') {
      if (typeof str === 'function') {
        continue;
      }
      LoggerHolder.INSTANCE.log(String(str));
    } else if (str instanceof Error) {
      LoggerHolder.INSTANCE.log(`${str.name}: ${str.message}\nStack: ${str.stack}`);
    } else {
      try {
        LoggerHolder.INSTANCE.log(stringify(str));
      } catch (e) {
        // should not happen, but maybe there is some type that fails for some reason
      }
    }
  }
}
