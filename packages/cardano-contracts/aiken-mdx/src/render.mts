#!/usr/bin/env ts-node

import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Command } from 'commander';
import toml from 'toml';
import { fileURLToPath } from 'url';

/* eslint-disable @typescript-eslint/no-unsafe-argument */

const program = new Command();

program
  .requiredOption('-o, --output <path>', 'output file path (ex: ./out.mdx)')
  .option('-single, --single <path>', 'folder for a single Aiken project to use as input')
  .option(
    '-multiple, --multiple <path>',
    'file path for a handlebar (.hbs) file that describes which folders to use'
  )
  .parse(process.argv);

const options = program.opts();

if ((options.single && options.multiple) || (!options.single && !options.multiple)) {
  console.error('You must specify either --single or --multiple, but not both.');
  process.exit(1);
}

if (!options.output) {
  console.error('Output path must be specified with -o <path>');
  process.exit(1);
}

function relativeToFile(source: string): string {
  return path.dirname(fileURLToPath(import.meta.url)) + source;
}
function getTemplate(source: string): HandlebarsTemplateDelegate<any> {
  const template = fs.readFileSync(source, 'utf8');
  const compiled = Handlebars.compile(template);
  return compiled;
}
const plutusTemplate = getTemplate(relativeToFile('/templates/plutus.hbs'));
const preludeTemplate = getTemplate(relativeToFile('/templates/prelude.hbs'));

/**
 * plutus.json doesn't keep track of which file is a dependency and which is local
 * so to differentiate this, we first find all the local files
 */
async function getDirectories(srcPath: string): Promise<string[]> {
  const directories: string[] = [];

  const items = await fs.promises.readdir(srcPath, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      directories.push(item.name);

      // get sub-folders as well
      const fullPath = path.join(srcPath, item.name);
      const subDirectories = await getDirectories(fullPath);
      for (const subDir of subDirectories) {
        // plutus.json uses / to represent paths
        directories.push(item.name + '/' + subDir);
      }
    }
  }

  return directories;
}

type AikenBuiltins = 'constructor' | 'list' | 'map' | 'bytes' | 'integer';
const AllTypes: AikenBuiltins[] = ['constructor', 'list', 'map', 'bytes', 'integer'] as const;

type TypeCategory = {
  category: AikenBuiltins;
  scopes: TypeScope[];
};
type TypeScope = {
  scope: string;
  isLocal: boolean;
  names: TypeName[];
};
type TypeName = {
  local: string;
  original: string;
};
function filterDefinitions(
  directories: string[],
  context: any
): Map<AikenBuiltins, Map<string, TypeScope>> {
  const categories: Map<AikenBuiltins, Map<string, TypeScope>> = new Map();
  for (const key of Object.keys(context)) {
    for (const dir of directories) {
      // wrapper types in plutus.json have a special syntax
      // local_type $ wrapped_type
      const wrapperEndIndex = key.indexOf('$');
      const adjustedKey = wrapperEndIndex === -1 ? key : key.substring(0, wrapperEndIndex);

      // data types native to Aiken (ex: ByteArray)
      if (context[key].title == null || context[key].title === 'Tuple') {
        continue;
      }

      const endOfScope = adjustedKey.lastIndexOf('/');
      const scope = endOfScope === -1 ? adjustedKey : adjustedKey.substring(0, endOfScope);

      const category = context[key].anyOf != null ? 'constructor' : context[key].dataType;
      let scopes = categories.get(category);
      if (scopes == null) {
        scopes = new Map();
        categories.set(category, scopes);
      }
      let scopeEntry = scopes.get(scope);
      if (scopeEntry == null) {
        scopeEntry = {
          scope,
          isLocal: adjustedKey.startsWith(dir),
          names: [],
        };
        scopes.set(scope, scopeEntry);
      }
      scopeEntry.names.push({
        local: adjustedKey,
        original: key,
      });
    }
  }

  return categories;
}

type EnumType = {
  type: 'EnumType';
  title: string;
  description: string;
  children: (ConstructorSimple | ConstructorMap | ConstructorTuple)[];
};
type ConstructorSimple = {
  type: 'ConstructorSimple';
  description: string;
  title: string;
};
type ConstructorMap = {
  type: 'ConstructorMap';
  title: string;
  description: string;
  children: {
    key: string;
    type: RecursiveType;
  }[];
};
type ConstructorTuple = {
  type: 'ConstructorTuple';
  title: string;
  description: string;
  children: RecursiveType[];
};
type ListType = {
  type: 'ListType';
  children: RecursiveType;
};
type TupleType = {
  type: 'TupleType';
  children: RecursiveType[];
};
type MapType = {
  type: 'MapType';
  keys: RecursiveType;
  values: RecursiveType;
};
/**
 * Leaf node. Used in the following situations:
 * 1. a dependency we can't resolve
 * 2. a primitive in Aiken
 * 3. To end recursion after a specific depth
 */
type BaseType = {
  type: 'BaseType';
  value: string;
};
type RecursiveType =
  | EnumType
  | ConstructorSimple
  | ConstructorMap
  | ConstructorTuple
  | ListType
  | TupleType
  | MapType
  | BaseType;

/**
 * Turn a name like #/definitions/ByteArray -> ByteArray
 */
function parseType(ref: string, definitions: any, depth: number): RecursiveType {
  const noPrefix = ref.substring('#/definitions/'.length);
  // Note: JSON pointer specification indicates that '/' must be escaped as '~1
  const fixed = noPrefix.replaceAll('~1', '/');
  const nextType = definitions[fixed];
  if (nextType == null) {
    return {
      type: 'BaseType',
      value: fixed.substring(fixed.lastIndexOf('/') + 1, fixed.length),
    };
  }
  return definitionToType(nextType, definitions, depth);
}
function definitionToType(context: any, definitions: any, depth: number): RecursiveType {
  // handle constructors
  if ('anyOf' in context) {
    const title = context.title.replaceAll(' ', '');

    if (depth > 0) {
      return {
        type: 'BaseType',
        value: title,
      };
    }
    return {
      type: 'EnumType',
      title,
      description: context.description ?? '',
      children: context.anyOf.map((ctor: any) => definitionToType(ctor, definitions, depth + 1)),
    };
  }
  switch (context.dataType) {
    case 'constructor': {
      if (context.fields.length === 0) {
        return {
          type: 'ConstructorSimple',
          title: context.title,
          description: context.description ?? '',
        };
      }
      if (context.fields.some((field: any) => field.title == null)) {
        return {
          type: 'ConstructorTuple',
          title: context.title,
          description: context.description ?? '',
          children: context.fields.map((field: any) =>
            parseType(field.$ref, definitions, depth + 1)
          ),
        };
      }
      return {
        type: 'ConstructorMap',
        title: context.title,
        description: context.description ?? '',
        children: context.fields.map((field: any) => ({
          key: field.title,
          type: parseType(field.$ref, definitions, depth + 1),
        })),
      };
    }
    case 'list': {
      if (context.title === 'Tuple') {
        return {
          type: 'TupleType',
          children: context.items.map((item: any) => parseType(item.$ref, definitions, depth + 1)),
        };
      }
      return {
        type: 'ListType',
        children: parseType(context.items.$ref, definitions, depth + 1),
      };
    }
    case 'map': {
      return {
        type: 'MapType',
        keys: parseType(context.keys.$ref, definitions, depth + 1),
        values: parseType(context.values.$ref, definitions, depth + 1),
      };
    }
    case 'bytes': {
      return {
        type: 'BaseType',
        value: 'ByteArray',
      };
    }
    case 'integer': {
      return {
        type: 'BaseType',
        value: 'Int',
      };
    }
    default: {
      // according to CIP57,
      // When missing, the instance is implicitly typed as an opaque Plutus Data
      return {
        type: 'BaseType',
        value: 'Data',
      };
    }
  }
}

function parseTypeName(ref: string, definitions: any): string {
  const noPrefix = ref.substring('#/definitions/'.length);
  // Note: JSON pointer specification indicates that '/' must be escaped as '~1
  const fixed = noPrefix.replaceAll('~1', '/');
  const nextType = definitions[fixed];
  if (nextType == null) {
    return fixed.substring(fixed.lastIndexOf('/') + 1, fixed.length);
  }
  return definitionToShortname(nextType, definitions);
}
function definitionToShortname(context: RecursiveType, definitions: any): string {
  switch (context.type) {
    case 'ConstructorSimple':
      return context.title;
    case 'ConstructorTuple': {
      const tuples = context.children.map(field => definitionToShortname(field, definitions));
      return `${context.title}(${tuples.join(', ')})`;
    }
    case 'ConstructorMap': {
      const tuples = context.children.map(
        field => `${field.key}: ${definitionToShortname(field.type, definitions)}`
      );
      return `${context.title}(${tuples.join(', ')})`;
    }
    case 'TupleType':
      return `(${context.children.map((child: any) => definitionToShortname(child, definitions)).join(', ')})`;
    case 'ListType':
      return `${definitionToShortname(context.children, definitions)}[]`;
    case 'MapType':
      return `Map<${definitionToShortname(context.keys, definitions)}, ${definitionToShortname(context.values, definitions)}>`;
    case 'BaseType':
      return context.value;
    default:
      throw new Error(`Unhandled type: ${JSON.stringify(context)}`);
  }
}

async function genFileMarkdown(folderPath: string, startDepth: number): Promise<string> {
  const directories = await getDirectories(`${folderPath}/lib`);
  const jsonData = JSON.parse(fs.readFileSync(`${folderPath}/plutus.json`, 'utf8'));

  const projectToml = toml.parse(fs.readFileSync(`${folderPath}/aiken.toml`, 'utf8'));
  const { user, project, platform } = projectToml.repository;
  const fullPath = path.resolve(folderPath);
  // note: we assume that
  // 1. the repo is in folder whose name matches the project name
  // 2. the project name doesn't appear multiple times in the path (ex: my-project/aiken/my-projects)
  const pathToProject = fullPath.substring(fullPath.lastIndexOf(project) + project.length + 1);
  const projectLink =
    platform === 'github'
      ? `https://github.com/${user}/${project}/tree/master/${pathToProject}`
      : null;

  const categories = filterDefinitions(directories, jsonData.definitions);
  const withGlobals: Record<any, any> = {
    context: {
      githubLink: projectLink,
    },
    blueprint: jsonData,
    startDepth,
    title: jsonData.preamble.title.substring(jsonData.preamble.title.lastIndexOf('/') + 1),
    anchor: jsonData.preamble.title.replaceAll('/', '-'),
  };
  for (const type of AllTypes) {
    withGlobals[`has-${type}s`] = ((): boolean => {
      const val = categories.get(type);
      return val != null && val.size > 0;
    })();
  }
  for (const type of AllTypes) {
    withGlobals[`all-${type}s`] = ((): TypeScope[] => {
      const result: TypeScope[] = Array.from((categories.get(type) ?? new Map())?.values());

      // sort scopes to put local scopes first
      result.sort((t1, t2) => {
        if (t1.isLocal === t2.isLocal) return 0;
        if (t1.isLocal && !t2.isLocal) return -1;
        return 1;
      });
      return result;
    })();
  }

  Handlebars.registerHelper('header', function (title: string, depth: number, _options: any) {
    return `${'#'.repeat(startDepth + depth - 1)} ${title}`;
  });

  Handlebars.registerHelper('typeToSignature', function (originalName: string, options: any) {
    // https://github.com/cardano-foundation/CIPs/blob/master/CIP-0057/schemas/plutus-data.json
    const context = withGlobals.blueprint.definitions[originalName];

    return options.fn(definitionToType(context, withGlobals.blueprint.definitions, 0));
  });

  Handlebars.registerHelper('typeFromRef', function (ref: string, options: any) {
    return options.fn(parseType(ref, withGlobals.blueprint.definitions, 1));
  });

  Handlebars.registerHelper(
    'isType',
    function (typeName: string, type: RecursiveType, _options: any) {
      return type.type === typeName;
    }
  );

  // render template
  const result = plutusTemplate(withGlobals);
  // format template
  const prettierOutput = await prettier.format(result, {
    parser: 'mdx',
  });
  return prettierOutput;
}

async function getAllFiles(): Promise<void> {
  const prelude = preludeTemplate({});

  if (options.single) {
    const fileOutput = await genFileMarkdown(options.single, 1);
    const combinedOutput = prelude + '\n' + fileOutput;
    fs.writeFileSync(options.output, combinedOutput);
  }
  if (options.multiple) {
    const paths: string[] = [];

    // since handlebar doesn't support async calls, we do 2 passes
    // 1) find all the files we have to parse
    {
      Handlebars.registerHelper('import', function (path: string, _options: any) {
        paths.push(path);
        return '';
      });
      getTemplate(options.multiple)({}); // execute the dummy run to get all the imports
    }

    const generatedDocs = new Map<string, string>();
    for (const path of paths) {
      generatedDocs.set(path, await genFileMarkdown(path, 3));
    }

    // 2) properly fill the import calls with the data we've fetched
    {
      Handlebars.registerHelper('import', function (path: string, _options: any) {
        return generatedDocs.get(path);
      });
      const multiTemplate = getTemplate(options.multiple);
      const result = multiTemplate({});

      const combinedOutput = prelude + '\n' + result;
      fs.writeFileSync(options.output, combinedOutput);
    }
  }
}

void getAllFiles();
