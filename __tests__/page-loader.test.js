import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { jest } from '@jest/globals';

import pageLoader from '../src/index.js';

const pageFixturePath = './__fixtures__/test-page.html';
const imageFixturePath = './__fixtures__/nodejs.png';
const ccsFixturePath = './__fixtures__/application.css';

describe('Page loader acceptance', () => {
  const testURL = 'https://test.ru/test-file';
  let tmpdirPath = null;

  beforeAll(async () => {
    jest.spyOn(process, 'exit').mockImplementation(() => { });
  });

  beforeEach(async () => {
    const htmlFixture = await fs.readFile(pageFixturePath);
    const imageFixture = await fs.readFile(imageFixturePath);
    const cssFixture = await fs.readFile(ccsFixturePath);

    tmpdirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

    nock(new URL(testURL).origin)
      .get(new URL(testURL).pathname)
      .reply(200, htmlFixture);

    nock('https://test.ru')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageFixture);

    nock('https://test.ru')
      .get('/assets/application.css')
      .reply(200, cssFixture);

    nock('https://test.ru')
      .get('/courses')
      .reply(200, htmlFixture);

    await pageLoader(testURL, {
      output: tmpdirPath,
    });
  });

  afterEach(async () => {
    await fs.rmdir(tmpdirPath, {
      recursive: true, force: true,
    });
    tmpdirPath = null;

    jest.clearAllMocks();
  });

  describe('successful app run', () => {
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
      const expected = 'test-ruhttps-test-ru-assets-professions-nodejs.png';

      const result = await fs.readdir(dir);

      expect(result).toContain(expected);
    });

    test('does not create image with different host', async () => {
      const dir = `${tmpdirPath}/test-ru-test-file_files`;
      const expected = 'test-ruhttps-cdn2-hexlet-io-assets-nodejs.png';

      const result = await fs.readdir(dir);

      expect(result).not.toContain(expected);
    });

    test('creates links', async () => {
      const dir = `${tmpdirPath}/test-ru-test-file_files`;
      const expected = 'test-ruhttps-test-ru-assets-application.css';

      const result = await fs.readdir(dir);

      expect(result).toContain(expected);
    });
  });

  describe('errors', () => {
    const consoleErrorMock = jest.spyOn(console, 'error');

    test('wrong url', async () => {
      const wrongURL = 'https://wrong';

      nock(new URL(wrongURL).origin)
        .get(new URL(wrongURL).pathname)
        .reply(500);

      await pageLoader(wrongURL, {
        output: tmpdirPath,
      });

      expect(consoleErrorMock).toHaveBeenCalled();
    });

    test('directory does not exist', async () => {
      const wrongDir = '/non-existing-dir';

      await pageLoader(testURL, {
        output: wrongDir,
      });

      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });
});
