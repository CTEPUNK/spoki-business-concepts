'use strict';
(() => {
  const url = new URL(document.documentElement.dataset.destination, document.baseURI);
  url.search = location.search;
  url.hash = location.hash;
  location.replace(url.href);
})();
