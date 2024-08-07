import * as path from 'path';
import { runAndExpect } from '../helper';
import I18nReplacer, { I18nFormatter } from '../../src';

it('should extract mixed successful', async () => {
  await runAndExpect({ dirName: path.basename(__dirname) });
  expect(I18nFormatter).not.toBe(undefined);
});

it('should throw error if target path not exists', async () => {
  expect(() =>
    I18nReplacer.createI18nReplacer({
      targets: ['./notExists.js'],
    })
  ).toThrow();
});

it('should throw error if dist dir is file', async () => {
  expect(() =>
    I18nReplacer.createI18nReplacer({
      distLocaleDir: path.join(__dirname, './template.tsx'),
    })
  ).toThrow();
});
