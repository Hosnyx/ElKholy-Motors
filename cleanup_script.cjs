const fs = require('fs');
let data = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// We know `const exportCanvasLogic` starts somewhere.
let idx = data.indexOf('const exportCanvasLogic = async (isPrint = false)');
if (idx !== -1) {
    // find 'const handleSendInvoice = '
    let endIdx = data.indexOf('const handleSendInvoice = (method', idx);
    if (endIdx !== -1) {
        data = data.substring(0, idx) + data.substring(endIdx);
    }
}

// Now handleConfirmSendInvoice has clipboard code that needs removing since exportCanvasLogic is gone.
let clipStart = data.indexOf('try {\n           const imgData = await exportCanvasLogic');
if (clipStart !== -1) {
    let clipEnd = data.indexOf('}\n\n         window.open(', clipStart);
    if (clipEnd !== -1) {
        data = data.substring(0, clipStart) + data.substring(clipEnd + 2);
    }
}

// Remove html2canvas replace stuff from top
data = data.replace('let colorResolverCanvas: HTMLCanvasElement | null = null;', '');
data = data.replace('let colorResolverCtx: CanvasRenderingContext2D | null = null;', '');

let sanitizeStart = data.indexOf('const sanitizeColorValue');
if (sanitizeStart !== -1) {
    let sanitizeEnd = data.indexOf('const ExportInvoiceComponent', sanitizeStart);
    if (sanitizeEnd !== -1) {
       data = data.substring(0, sanitizeStart) + data.substring(sanitizeEnd);
    }
}

let exportInvStart = data.indexOf('const ExportInvoiceComponent = ({ operation');
if (exportInvStart !== -1) {
    let exportInvEnd = data.indexOf('interface AdminPanelProps {', exportInvStart);
    if (exportInvEnd !== -1) {
       data = data.substring(0, exportInvStart) + data.substring(exportInvEnd);
    }
}

// write
fs.writeFileSync('src/components/AdminPanel.tsx', data);
console.log('Cleanup script executed');
