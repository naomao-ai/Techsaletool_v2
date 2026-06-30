const fs = require('fs');
console.log(fs.readFileSync('dist/index.html', 'utf-8').substring(0, 1000));
