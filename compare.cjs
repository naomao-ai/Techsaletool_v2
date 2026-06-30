const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const localSrc = path.join(process.cwd(), 'src');
const repoSrc = '/tmp/repo/src';

const localFiles = getFiles(localSrc).map(f => path.relative(localSrc, f));
const repoFiles = getFiles(repoSrc).map(f => path.relative(repoSrc, f));

const allFiles = new Set([...localFiles, ...repoFiles]);

const diffs = [];

for (const file of allFiles) {
  const localFile = path.join(localSrc, file);
  const repoFile = path.join(repoSrc, file);
  
  const localExists = fs.existsSync(localFile);
  const repoExists = fs.existsSync(repoFile);
  
  if (!localExists) {
    diffs.push(`Only in repo: ${file}`);
  } else if (!repoExists) {
    diffs.push(`Only in local: ${file}`);
  } else {
    const localContent = fs.readFileSync(localFile, 'utf8');
    const repoContent = fs.readFileSync(repoFile, 'utf8');
    if (localContent !== repoContent) {
      diffs.push(`Modified: ${file}`);
    }
  }
}

console.log(diffs.join('\n'));
