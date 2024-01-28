import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import { api } from './api.js';

const pageLoaderDebug = debug('page-loader');

const getResponseType = (resourceType) => {
  switch (resourceType) {
    case 'img':
      return 'arraybuffer';
    default:
      return 'json';
  }
};

const tranformFilename = (filename) => filename.replace(/[^\w]+/g, '-');

const transformAssetUrl = (pageURL, assetUrl) => {
  const [, noFormatUrl, format] = assetUrl.match(/(^[A-Za-z/:.0-9-]+)\.(\w+)/);
  const transformedUrl = tranformFilename(`${pageURL.host}${noFormatUrl}`);

  return `${transformedUrl}.${format}`;
};

const pageLoader = async (sourceUrl, options = {}) => {
  pageLoaderDebug('Started app');

  const pageURL = new URL(sourceUrl);
  const fileName = tranformFilename(`${pageURL.host}${pageURL.pathname}`);
  const outputDir = options.output ? path.resolve(process.cwd(), options.output) : process.cwd();

  pageLoaderDebug('Loading the page');

  return api.get(pageURL)
    .then(({ data }) => {
      pageLoaderDebug('Page has been loaded');

      const $data = cheerio.load(data);
      const $images = $data('img');
      const $scripts = $data('script');
      const $links = $data('link');

      const resourcesUrls = [
        ...$images
          .map((imageIndex, image) => $data(image).attr('src'))
          .toArray()
          .map((url) => ({ type: 'img', url })),
        ...$scripts
          .map((scriptIndex, script) => $data(script).attr('src'))
          .toArray()
          .map((url) => ({ type: 'script', url })),
        ...$links
          .map((linkIndex, link) => $data(link).attr('href'))
          .toArray()
          .map((url) => ({ type: 'link', url })),
      ]
        .filter(({ url }) => {
          if (url.startsWith('http')) {
            const urlHostname = new URL(url);

            return urlHostname.hostname === pageURL.hostname;
          }

          return true;
        })
        .map((resource) => {
          const { url } = resource;
          const fullUrl = url.startsWith('http') ? url : `${pageURL.origin}${url}`;

          return {
            ...resource,
            url: fullUrl,
          };
        });

      const uniqueUrls = _.uniqBy(resourcesUrls, 'url');

      $images.prop('src', (imgIndex, imageUrl) => {
        const assetSrc = transformAssetUrl(pageURL, imageUrl);

        return path.join(outputDir, `${fileName}_files`, assetSrc);
      });

      pageLoaderDebug('Writing changed file');

      return fs.writeFile(path.join(outputDir, `${fileName}.html`), $data.html())
        .then(() => Promise.resolve(uniqueUrls));
    })
    .then((resources) => {
      const filesDirname = path.join(outputDir, `${fileName}_files`);

      return fs.readdir(filesDirname)
        .then(() => Promise.resolve([]), () => {
          if (resources.length > 0) {
            return fs.mkdir(filesDirname);
          }

          return Promise.resolve();
        })
        .then(() => {
          pageLoaderDebug('Loading resources');

          return Promise.resolve(resources);
        });
    })
    .then((resources) => Promise.all(
      resources.map(({ url, type }) => api.get(url, {
        responseType: getResponseType(type),
      })
        .then((response) => {
          const assetSrc = transformAssetUrl(pageURL, url);
          const data = getResponseType(type) === 'json'
            ? JSON.stringify(response.data) : response.data;

          return fs.writeFile(path.join(outputDir, `${fileName}_files`, assetSrc), data);
        })
        .catch((e) => {
          console.error('Request failed', url, e.request?.res?.statusCode ?? e);
          process.exit(8);
        })),
    ))
    .catch((e) => {
      console.error({ e });
      process.exit(20);
    })
    .then(() => {
      pageLoaderDebug('Done');
      process.exit(0);
    });
};

export default pageLoader;
