const fs = require('fs');
let code = fs.readFileSync('src/pages/AIPage.tsx', 'utf8');

code = code.replace(/\\\`/g, '\`');

fs.writeFileSync('src/pages/AIPage.tsx', code);
