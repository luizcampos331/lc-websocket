import fs, { constants, realpathSync } from 'fs';
import path from 'path';

async function getPath(pathProps: string): Promise<string> {
  let newPath = '';

  newPath = path.join(realpathSync('.'), 'src', pathProps);

  try {
    await fs.promises.access(newPath, constants.F_OK);
  } catch {
    newPath = path.join(realpathSync('.'), 'build', pathProps);
  }

  return newPath;
}

export default getPath;
