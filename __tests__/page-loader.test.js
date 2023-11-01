import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import pageLoader from '../src/index.js';

const fixturePath = './__fixtures__/test-page.html';

describe('Page loader acceptance', () => {
  const testURL = 'https://test.ru/test-file';
  let tmpdirPath = null;
  let htmlFixture = null;

  beforeAll(async () => {
    htmlFixture = await fs.readFile(fixturePath);

    nock(new URL(testURL).origin)
      .get(new URL(testURL).pathname)
      .reply(200, htmlFixture);

    tmpdirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

    await pageLoader(testURL, {
      output: tmpdirPath,
    });
  });

  test('loads html page', async () => {
    const expected = 'test-ru-test-file.html';

    const result = await fs.readdir(tmpdirPath);

    expect(result).toContain(expected);
  });

  test.skip('has directory for resources', async () => {
    const expected = 'test-ru-test-file_files';

    const result = await fs.readdir(tmpdirPath);

    expect(result).toContain(expected);
  });

  test.skip('creates images for page', async () => {
    const dir = `${tmpdirPath}/test-ru-test-file_files`;
    const expected = 'ru-hexlet-io-assets-professions-nodejs.png';

    const result = await fs.readdir(dir);

    expect(result).toContain(expected);
  });
});
