import { parseInput, toFullJsonGrammar, toKeyedJsonGrammar, type CommandTuples, type FullJsonGrammar, type GrammarDefinition } from "@paima/concise";
import { AppEvents } from "@paima/events";
import type { Static, TSchema } from "@sinclair/typebox";
import { BaseStfInput, BaseStfOutput } from "./types";

export type ParamToData<T extends readonly Readonly<[string, TSchema]>[]> = {
  [K in T[number] as K[0]]: Static<K[1]>;
};
export type MessageListener<Events extends AppEvents, Params extends readonly Readonly<[string, TSchema]>[]> = (input: BaseStfInput & { parsedInput: ParamToData<Params> }) => Promise<BaseStfOutput<Events>>;

export class PaimaSTM<Grammar extends GrammarDefinition, Events extends AppEvents> {

  public readonly keyedJsonGrammar: CommandTuples<Grammar>;
  public readonly fullJsonGrammar: FullJsonGrammar<Grammar>;

  constructor(public readonly grammar: Grammar) {
    // TODO: replace once TS5 decorators are better supported
    this.addStateTransition.bind(this);
    this.processInput.bind(this);

    this.keyedJsonGrammar = toKeyedJsonGrammar(grammar);
    this.fullJsonGrammar = toFullJsonGrammar(this.keyedJsonGrammar);
  }
  
  messageListeners = new Map<string, MessageListener<Events, readonly Readonly<[string, TSchema]>[]>>();

  addStateTransition<const Prefix extends keyof Grammar & string>(
    prefix: Prefix,
    call: MessageListener<Events, Grammar[Prefix]>
  ) {
    if (this.messageListeners.has(prefix)) {
      throw new Error(`Disallowed: duplicate listener for prefix ${prefix}. Duplicate prefixes can cause determinism issues`);
    }
    this.messageListeners.set(prefix, call);
  }

  async processInput(input: BaseStfInput): Promise<BaseStfOutput<Events>> {
    try {
      const { prefix, grammar, data } = parseInput(input.rawInput.inputData, this.grammar, this.keyedJsonGrammar);
      console.log({ prefix, grammar, data });
      const listener = this.messageListeners.get(prefix);
      if (listener == null) return { stateTransitions: [], events: [] };
      return listener({ ...input, parsedInput: data });
    } catch (_e) {
      console.error(`Skipping input with invalid format: `, input.rawInput.inputData);
      if (_e instanceof Error) {
        console.error(_e.message);
      } 
      return { stateTransitions: [], events: [] };
    }
  }
}
