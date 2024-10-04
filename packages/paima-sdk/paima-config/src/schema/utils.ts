import type { Static, TComposite, TIntersect, TObject, TPartial, TSchema } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

type ObjectLike = TComposite<TObject[]>;

export type ConfigProperties<Required extends ObjectLike, Optional extends ObjectLike> = {
  required: Required;
  optional: Optional;
};
export class ConfigSchema<Required extends ObjectLike, Optional extends ObjectLike> {
  constructor(public readonly config: ConfigProperties<Required, Optional>) {
    // TODO: replace once TS5 decorators are better supported
    this.allProperties.bind(this);
    this.defaultProperties.bind(this);
    this.cloneMerge.bind(this);
  }

  allProperties = <Bool extends boolean>(
    requireOptional: Bool
  ): TIntersect<[Required, Bool extends true ? Optional : TPartial<Optional>]> => {
    return Type.Intersect([
      this.config.required,
      requireOptional ? this.config.optional : Type.Partial(this.config.optional),
    ]) as any;
  };

  defaultProperties = (): Partial<Static<Optional>> => {
    // TODO: this is hacky. Do we need this function?
    const defaults = Object.keys(this.config.optional.properties).reduce(
      (acc, next) => {
        const schema = (this.config.optional.properties as Record<string, TSchema>)[next];
        if ('default' in schema) {
          // Typescript can't know this actually matches the type
          (acc as any)[next] = schema.default;
        }
        return acc;
      },
      {} as Partial<Static<Optional>>
    );
    return defaults;
  };

  cloneMerge = <NewRequired extends ObjectLike, NewOptional extends ObjectLike>(
    newConfig: ConfigProperties<NewRequired, NewOptional>
  ): ConfigSchema<TComposite<[Required, NewRequired]>, TComposite<[Optional, NewOptional]>> => {
    return new ConfigSchema({
      required: Type.Composite([this.config.required, newConfig.required]),
      optional: Type.Composite([this.config.required, newConfig.required]),
    }) as any;
  };
}
