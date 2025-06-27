import { Invoice, InvoiceItem } from "@shared/schema";

/**
 * Generate an HTML representation of an invoice
 */
export async function generateInvoiceHtml(invoice: Invoice): Promise<string> {
  // Parse invoice items (handle potentially unknown type)
  const invoiceItems: InvoiceItem[] = Array.isArray(invoice.items) 
    ? invoice.items 
    : [];
  
  // Calculate subtotal, tax, and total
  const subtotal = invoiceItems.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0);
  const taxRate = invoice.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  // Format dates
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A';
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
  
  // Generate HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .invoice-title {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .invoice-details {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
        }
        .invoice-details div {
          flex: 1;
        }
        .invoice-details h3 {
          margin-bottom: 5px;
          color: #2c3e50;
        }
        .table-container {
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background-color: #f8f9fa;
          text-align: left;
          padding: 10px;
          border-bottom: 2px solid #dee2e6;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .text-right {
          text-align: right;
        }
        .total-section {
          margin-top: 20px;
          margin-left: auto;
          width: 300px;
        }
        .total-section table {
          width: 100%;
        }
        .total-section th {
          text-align: right;
          font-weight: normal;
        }
        .total-section .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }
        .notes {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p style="color: #777; margin-top: 0;">Invoice Number: ${invoice.number}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold;">${invoice.client}</div>
            <!-- Add your logo or business information here -->
          </div>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p>
              ${invoice.client}<br>
              <!-- Add client address information here -->
              ${invoice.leadId ? 'Client ID: ' + invoice.leadId : ''}
            </p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p>
              Issue Date: ${issueDate}<br>
              Due Date: ${dueDate}<br>
              Payment Terms: Due on receipt
            </p>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item: InvoiceItem) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="total-section">
          <table>
            <tr>
              <th>Subtotal:</th>
              <td class="text-right">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Tax (${taxRate}%):</th>
              <td class="text-right">$${taxAmount.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <th>TOTAL:</th>
              <td class="text-right">$${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        ${invoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}
        
        <div class="notes">
          <h3>Payment Instructions:</h3>
          <p>
            Please make payment by the due date to avoid late fees.<br>
            <!-- Add payment instructions here -->
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}