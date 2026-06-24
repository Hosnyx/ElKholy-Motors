const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const replacementFuncs = `  const preparePrintPayload = () => {
    localStorage.setItem('elkholy_print_payload', JSON.stringify({
      operation: selectedOperation,
      motorcycles: motorcycles,
      editInvoiceNumber,
      editCustomerId,
      editCustomerName,
      editCustomerPhone,
      editCustomerGov,
      editCustomerAddress,
      editOrderDate,
      editOrderTime,
      editSelectedProducts,
      editDiscountAmount,
      editTaxRate,
      lang,
      dir
    }));
  };

  const handleOpenA4Print = () => {
    if (!selectedOperation) return;
    preparePrintPayload();
    window.open(\`/invoice/\${selectedOperation.id}/print\`, '_blank');
  };

  const handleOpenPdfPrint = () => {
    if (!selectedOperation) return;
    preparePrintPayload();
    window.open(\`/invoice/\${selectedOperation.id}/pdf\`, '_blank');
  };

  const handleOpenExport = () => {
    if (!selectedOperation) return;
    preparePrintPayload();
    window.open(\`/invoice/\${selectedOperation.id}/export\`, '_blank');
  };
`;

// Replace the handleReactToPrint implementation
const oldImplRegex = /const handleReactToPrint = \(\) => \{\s*window\.print\(\);\s*\};/g;
if (oldImplRegex.test(content)) {
   content = content.replace(oldImplRegex, replacementFuncs);
} else {
   console.log('Could not find handleReactToPrint to replace');
   // fallback replacement
   content = content.replace("const invoicePrintRef = useRef<HTMLDivElement>(null);", "const invoicePrintRef = useRef<HTMLDivElement>(null);\n" + replacementFuncs);
   content = content.replace(/const handleReactToPrint[^\}]+\}/, "");
}

// Replace buttons onClick handlers
// But wait, the buttons all use onClick={handleReactToPrint} currently.
// 1st button: "Print Invoice Receipt 🖨" (A4)
content = content.replace(
  /onClick=\{handleReactToPrint\}([\s\S]*?)طباعة الفاتورة الفورية \(A4\) 🖨/g,
  "onClick={handleOpenA4Print}$1طباعة الفاتورة الفورية (A4) 🖨"
);
content = content.replace(
  /onClick=\{handleReactToPrint\}([\s\S]*?)Print Invoice Receipt 🖨/g,
  "onClick={handleOpenA4Print}$1Print Invoice Receipt 🖨"
);

// 2nd button: "SAVE AS PDF (A4)"
content = content.replace(
  /onClick=\{handleReactToPrint\}([\s\S]*?)SAVE AS PDF \(A4\)/g,
  "onClick={handleOpenPdfPrint}$1SAVE AS PDF (A4)"
);

// 3rd button: "HIGH RESOLUTION PNG"
content = content.replace(
  /onClick=\{handleReactToPrint\}([\s\S]*?)HIGH RESOLUTION PNG/g,
  "onClick={handleOpenExport}$1HIGH RESOLUTION PNG"
);

// 4th button: "PAPER PRINTER (A4)"
content = content.replace(
  /onClick=\{handleReactToPrint\}([\s\S]*?)PAPER PRINTER \(A4\)/g,
  "onClick={handleOpenA4Print}$1PAPER PRINTER (A4)"
);

// Also remove ` InvoicePrintView ` and `ref` from AdminPanel.tsx completely, since it's no longer rendered there.
const refStart = content.indexOf('<InvoicePrintView');
if (refStart !== -1) {
    let wrapStart = content.lastIndexOf('{selectedOperation && (', refStart);
    let wrapEnd = content.indexOf(')}', refStart) + 2;
    if (wrapStart !== -1) {
        content = content.substring(0, wrapStart) + content.substring(wrapEnd);
    }
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('AdminPanel replaced');
