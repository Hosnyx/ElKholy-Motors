const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

content = content.replace(/handleDownloadPNG/g, 'handleReactToPrint');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
