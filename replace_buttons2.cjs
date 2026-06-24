const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Use regex cautiously or string replace.
content = content.replace(/handlePrintInvoice/g, 'handleReactToPrint');
content = content.replace(/handleDownloadPDF/g, 'handleReactToPrint');

// We also need to add <InvoicePrintView />.
// Let's find the closing div of the AdminPanel return statement.
const lastDivIndex = content.lastIndexOf('</div>');
const invoicePrintViewProps = `
      {selectedOperation && (
        <InvoicePrintView 
          ref={invoicePrintRef}
          operation={selectedOperation}
          motorcycles={motorcycles}
          editInvoiceNumber={editInvoiceNumber}
          editCustomerId={editCustomerId}
          editCustomerName={editCustomerName}
          editCustomerPhone={editCustomerPhone}
          editCustomerGov={editCustomerGov}
          editCustomerAddress={editCustomerAddress}
          editOrderDate={editOrderDate}
          editOrderTime={editOrderTime}
          editSelectedProducts={editSelectedProducts}
          editDiscountAmount={editDiscountAmount}
          editTaxRate={editTaxRate}
          lang={lang}
          dir={dir}
        />
      )}
`;

content = content.substring(0, lastDivIndex) + invoicePrintViewProps + content.substring(lastDivIndex);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed functionality!');
