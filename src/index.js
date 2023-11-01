import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const pageLoader = async (url, options = {}) => {
  const pageURL = new URL(url);

  new Promise((resolve) => {
    resolve(axios.get(pageURL));
  })
    .then(({ data }) => {
      const fileName = `${pageURL.host}${pageURL.pathname}`.replace(/[^\w]+/g, '-');
      const outputDir = options.output ?? process.cwd();

      return fs.writeFile(path.join(outputDir, `${fileName}.html`), data);
    })
    .catch((e) => {
      console.error({ e });
    });
};

export default pageLoader;
