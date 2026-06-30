const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><html><head><title>test</title></head><body></body></html>`);
console.log(dom.window.document.documentElement.innerHTML.includes('</head>'));
