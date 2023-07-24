import type { IToken, Parser } from 'ebnf';
import { Grammars } from 'ebnf';

//
// This Parser converts PaimaLang:
// ----------------------------------------
// const paimaLang = `
// createLobby         = c|numOfRounds|roundLength|isHidden?|isPractice?
// joinedLobby         = j|*lobbyID
// closeLobby          = cs|*lobbyID
// moves               = s|*lobbyID|roundNumber|move_rps
// zombieScheduledData = z|*lobbyID
// userScheduledData   = @u|result
// sample              = x|sampleParam
// `
// ----------------------------------------
// into parseable eBNF W3C grammar
//
// syntax ::= createLobby | otherCommand
// createLobby ::= "c" pipe asterisk lobby pipe numOfRounds pipe roundLength pipe isHidden? pipe isPractice?
// otherCommand ::= "x" pipe asterisk lobby pipe numOfRounds pipe roundLength pipe isHidden? pipe isPractice?
// asterisk  ::= "*"
// pipe ::= "|"
// lobby ::= [a-zA-Z0-9]*
// numOfRounds ::= [a-zA-Z0-9]*
// roundLength ::= [a-zA-Z0-9]*
// isHidden ::= [a-zA-Z0-9]*
// isPractice ::= [a-zA-Z0-9]*
//
// and mixes this with the commands:
// -------------------------------------------------
// {
//    [key: commandName] : {
//                [key: parameterName] : function | string | number | boolean | null
//    }
// }
// -------------------------------------------------
//
// Where commandName is createLobby | joinedLobby | closeLobby | etc
// and parameterName is numOfRounds | roundLength | isHidden
//
// A special parameterName "renameCommand" is used for RENAMING the command in the output.
// Because PaimaLang doesn't allow duplicated commandNames
//
// There are some reserved parameterName: asterisk | pipe | syntax | at | char
//
// PaimaParser includes Parsers for common types, e.g., Numbers, Booleans, WalletAddress, etc.
// Or accepts inlined custom functions with the signature (key: string, value: string) => string
//
// For example a "command" definition for the previous PaimaLang:
//
// const command = {
//   createLobby: {
//     numOfRounds: PaimaParser.NumberParser(3, 1000),
//     roundLength: PaimaParser.RoundLength(),
//     isHidden: PaimaParser.TrueFalseParser(false),
//     isPractice: PaimaParser.TrueFalseParser(false),
//   },
//   joinedLobby: {
//     lobbyID: PaimaParser.NCharsParser(12, 12),
//   },
//   closeLobby: {
//     lobbyID: PaimaParser.NCharsParser(12, 12),
//   },
//   moves: {
//     lobbyID: PaimaParser.NCharsParser(12, 12),
//     roundNumber: PaimaParser.NumberParser(1, 1000),
//     move_rps: PaimaParser.RegexParser(/^[RPS]$/),
//   },
//   zombieScheduledData: {
//     renameCommand: 'scheduledData',
//     lobbyID: PaimaParser.NCharsParser(12, 12),
//   },
//   userScheduledData: {
//     renameCommand: 'scheduledData',
//     user: PaimaParser.WalletAddress(),
//     result: PaimaParser.RegexParser(/^[w|t|l]$/),
//   },
//   sample: {
//     sampleParam: (key: string, input: string) => {
//        if (!input) throw new Error(`${key} input must be defined`);
//        return input.split('').reverse().join(''); // reverse strings
//     }
//   },
// };
//
// To create the parser create a instance of the parser
// And parse the inputs with p.start(input)
// -------------------------------------------------
// const p = new PaimaParser(false, paimaLang, command);
// try {
//    const output = p.start('x|helloWorld');
//  } catch (e) {
//    // could not parse the input.
//  }
// -------------------------------------------------
//  will output: { command: sample, args : { sampleParam: 'helloWorld' } }
//
type ParserValues = string | boolean | number | null;
type ParserCommandExec = (keyName: string, input: string) => ParserValues | ParserValues[];

type InputKeys<T> = keyof Omit<T, 'input'>;
export type ParserRecord<T = { input: string }> = Record<
  InputKeys<T>,
  ParserValues | ParserCommandExec
> & {
  renameCommand?: string;
};

export type ParserCommands = Record<string, ParserRecord>;

/**
 * WARN - allows only a-zA-Z0-9+/=,_ characters regardless of the parser specified
 * Also, characters |*@ are used for internal purposes
 */
export class PaimaParser {
  private readonly grammar: string;
  private readonly commands: ParserCommands;
  private readonly parser: Parser;

  // overly simple logging API. Generally set to process.env.NODE_ENV === 'development'
  private readonly debug: boolean;

  constructor(paimaLang: string, commands: ParserCommands, debug: boolean = false) {
    this.grammar = this.paimaLangToBNF(paimaLang);
    this.parser = new Grammars.W3C.Parser(this.grammar);
    this.commands = commands;
    this.debug = debug;
  }

  // Convert PaimaLang definition to eBNF (W3C)
  private paimaLangToBNF(paimaLang: string): string {
    const commandParameters: Record<string, string[]> = {};
    const commandLiterals: Record<string, string> = {};

    /*
     * Extract commands, parameters and literals
     * a = b|c|d , e = f|g into { a: [c,d], e: [g] } and { a: b, e: f }
     */
    let grammar = paimaLang
      .split('\n')
      .map(x => x.trim())
      .filter(x => x)
      .map(x => {
        // myCommandName = s|custom|named|parameters
        const parts = x.split('=').map(x => x.trim());
        if (parts.length !== 2) throw new Error('Incorrect parser format');
        const c = parts[1].split('|').filter(x => !!x); // filter when pipe is at end e.g., "j|"
        const literal = c.shift();
        if (!literal) throw new Error('Missing literal');
        const hasUserAt = literal.match(/^@(\w+)/);
        if (hasUserAt) {
          commandLiterals[parts[0]] = `at "${hasUserAt[1]}"`;
        } else {
          commandLiterals[parts[0]] = `"${literal}"`;
        }
        commandParameters[parts[0]] = c;
      })
      .join('');

    // keep track of unique parameters.
    const uniqueParameters: Set<string> = new Set();
    grammar = `syntax ::= ${Object.keys(commandParameters).join(' | ')}\n`;
    Object.keys(commandParameters).forEach(key => {
      grammar += `${key} ::= ${commandLiterals[key]} pipe ${commandParameters[key]
        .map(parameter => {
          // Check for asterisks and optional question marks
          if (parameter.match(/\*/)) {
            const partNoAsterisk = parameter.replace(/\*/, '');
            uniqueParameters.add(partNoAsterisk);
            return `asterisk ${partNoAsterisk}`;
          }
          if (parameter.match(/\?$/)) {
            const partNoOptional = parameter.replace(/\?$/, '');
            uniqueParameters.add(partNoOptional);
            return `${partNoOptional}?`;
          }

          uniqueParameters.add(parameter);
          return parameter;
        })
        .join(' pipe ')}\n`;
    });

    // Add standard - common expressions to parse * and |
    grammar += `
asterisk  ::= "*"
pipe ::= "|" 
at ::= "@"
`;

    // Add parameters back-into grammar
    [...uniqueParameters].forEach(w => {
      // ([#x00-#x7b] | [#x7d-#xff])
      // 7c |
      grammar += `${w} ::= ([#x00-#x7b] | [#x7d-#xffff])+ \n`;
    });

    this.log(`Parser Syntax: \n----------------\n${grammar}\n----------------`);
    return grammar;
  }

  public static OptionalParser(
    defaultValue: ParserValues,
    parser: ParserCommandExec
  ): ParserCommandExec {
    return (keyName: string, input: string): ParserValues => {
      if (input === undefined || input === null) return defaultValue;
      return parser(keyName, input) as ParserValues;
    };
  }

  public static ArrayParser<T extends ParserValues>(iter: {
    item: ParserCommandExec;
  }): ParserCommandExec {
    return (keyName: string, input: string): T[] => {
      if (input == null) return [];
      const parts: ParserValues[] = (input.split(',') || []).map(
        (x, index) => iter.item(`${keyName}-${index}`, x) as ParserValues
      );
      return parts as any;
    };
  }

  public static TrueFalseParser(defaultValue?: boolean): ParserCommandExec {
    return (keyName: string, input: string): boolean => {
      const hasDefault = typeof defaultValue === 'boolean';
      if (input == null && hasDefault) return defaultValue;
      if (input == null && !hasDefault) throw new Error(`${keyName} must be T or F`);
      if (input === 'T' || input === 'F') return input === 'T';
      throw new Error(`${keyName} must be T or F`);
    };
  }

  public static DefaultRoundLength(blockTimeInSecs: number): ParserCommandExec {
    return (keyName: string, input: string): number => {
      if (input == null) throw new Error(`${keyName} must be defined`);
      const n = parseInt(input, 10);
      const BLOCKS_PER_MINUTE = 60 / blockTimeInSecs;
      const BLOCKS_PER_DAY = BLOCKS_PER_MINUTE * 60 * 24;
      if (n < BLOCKS_PER_MINUTE) throw new Error(`${keyName} is less then ${BLOCKS_PER_MINUTE}`);
      if (n > BLOCKS_PER_DAY) throw new Error(`${keyName} is greater then ${BLOCKS_PER_DAY}`);
      return n;
    };
  }

  public static NumberParser(min?: number, max?: number): ParserCommandExec {
    return (keyName: string, input: string): number => {
      if (input == null) throw new Error(`${keyName} must be defined`);
      const n = parseInt(input, 10);
      if (isNaN(n)) throw new Error(`${keyName} not a number`);
      if (min != undefined && n < min) throw new Error(`${keyName} must be greater than ${min}`);
      if (max != undefined && n > max) throw new Error(`${keyName} must be less than ${max}`);
      return n;
    };
  }

  public static NCharsParser(minChars: number, maxChars: number): ParserCommandExec {
    return (keyName: string, input: string): string => {
      if (input == null) throw new Error(`${keyName} must be defined`);
      if (input.length < minChars)
        throw new Error(`${keyName} must have more chars than ${minChars}`);
      if (input.length > maxChars)
        throw new Error(`${keyName} must have less chars than ${maxChars}`);
      return input;
    };
  }

  public static RegexParser(regex: RegExp): ParserCommandExec {
    return (keyName: string, input: string): string => {
      if (input == null) throw new Error(`${keyName} must be defined`);
      if (!input.match(regex)) throw new Error(`${keyName}: must match ${String(regex)}`);
      return input;
    };
  }

  public static HexParser(): ParserCommandExec {
    return PaimaParser.RegexParser(/0x([0-9a-f]+)/);
  }

  public static WalletAddress(): ParserCommandExec {
    return PaimaParser.RegexParser(/^[a-zA-Z0-9_]+$/);
  }

  public static EnumParser(
    values: readonly string[],
    transform?: (value: string) => string
  ): ParserCommandExec {
    return (keyName: string, input: string): string => {
      if (input == null) throw new Error(`${keyName} must be defined`);
      if (!values.includes(input)) {
        throw new Error(`${input} not found in provided list of possible values`);
      }
      return transform ? transform(input) : input;
    };
  }

  private log(message: string): void {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[Paima-Parser]', message);
    }
  }

  start(sentence: string): {
    command: string;
    args: Record<string, ParserValues | ParserValues[]>;
  } {
    const parseTree: IToken = this.parser.getAST(sentence);

    if (!parseTree) {
      this.log(`Error parsing ${sentence}`);
      throw new Error('Cannot parse: ' + sentence);
    }

    const getFromTree = (type: string, ast: IToken): string =>
      ast?.children?.find(c => c.type === type)?.text as string;

    const interpreter: Record<string, ParserValues | ParserCommandExec> =
      this.commands[parseTree.children[0].type];
    const results: Record<string, ParserValues | ParserValues[]> = {};
    Object.keys(interpreter).forEach((key: string) => {
      const parserCommand: ParserValues | ParserCommandExec = interpreter[key];
      if (parserCommand && typeof parserCommand === 'function') {
        results[key] = parserCommand(key, getFromTree(key, parseTree.children[0]));
      } else if (key !== 'renameCommand') {
        // Copy static keys into final object as 'type: zombie'
        results[key] = parserCommand;
      }
    });

    return {
      command: (interpreter.renameCommand as string) || parseTree.children[0].type,
      args: results,
    };
  }
}
