const fs = require('fs');
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let diagStart = -1, diagEnd = -1;
let colorStart = -1, colorEnd = -1;
let compStart = -1, compEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{isDiagnosticsModalOpen && (')) diagStart = i;
  if (lines[i].includes('{isColorScanModalOpen && (')) colorStart = i;
  if (lines[i].includes('{isComparisonModalOpen && ')) compStart = i;
}

// remove them backward so indices don't shift
if (compStart !== -1) {
    let brackets = 0;
    for(let i = compStart; i < lines.length; i++){
        if (lines[i].includes('{')) brackets += (lines[i].match(/\{/g) || []).length;
        if (lines[i].includes('}')) brackets -= (lines[i].match(/\}/g) || []).length;
        if (brackets === 0 && i !== compStart) {
            compEnd = i; break;
        }
    }
    if(compEnd !== -1) lines.splice(compStart, compEnd - compStart + 1);
}

if (colorStart !== -1) {
    let brackets = 0;
    for(let i = colorStart; i < lines.length; i++){
        if (lines[i].includes('{')) brackets += (lines[i].match(/\{/g) || []).length;
        if (lines[i].includes('}')) brackets -= (lines[i].match(/\}/g) || []).length;
        if (brackets === 0 && i !== colorStart) {
            colorEnd = i; break;
        }
    }
    if(colorEnd !== -1) lines.splice(colorStart, colorEnd - colorStart + 1);
}

if (diagStart !== -1) {
    let brackets = 0;
    for(let i = diagStart; i < lines.length; i++){
        if (lines[i].includes('{')) brackets += (lines[i].match(/\{/g) || []).length;
        if (lines[i].includes('}')) brackets -= (lines[i].match(/\}/g) || []).length;
        if (brackets === 0 && i !== diagStart) {
            diagEnd = i; break;
        }
    }
    if(diagEnd !== -1) lines.splice(diagStart, diagEnd - diagStart + 1);
}

fs.writeFileSync('src/components/AdminPanel.tsx', lines.join('\n'));
console.log('Removed all 3 modals');
