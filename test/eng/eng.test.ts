import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';
it('extract english successfully', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatterClass: HookI18nFormatter,
      localesToGenerate: ['zh-cn'],
      localeToReplace: 'en-us',
    },
  });
});
