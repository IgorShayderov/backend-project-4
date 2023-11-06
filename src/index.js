import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

// найти ссылки в html
// создать директорию для файлов
// скачать изображения
// поменять названия изображениям
// поправить тесты

const tranformFilename = (filename) => filename.replace(/[^\w]+/g, '-');

const pageLoader = async (url, options = {}) => {
  const pageURL = new URL(url);
  const fileName = tranformFilename(`${pageURL.host}${pageURL.pathname}`);
  const outputDir = options.output ?? process.cwd();

  new Promise((resolve) => {
    resolve(axios.get(pageURL));
  })
    .then(({ data }) => {
      const $data = cheerio.load(data);

      return fs.writeFile(path.join(outputDir, `${fileName}.html`), data)
        .then(() => $data);
    })
    .then(($data) => {
      const $images = $data('img');
      const imagesUrls = $images
        .map((index, image) => $data(image).attr('src'))
        .toArray();

      $images.attr('src', (index, attr) => {
        console.log({ attr });

        return '';
      });

      const filesDirname = path.join(outputDir, `${fileName}_files`);

      return fs.readdir(filesDirname)
        .then(() => Promise.resolve(), () => fs.mkdir(filesDirname))
        .then(() => imagesUrls);
    })
    .then((imagesUrls) => Promise.allSettled([
      imagesUrls.map((imageSrc) => axios.get(imageSrc)
        .then((image) => {
          // fs.writeFile();
        })),
    ]))
    .catch((e) => {
      console.error({ e });
    });
};

export default pageLoader;
