import { doLog } from '@paima/utils';
import fs from 'fs';
import path from 'path';
import { API_FILENAME, ROUTER_FILENAME } from './import.js';
import type { Template } from './types.js';

export const PACKAGED_TEMPLATES_PATH = `${__dirname}/templates`;
const PACKAGED_BATCHER_PATH = `${__dirname}/batcher`;
const PACKAGED_BATCHER_BIN_PATH = `${__dirname}/batcher-bin`;

const copy = (src: string, dest: string): void => {
  const list = fs.readdirSync(src);
  list.forEach(item => {
    const stat = fs.statSync(path.resolve(src, item));
    const curSrc = path.resolve(src, item);
    const curDest = path.resolve(dest, item);

    if (stat.isFile()) {
      fs.createReadStream(curSrc).pipe(fs.createWriteStream(curDest));
    } else if (stat.isDirectory()) {
      fs.mkdirSync(curDest, { recursive: true });
      copy(curSrc, curDest);
    }
  });
};

/**
 * @param directoryPath root folder to search in
 * @returns names of all direct directories in a given folder
 */
export const getFolderNames = (directoryPath: string): Template[] => {
  const folders = fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  return folders as Template[];
};

/**
 * WORKAROUND for fs.cpSync(packagedSDKPath, SDK_FOLDER_PATH, { recursive: true }); because the method claims that packagedSDKPath doesn't exist
 * even though fs.existsSync(packagedSDKPath) returns true.
 * @param src
 * @param dest
 */
export const copyDirSync = (src: string, dest: string): void => {
  try {
    fs.accessSync(dest);
  } catch (error) {
    fs.mkdirSync(dest, { recursive: true });
  }
  copy(src, dest);
};

// Copies a folder from internal to the user's filesystem
export const prepareFolder = (
  internalPaths: string[],
  externalPath: string,
  successMessage: string,
  failureMessage: string
): void => {
  if (!fs.existsSync(externalPath)) {
    for (const internalPath of internalPaths) {
      copyDirSync(internalPath, externalPath);
    }
    doLog(successMessage);
  } else {
    doLog(failureMessage);
  }
};

// Initializes the batcher in the same folder as the executable
export const prepareBatcher = (silentMode = false): void => {
  const BATCHER_FOLDER_PATH = `${process.cwd()}/batcher`;
  const success = '✅ Batcher Initialized.';
  const failure = silentMode ? '' : `Existing Batcher Found: ${BATCHER_FOLDER_PATH}.`;

  prepareFolder(
    [PACKAGED_BATCHER_PATH, PACKAGED_BATCHER_BIN_PATH],
    BATCHER_FOLDER_PATH,
    success,
    failure
  );
};

// Initializes a project template
export const prepareTemplate = (folder: Template): void => {
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/${folder}`;
  const packagedTemplatePath = `${PACKAGED_TEMPLATES_PATH}/${folder}`;
  const success = `✅ Game template initialized: ${TEMPLATE_FOLDER_PATH}`;
  const failure = `Game template ${TEMPLATE_FOLDER_PATH} already exists.`;

  prepareFolder([packagedTemplatePath], TEMPLATE_FOLDER_PATH, success, failure);
};

// Copies the available contracts into the same folder as the executable
export const prepareContract = (): void => {
  const FOLDER_PATH = `${process.cwd()}/contracts`;
  const packagedPath = `${__dirname}/contracts`;
  const success = `✅ Available Contracts Have Been Copied To ${FOLDER_PATH}.`;
  const failure = `Existing Contracts Folder Found: ${FOLDER_PATH}.`;

  prepareFolder([packagedPath], FOLDER_PATH, success, failure);
};

// Copies the documentation into the same folder as the executable
export const prepareDocumentation = (): void => {
  const FOLDER_PATH = `${process.cwd()}/documentation`;
  const packagedPath = `${__dirname}/documentation`;
  const success = `✅ Documentation Has Been Copied To ${FOLDER_PATH}.`;
  const failure = `Documentation Already Exists: ${FOLDER_PATH}.`;

  prepareFolder([packagedPath], FOLDER_PATH, success, failure);
};

// Checks that the user packed their game code and it is available for Paima Engine to use to run
export const checkForPackedGameCode = (): boolean => {
  const GAME_CODE_PATH = `${process.cwd()}/${ROUTER_FILENAME}`;
  const ENDPOINTS_PATH = `${process.cwd()}/${API_FILENAME}`;
  return fs.existsSync(ENDPOINTS_PATH) && fs.existsSync(GAME_CODE_PATH);
};

export const getPaimaEngineVersion = (): string => {
  const rawData = fs.readFileSync(path.join(__dirname, 'metadata.json'), 'utf-8');
  const { version } = JSON.parse(rawData);
  return version;
};
