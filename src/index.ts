import * as fs from 'fs-extra';
import * as path from 'path';

import { BundleReplacer } from './BundleReplacer';
import { InputOption, Opt } from './types';
import { ScriptTarget } from 'typescript';

export class LocaleReplacer {
  public static replace(opt: InputOption) {
    try {
      console.time('usedTime');
      let tsTarget: ScriptTarget | undefined = opt.tsTarget;
      if (
        !tsTarget &&
        fs.existsSync(path.join(opt.projectDir, 'tsconfig.json'))
      ) {
        const tsConfig =
          fs.readJsonSync(path.join(opt.projectDir, 'tsconfig.json'), {
            throws: false,
          }) ?? {};
        tsTarget = ScriptTarget[tsConfig?.compilerOptions?.target] as any;
        if (tsTarget) {
          console.log(
            'use tsTarget value ' +
              ScriptTarget[tsTarget] +
              ' from tsconfig.json in project dir '
          );
        }
      }
      let prettierConfig = opt.prettierConfig;
      if (
        !prettierConfig &&
        fs.existsSync(path.join(opt.projectDir, '.prettierrc.js'))
      ) {
        try {
          const prettierConfigPath = path.join(
            opt.projectDir,
            '.prettierrc.js'
          );
          prettierConfig = require(prettierConfigPath);
          console.log(
            'use prettierConfig:' +
              JSON.stringify(prettierConfig, null, 2) +
              ' from .prettier.js in project dir '
          );
        } catch {}
      }
      if (prettierConfig && !prettierConfig.parser) {
        prettierConfig.parser = 'typescript';
      }

      const replaceOpt: Opt = {
        ...opt,
        i18nDirName: opt.i18nDirName ?? 'i18n',
        localesToGenerate: opt.localesToGenerate ?? ['en-us', 'zh-cn'],
        localeToReplace: 'zh-cn',
        tsTarget: tsTarget ?? ScriptTarget.ESNext,
        prettierConfig,
      };
      if (!replaceOpt.localesToGenerate.includes(replaceOpt.localeToReplace)) {
        replaceOpt.localesToGenerate.push(replaceOpt.localeToReplace);
      }
      const replaceBundle = new BundleReplacer(replaceOpt);
      replaceBundle.replace();
      console.timeEnd('usedTime');
    } catch (error) {
      console.error(error);
    }
  }
}
