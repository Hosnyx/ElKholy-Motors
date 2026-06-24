const fs = require('fs');
let data = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = data.split('\n');
let braceCount = 0;
let findingFirstOpen = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('export default function AdminPanel')) {
        findingFirstOpen = true;
    }
    
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    if (findingFirstOpen && braceCount === 0) {
        console.log(`Braces balanced to 0 at line ${i + 1}: ${line}`);
        break;
    }
}
