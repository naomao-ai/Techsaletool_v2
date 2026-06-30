const fs = require('fs');

const localPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const repoPkg = JSON.parse(fs.readFileSync('/tmp/repo/package.json', 'utf8'));

console.log("Local dependencies:", Object.keys(localPkg.dependencies || {}).length);
console.log("Repo dependencies:", Object.keys(repoPkg.dependencies || {}).length);

for (const dep in repoPkg.dependencies) {
  if (localPkg.dependencies[dep] !== repoPkg.dependencies[dep]) {
    console.log(`Dep diff: ${dep} local=${localPkg.dependencies[dep]} repo=${repoPkg.dependencies[dep]}`);
  }
}
for (const dep in repoPkg.devDependencies) {
  if (localPkg.devDependencies[dep] !== repoPkg.devDependencies[dep]) {
    console.log(`DevDep diff: ${dep} local=${localPkg.devDependencies[dep]} repo=${repoPkg.devDependencies[dep]}`);
  }
}
