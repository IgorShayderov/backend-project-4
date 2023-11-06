import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const tranformFilename = (filename) => filename.replace(/[^\w]+/g, '-');

const pageLoader = async (url, options = {}) => {
  const pageURL = new URL(url);
  const fileName = tranformFilename(`${pageURL.host}${pageURL.pathname}`);
  const outputDir = options.output ?? process.cwd();

  const transformAssetUrl = (assetUrl) => {
    const [, noFormatUrl, format] = assetUrl.match(/(^[A-Za-z/:.0-9-]+)\.(\w+)/);
    const transformedUrl = tranformFilename(`${pageURL.host}${noFormatUrl}`);

    const imagePath = path.join(outputDir, `${fileName}_files`, `${transformedUrl}.${format}`);

    return imagePath;
  };

  new Promise((resolve) => {
    resolve(axios.get(pageURL));
  })
    .then(({ data }) => {
      const $data = cheerio.load(data);
      const $images = $data('img');
      const imagesUrls = $images
        .map((index, image) => $data(image).attr('src'))
        .toArray();

      $images.prop('src', (index, imageUrl) => transformAssetUrl(imageUrl));

      return fs.writeFile(path.join(outputDir, `${fileName}.html`), $data.html())
        .then(() => imagesUrls);
    })
    .then((imagesUrls) => {
      const filesDirname = path.join(outputDir, `${fileName}_files`);

      return fs.readdir(filesDirname)
        .then(() => Promise.resolve(), () => fs.mkdir(filesDirname))
        .then(() => imagesUrls);
    })
    .then((imagesUrls) => Promise.allSettled([
      imagesUrls.map((imageUrl) => axios.get(imageUrl, {
        responseType: 'arraybuffer',
      })
        .then((response) => fs.writeFile(transformAssetUrl(imageUrl), response.data))),
    ]))
    .catch((e) => {
      console.error({ e });
    });
};

export default pageLoader;
