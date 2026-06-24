const fs = require('fs');
let data = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = data.split('\n');
let braceCount = 0;
let parenCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    parenCount += (line.match(/\(/g) || []).length;
    parenCount -= (line.match(/\)/g) || []).length;
    if (braceCount < 0) {
        console.log(`Unbalanced '}': line ${i + 1}`);
        break;
    }
}
console.log('Final braces:', braceCount, 'Final parens:', parenCount);
