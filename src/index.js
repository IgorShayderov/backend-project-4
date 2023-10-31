const pageLoader = (url, options = {}) => {
  const pageURL = new URL(url);

  // console.log({ pageURL });

  `${pageURL.host}${pageURL.pathname}`;
};

export default pageLoader;
