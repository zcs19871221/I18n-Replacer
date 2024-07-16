import path from 'path';

process.cwd = jest.fn(() => path.join(__dirname, './dist'));

jest.mock('prettier', () => ({
  ...jest.requireActual('prettier'),
  resolveConfig: () => ({
    singleQuote: true,
    tabWidth: 2,
    parser: 'typescript',
  }),
}));

import { cli } from '../../src/cli';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test meaningKey', async () => {
  const target = path.join(__dirname, './dist');
  fs.removeSync(target);

  fs.copySync(path.join(__dirname, 'src'), target);

  await cli();

  expectDirEqualDistDirAt(__dirname);
});
