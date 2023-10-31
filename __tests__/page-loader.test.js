import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import pageLoader from '../src/index.js';

describe('Page loader acceptance', () => {
  const testURL = 'https://test.ru/test';
  let tmpdirPath = null;

  beforeAll(() => {
    nock(new URL(testURL).origin)
      .get(new URL(testURL).pathname)
      .reply(200, {
        // html
      });
  });

  beforeEach(async () => {
    pageLoader(testURL);

    tmpdirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  test('loads file', async () => {
    const expected = 'file.html';

    const result = await fs.readdir(tmpdirPath);

    expect(result).toContain(expected);
  });
});
