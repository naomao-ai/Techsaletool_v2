const fs = require('fs');
const path = require('path');

const filesToCheck = ['package.json', 'vite.config.ts', 'index.html', 'tsconfig.json'];

for (const file of filesToCheck) {
  const localFile = path.join(process.cwd(), file);
  const repoFile = path.join('/tmp/repo', file);
  
  if (fs.existsSync(localFile) && fs.existsSync(repoFile)) {
    const localContent = fs.readFileSync(localFile, 'utf8');
    const repoContent = fs.readFileSync(repoFile, 'utf8');
    if (localContent !== repoContent) {
      console.log(`Modified: ${file}`);
    } else {
      console.log(`Unchanged: ${file}`);
    }
  }
}
