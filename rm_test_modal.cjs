const fs = require('fs');
let data = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const testModalStart = data.indexOf('{/* ================================== EXPORT TEST & VALIDATION DIALOG');
if (testModalStart !== -1) {
    const endAnimate = data.indexOf('</AnimatePresence>', testModalStart) + '</AnimatePresence>'.length;
    data = data.substring(0, testModalStart) + data.substring(endAnimate);
}

fs.writeFileSync('src/components/AdminPanel.tsx', data);
console.log('Removed test modal');
