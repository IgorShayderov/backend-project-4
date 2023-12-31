import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import pageLoader from '../src/index.js';

const pageFixturePath = './__fixtures__/test-page.html';
const imageFixturePath = './__fixtures__/nodejs.png';

describe('Page loader acceptance', () => {
  const testURL = 'https://test.ru/test-file';
  let tmpdirPath = null;

  beforeAll(async () => {
    const htmlFixture = await fs.readFile(pageFixturePath);
    const imageFixture = await fs.readFile(imageFixturePath);

    nock(new URL(testURL).origin)
      .get(new URL(testURL).pathname)
      .reply(200, htmlFixture);

    nock('https://cdn2.hexlet.io')
      .get('/assets/nodejs.png')
      .reply(200, imageFixture);

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

  test('has directory for resources', async () => {
    const expected = 'test-ru-test-file_files';

    const result = await fs.readdir(tmpdirPath);

    expect(result).toContain(expected);
  });

  test('creates images for page', async () => {
    const dir = `${tmpdirPath}/test-ru-test-file_files`;
    const expected = 'test-ruhttps-cdn2-hexlet-io-assets-nodejs.png';

    const result = await fs.readdir(dir);

    expect(result).toContain(expected);
  });

  test.todo('creates links');

  test.todo('creates scripts');
});
