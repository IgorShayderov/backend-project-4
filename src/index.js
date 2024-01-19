import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import _ from 'lodash';

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
  const pageURL = new URL(sourceUrl);
  const fileName = tranformFilename(`${pageURL.host}${pageURL.pathname}`);
  const outputDir = options.output ?? process.cwd();

  return axios.get(pageURL)
    .then(({ data }) => {
      const $data = cheerio.load(data);
      const $images = $data('img');
      const $scripts = $data('script');
      const $links = $data('link');

      const resourcesUrls = [
        ...$images
          .map((_, image) => $data(image).attr('src'))
          .toArray()
          .map((url) => ({ type: 'img', url })),
        ...$scripts
          .map((_, script) => $data(script).attr('src'))
          .toArray()
          .map((url) => ({ type: 'script', url })),
        ...$links
          .map((_, link) => $data(link).attr('href'))
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

      $images.prop('src', (_, imageUrl) => {
        const assetSrc = transformAssetUrl(pageURL, imageUrl);

        return path.join(outputDir, `${fileName}_files`, assetSrc);
      });

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
        .then(() => Promise.resolve(resources));
    })
    .then((resources) => Promise.all(
      resources.map(({ url, type }) => axios.get(url, {
        responseType: getResponseType(type),
      })
        .then((response) => {
          const assetSrc = transformAssetUrl(pageURL, url);
          const data = getResponseType(type) === 'json'
            ? JSON.stringify(response.data) : response.data;

          return fs.writeFile(path.join(outputDir, `${fileName}_files`, assetSrc), data);
        })
        .catch((e) => {
          console.log('Request failed', url, e.request?.res.statusCode ?? e);
        })),
    ))
    .catch((e) => {
      console.error({ e });
    });
};

export default pageLoader;
