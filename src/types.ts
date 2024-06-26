import { ScriptTarget } from 'typescript';
import { Options as PrettierOptions } from 'prettier';
import { I18nFormatter } from './formatter';

export type LocaleTypes = 'en-us' | 'zh-cn';

export interface I18nFormatterCtr<A extends I18nFormatter = I18nFormatter> {
  new (): A;
}

export interface ReplacerOpt {
  generatedFilesDir?: string;
  localesToGenerate?: LocaleTypes[];
  localeToReplace?: LocaleTypes;
  tsTarget?: ScriptTarget;
  I18nFormatter?: I18nFormatterCtr;
  workingDir?: string;
  filesOrDirsToReplace?: string[];
  fileFilter?: (fileName: string) => boolean;
  prettierConfig?: PrettierOptions;
  outputToNewDir?: false | string;
}

export type HandledOpt = {
  [key in keyof ReplacerOpt]-?: ReplacerOpt[key];
};
