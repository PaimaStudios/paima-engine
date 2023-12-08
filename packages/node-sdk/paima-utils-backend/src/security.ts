import { ENV, parseAndValidateYAML } from '@paima/utils';
import * as fs from 'fs/promises';

export async function parseSecurityYaml(): Promise<void> {
  const namespace = ENV.SECURITY_NAMESPACE;
  if (namespace.endsWith('.yml') || namespace.endsWith('.yaml')) {
    const content = await fs.readFile(ENV.SECURITY_NAMESPACE, 'utf-8');
    parseAndValidateYAML(content);
  }
}
