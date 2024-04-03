import * as fs from 'fs-extra';
import * as path from 'path';
import { I18nReplacer } from '../src';
import { GlobalI18nFormatter } from '../src/formatter';

const testBaseDir = path.join(process.cwd(), 'test');
const expectName = 'expect';
const distName = 'dist';

export const doEqual = (dir: string) => {
  fs.readdirSync(dir).forEach((fileOrDirName) => {
    const fileOrDirLocate = path.join(dir, fileOrDirName);
    if (fs.lstatSync(fileOrDirLocate).isDirectory()) {
      return expectDirEqualDistDirAt(fileOrDirLocate);
    }
    expect(fs.readFileSync(fileOrDirLocate, 'utf-8')).toEqual(
      fs.readFileSync(fileOrDirLocate.replace(expectName, distName), 'utf-8')
    );
  });
};

export const expectDirEqualDistDirAt = (dir: string) => {
  const testDir = path.join(testBaseDir, dir);

  const expectDir = path.join(testDir, expectName);

  doEqual(expectDir);
};

export const runAndExpect = (dirName: string) => {
  const testDir = path.join(testBaseDir, dirName);
  const distDir = path.join(testDir, distName);
  const template = path.join(testDir, 'template.tsx');
  fs.removeSync(distDir);
  fs.ensureDirSync(distDir);

  I18nReplacer.createI18nReplacer({
    targetDir: distDir,
    i18nDirName: '',
    outputToNewDir: distDir,
    filesOrDirsToReplace: [template],
    localesToGenerate: ['en-us'],
    localeToReplace: 'zh-cn',
    formatter: new GlobalI18nFormatter('./'),
    prettierConfig: {
      singleQuote: true,
    },
  }).replace();
  expectDirEqualDistDirAt(dirName);
};
