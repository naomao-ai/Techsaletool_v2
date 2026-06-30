const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src-tauri/src/main.rs');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/executable_dir/g, 'app_data_dir');
fs.writeFileSync(file, content);
