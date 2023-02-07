import fs from 'fs';
import path from 'path';

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
