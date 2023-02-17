import fs from 'fs';
import path from 'path';
import { doLog } from '@paima/utils';
import { templateMap, type TemplateTypes } from './input';

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
  internalPath: string,
  externalPath: string,
  successMessage: string,
  failureMessage: string
): void => {
  if (!fs.existsSync(externalPath)) {
    copyDirSync(internalPath, externalPath);
    doLog(successMessage);
  } else {
    doLog(failureMessage);
  }
};

// Initializes the SDK in the same folder as the executable
export const prepareSDK = (): void => {
  const SDK_FOLDER_PATH = `${process.cwd()}/paima-sdk`;
  const packagedSDKPath = `${__dirname}/paima-sdk`;
  const success = '✅ SDK Initialized.';
  const failure = `Existing SDK Found: ${SDK_FOLDER_PATH}.`;

  prepareFolder(packagedSDKPath, SDK_FOLDER_PATH, success, failure);
};

// Initializes a project template
export const prepareTemplate = (templateKey: TemplateTypes): void => {
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/${templateMap[templateKey]}`;
  const packagedTemplatePath = `${__dirname}/templates/${templateMap[templateKey]}`;
  const success = `✅ Game template initialized: ${TEMPLATE_FOLDER_PATH}`;
  const failure = `Game template ${TEMPLATE_FOLDER_PATH} already exists.`;

  prepareFolder(packagedTemplatePath, TEMPLATE_FOLDER_PATH, success, failure);
};

// Copies the smart contract project into the same folder as the executable
export const prepareContract = (): void => {
  const FOLDER_PATH = `${process.cwd()}/smart-contract`;
  const packagedPath = `${__dirname}/smart-contract`;
  const success = `✅ Smart Contract Has Been Copied To ${FOLDER_PATH}.`;
  const failure = `Existing Smart Contract Folder Found: ${FOLDER_PATH}.`;

  prepareFolder(packagedPath, FOLDER_PATH, success, failure);
};

// Copies the smart contract project into the same folder as the executable
export const prepareDocumentation = (): void => {
  const FOLDER_PATH = `${process.cwd()}/documentation`;
  const packagedPath = `${__dirname}/documentation`;
  const success = `✅ Documentation Has Been Copied To ${FOLDER_PATH}.`;
  const failure = `Documentation Already Exists: ${FOLDER_PATH}.`;

  prepareFolder(packagedPath, FOLDER_PATH, success, failure);
};

// Checks that the user packed their game code and it is available for Paima Engine to use to run
export const checkForPackedGameCode = (): boolean => {
  const GAME_CODE_PATH = `${process.cwd()}/backend.cjs`;
  const ENDPOINTS_PATH = `${process.cwd()}/registerEndpoints.cjs`;
  return fs.existsSync(ENDPOINTS_PATH) && fs.existsSync(GAME_CODE_PATH);
};
