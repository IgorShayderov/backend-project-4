import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const pageLoader = async (url, options = {}) => {
  try {
    const pageURL = new URL(url);
    const { data } = await axios.get(pageURL);

    const fileName = `${pageURL.host}${pageURL.pathname}`.replace(/[^\w]+/g, '-');
    const outputDir = options.output ?? process.cwd();

    await fs.writeFile(path.join(outputDir, `${fileName}.html`), data);
  } catch (e) {
    console.error({ e }, 'error');
  }
};

export default pageLoader;
