import type { MergeIntersects } from '@paima/utils';
import type { Static, TComposite, TIntersect, TObject, TPartial } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

type ObjectLike = TComposite<TObject[]>;

export type ConfigProperties<Required extends ObjectLike, Optional extends ObjectLike> = {
  required: Required;
  optional: Optional;
};
export type AllProperties<
  Required extends ObjectLike,
  Optional extends ObjectLike,
  Bool extends boolean,
> = TIntersect<[Required, Bool extends true ? Optional : TPartial<Optional>]>;
export type AllPropertiesFor<Schema extends ConfigSchema<any, any>, Bool extends boolean> =
  Schema extends ConfigSchema<infer Required, infer Optional>
    ? AllProperties<Required, Optional, Bool>
    : never;

export type ToMapping<
  Type extends string,
  T extends Partial<Record<Type, ConfigSchema<TObject, TObject>>>,
> = {
  [K in keyof T]: T[K] extends ConfigSchema<TObject, TObject>
    ? MergeIntersects<Static<AllPropertiesFor<T[K], true>>>
    : never;
};

/**
 * This class is to used to help handle the fact that some fields are required and some are optional.
 *
 * Notably, in some cases we want to allow omitting optional fields (when definining your configuration)
 * But in other cases (ex: using the config after it's been generated), we want to enforce that all optional fields that have a default are present.
 */
export class ConfigSchema<Required extends ObjectLike, Optional extends ObjectLike> {
  constructor(public readonly config: ConfigProperties<Required, Optional>) {
    // TODO: replace once TS5 decorators are better supported
    this.allProperties.bind(this);
    this.defaultProperties.bind(this);
    this.cloneMerge.bind(this);
  }

  allProperties = <Bool extends boolean>(
    requireOptional: Bool
  ): AllProperties<Required, Optional, Bool> => {
    return Type.Intersect([
      this.config.required,
      requireOptional ? this.config.optional : Type.Partial(this.config.optional),
    ]) as any;
  };

  defaultProperties = (): MergeIntersects<Partial<Static<Optional>>> => {
    const defaults = Value.Default(this.config.optional, {});
    return defaults as any;
  };

  cloneMerge = <NewRequired extends ObjectLike, NewOptional extends ObjectLike>(
    newConfig: ConfigProperties<NewRequired, NewOptional> | ConfigSchema<NewRequired, NewOptional>
  ): ConfigSchema<TComposite<[Required, NewRequired]>, TComposite<[Optional, NewOptional]>> => {
    const config = newConfig instanceof ConfigSchema ? newConfig.config : newConfig;
    return new ConfigSchema({
      required: Type.Composite([this.config.required, config.required]),
      optional: Type.Composite([this.config.required, config.required]),
    }) as any;
  };
}
