import type { TNumber, TSchema } from '@sinclair/typebox';
import { Type, TypeGuard } from '@sinclair/typebox';
import type { LogEvent, LogEventFields } from './types.js';
import type { AbiParameter } from 'abitype';

export function fieldToAbi<Type extends TSchema>(type: Type): AbiParameter | undefined {
  const isString = Type.Extends(type, Type.String(), Type.Literal(true), Type.Literal(false)).const;
  if (isString) {
    return { type: 'string' };
  }
  const isNumber = Type.Extends(type, Type.Number(), Type.Literal(true), Type.Literal(false)).const;
  if (isNumber) {
    const minimum = (type as unknown as TNumber).minimum;
    const maximum = (type as unknown as TNumber).maximum;
    const isSigned = minimum != null && minimum < 0;
    const bits = maximum == null ? null : Math.log2(isSigned ? maximum + 1 : maximum);
    const suffix = bits == null || !Number.isInteger(bits) ? '' : isSigned ? bits + 1 : bits;
    return { type: `${isSigned ? 'int' : 'uint'}${suffix}` };
  }
  const isBoolean = Type.Extends(
    type,
    Type.Boolean(),
    Type.Literal(true),
    Type.Literal(false)
  ).const;
  if (isBoolean) {
    return { type: 'bool' };
  }
  if (TypeGuard.IsTuple(type)) {
    const components: AbiParameter[] = [];
    for (const subtype of type.items?.map(t => fieldToAbi(t)) ?? []) {
      if (subtype == null) return undefined;
      components.push(subtype);
    }
    return {
      type: 'tuple',
      components,
    };
  }
  if (TypeGuard.IsArray(type)) {
    const innerType = fieldToAbi(type.items);
    if (innerType == null) return undefined;
    return { type: `${innerType.type}[]` };
  }
  // TODO: address
  // TODO: bytes
  // TODO: support refining to numbers larger than max JS Number size (ex: uint256)
  return undefined;
}
export function toEvmAbi<const T extends LogEvent<LogEventFields<TSchema>[]>>(
  log: T
): undefined | AbiParameter[] {
  const params: AbiParameter[] = [];
  for (const field of log.fields) {
    const parsedField = fieldToAbi(field.type);
    if (parsedField == null) return undefined;
    params.push({
      ...parsedField,
      name: field.name,
    });
  }
  return params;
}
