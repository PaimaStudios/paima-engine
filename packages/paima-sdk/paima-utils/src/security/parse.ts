import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import YAML from 'yaml';
import * as fs from 'fs/promises';
import { ENV } from '../config.js';

const BlockSettings = Type.Object({
  block_height: Type.Integer(),
  prefix: Type.Array(Type.String()),
});

const ReadWrite = Type.Object({
  read: Type.Array(BlockSettings),
  write: Type.String(),
});
const Config = Type.Object({
  namespace: ReadWrite,
});

/** Cache for file content so we don't have to re-read it from disk constantly */
let securityNamespaceConfig: undefined | Static<typeof Config>;

async function loadAndValidateYAML(filename: string): Promise<Static<typeof Config>> {
  if (securityNamespaceConfig != null) return securityNamespaceConfig;

  // this ENV var is used to help with compilation of Paima for browser environments
  // since they can't access fs.readFile,
  //       we instead (at compile time) read the file
  //       and put the file content inside SECURITY_NAMESPACE_ROUTER
  const fileContent = process.env.SECURITY_NAMESPACE_ROUTER
    ? (JSON.parse(process.env.SECURITY_NAMESPACE_ROUTER) as string)
    : await fs.readFile(filename, 'utf-8');
  return await parseAndValidateYAML(fileContent);
}
async function parseAndValidateYAML(fileContent: string): Promise<Static<typeof Config>> {
  if (securityNamespaceConfig != null) return securityNamespaceConfig;
  try {
    // Parse the YAML content into an object
    const yamlObject = YAML.parse(fileContent);

    // Validate the YAML object against the schema
    const validationResult = Value.Check(Config, yamlObject);

    if (!validationResult) {
      // If there are validation errors, throw an error with details
      throw new Error(`Validation errors: ${JSON.stringify(yamlObject)}`);
    }

    // If validation passes, cache and return the validated object
    let securityNamespaceConfig = yamlObject;
    return securityNamespaceConfig;
  } catch (error) {
    throw new Error(`Error loading and validating YAML: ${error}`);
  }
}

async function getEntryFromFile(
  namespace: string,
  blockHeight: number
): Promise<undefined | string[]> {
  const config = await loadAndValidateYAML(namespace);
  let highestEntry: Static<typeof BlockSettings> | null = null;
  for (const entry of config.namespace.read) {
    if (
      highestEntry == null || // first entry we see
      entry.block_height > highestEntry?.block_height // new best entry candidate
    ) {
      // ignore future changes
      if (blockHeight >= entry.block_height) {
        highestEntry = entry;
      }
    }
  }
  return highestEntry?.prefix;
}
export async function getReadNamespaces(blockHeight: number): Promise<string[]> {
  const namespace = ENV.SECURITY_NAMESPACE;

  const entry =
    namespace.endsWith('.yml') || namespace.endsWith('.yaml')
      ? await getEntryFromFile(namespace, blockHeight)
      : [namespace];

  // default if no entry matches
  if (entry == null) {
    return [ENV.CONTRACT_ADDRESS];
  }
  // replace any placeholder with their proper value
  const adjusted = entry.map(prefix =>
    prefix === 'CONTRACT_ADDRESS' ? ENV.CONTRACT_ADDRESS : prefix
  );
  return adjusted;
}

/**
 * Which namespace to use when creating transactions
 * Note: new transactions are always made using the same constant namespace
 */
export async function getWriteNamespace(): Promise<string> {
  const namespace = ENV.SECURITY_NAMESPACE;
  const entry =
    namespace.endsWith('.yml') || namespace.endsWith('.yaml')
      ? await (async (): Promise<string> => {
          const config = await loadAndValidateYAML(namespace);
          return config.namespace.write;
        })()
      : namespace;
  return entry === 'CONTRACT_ADDRESS' ? ENV.CONTRACT_ADDRESS : entry;
}
