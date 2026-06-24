const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// replace functions with empty blocks to avoid undefined errors if any calls remain
content = content.replace(/const handleReactToPrint = async \(\) => \{[\s\S]*?\n  \};/g, ''); // in case we renamed it and caused a collision, but they were originally handlePrintInvoice etc.

// find exportCanvasLogic definition
const startExport = content.indexOf('const exportCanvasLogic = async (isPrint');
if (startExport !== -1) {
    const endExport = content.indexOf('const handleReactToPrint = async () => {', startExport);
    if (endExport !== -1) {
        // remove the whole block of functions up to the next thing (handleReactToPrint which used to be handlePrintInvoice)
        const blockEnd = content.indexOf('const handleConfirmSendInvoice', endExport);
        content = content.slice(0, startExport) + content.slice(blockEnd);
    }
}

// Remove test validation dialog state
content = content.replace('const [testExportImgUrl, setTestExportImgUrl] = useState<string | null>(null);', '');
content = content.replace('const handleTriggerTestExport = async () => {', 'const handleTriggerTestExport = async () => { setTestExportImgUrl(null); /* dummy */ }; //');

// Remove original handleReactToPrint definitions if we blindly replaced names
content = content.replace(/const handleReactToPrint = async \(\) => \{[\s\S]*?catch\(err: any\) \{\n      fireToast\('Error: ' \+ err.message, 'error'\);\n    \}\n  \};\n/g, '');


fs.writeFileSync('src/components/AdminPanel.tsx', content);
