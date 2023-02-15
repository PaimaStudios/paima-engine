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

// Initializes the SDK in the same folder as the executable
export const prepareSDK = (): void => {
  const SDK_FOLDER_PATH = `${process.cwd()}/paima-sdk`;

  if (!fs.existsSync(SDK_FOLDER_PATH)) {
    const packagedSDKPath = `${__dirname}/paima-sdk`;
    copyDirSync(packagedSDKPath, SDK_FOLDER_PATH);
    doLog('✅ SDK Initialized.');
  }
  else {
    doLog(`Existing SDK Found: ${SDK_FOLDER_PATH}.`);
    doLog(`Skipping Initialization.`);
  }
};

// Initializes a project template
export const prepareTemplate = (templateKey: TemplateTypes): void => {
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/${templateMap[templateKey]}`;
  if (fs.existsSync(TEMPLATE_FOLDER_PATH)) {
    doLog(`Game template ${TEMPLATE_FOLDER_PATH} already exists.`);
    return;
  }

  const packagedTemplatePath = `${__dirname}/templates/${templateMap[templateKey]}`;
  copyDirSync(packagedTemplatePath, TEMPLATE_FOLDER_PATH);
  doLog(`✅ Game template initialized: ${TEMPLATE_FOLDER_PATH}`);
};


// Checks that the user packed their game code and it is available for Paima Engine to use to run
export const checkForPackedGameCode = (): boolean => {
  const GAME_CODE_PATH = `${process.cwd()}/backend.cjs`;
  const ENDPOINTS_PATH = `${process.cwd()}/registerEndpoints.cjs`;
  return fs.existsSync(ENDPOINTS_PATH) && fs.existsSync(GAME_CODE_PATH);
}

