import { JSONParser, TokenType } from '@streamparser/json';

export function encodeToBarSeparated(values: any[]): string {
  return values
    .map(value => {
      // Handle JSON objects or arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      if (value == null) return '';

      // Escape quotes / bars by wrapping it in a JSON stringify
      if (typeof value === 'string' && (value.includes('|') || value.includes('"'))) {
        return JSON.stringify(value);
      }

      let strValue = String(value);

      return strValue;
    })
    .join('|');
}

export function decodeFromBarSeparated(barString: string): (null | string)[] {
  const result: (null | string)[] = [];
  let i = 0;

  // 1) Define parsing rules for tokens
  function parseNextToken(): null | undefined | string {
    if (i >= barString.length) return null; // End of string. Should never happen

    let char = barString[i];

    if (char === '{') {
      const startIdx = i;
      const endIdx = getJsonEndIndex(barString.substring(i));
      if (endIdx == null) return undefined;
      const jsonString = barString.substring(startIdx, startIdx + endIdx);
      i = startIdx + endIdx + 1; // Move index past the closing bracket
      return jsonString;
    }
    if (char === '[') {
      const startIdx = i;
      const endIdx = getArrayEndIndex(barString.substring(i));
      if (endIdx == null) return undefined;
      const jsonString = barString.substring(startIdx, startIdx + endIdx);
      i = startIdx + endIdx + 1; // Move index past the closing bracket
      return jsonString;
    }
    if (char === '"') {
      const startIdx = i;
      const endIdx = getStringEndIndex(barString.substring(i));
      if (endIdx == null) return undefined;
      const jsonString = barString.substring(startIdx, startIdx + endIdx);
      i = startIdx + endIdx + 1; // Move index past the closing bracket
      return jsonString;
    }
    {
      // Parse unquoted primitive (number, boolean, or non-escaped string)
      const startIdx = i;
      while (i < barString.length && barString[i] !== '|') {
        i++;
      }
      // non-quoted empty string -> null
      if (i === startIdx + 1) {
        return null;
      }
      const token = barString.substring(startIdx, i);
      i++; // Move past the separator
      return token;
    }
  }

  // 2) Parse the string step-by-step
  while (i < barString.length) {
    const nextToken = parseNextToken();
    if (nextToken === undefined)
      throw new Error(`Failed to parse string: ${barString.substring(i)}`);
    result.push(nextToken);
  }

  return result;
}

function getEndIndex(
  content: string,
  startToken: TokenType,
  endToken: TokenType
): undefined | number {
  const parser = new JSONParser();
  let depth = 0;
  let end = undefined;
  parser.onToken = ({ token, offset }) => {
    if (token === startToken) depth++;
    if (token === endToken) {
      depth--;
      if (depth === 0) {
        end = offset + 1;
      }
    }
  };
  parser.onValue = () => {};
  parser.onError = _err => {};
  parser.write(content);
  return end;
}
const getJsonEndIndex = (content: string) =>
  getEndIndex(content, TokenType.LEFT_BRACE, TokenType.RIGHT_BRACE);
const getArrayEndIndex = (content: string) =>
  getEndIndex(content, TokenType.LEFT_BRACKET, TokenType.RIGHT_BRACKET);

function getStringEndIndex(content: string): undefined | number {
  // start at 1 since we know the string starts with a quote "
  for (let i = 1; i < content.length; i++) {
    if (content[i] === '"') {
      if (content[i - 1] === '\\') {
        continue;
      }
      return i + 1;
    }
  }
  return content.length;
}
