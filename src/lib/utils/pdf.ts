/**
 * PDF Generation Utilities
 * Uses jsPDF for client-side PDF generation
 */

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  organization: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customer: {
    name: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  paymentMethod: string;
}

/**
 * Generate invoice PDF
 * In production, use a proper PDF library like jsPDF or PDFKit
 */
export function generateInvoicePDF(data: InvoiceData): string {
  // This would use jsPDF in production
  // For now, return a data URL placeholder
  const content = `
INVOICE #${data.invoiceNumber}
Date: ${data.date}
Due Date: ${data.dueDate}

From:
${data.organization.name}
${data.organization.address}
${data.organization.phone}
${data.organization.email}

To:
${data.customer.name}
${data.customer.email}
${data.customer.phone}
${data.customer.address}

Items:
${data.items.map((item, i) => `
${i + 1}. ${item.description}
   Quantity: ${item.quantity} x $${item.price} = $${item.total}
`).join('\n')}

Subtotal: $${data.subtotal}
Tax: $${data.tax}
Shipping: $${data.shipping}
TOTAL: $${data.total}

${data.notes ? `Notes: ${data.notes}` : ''}
`;

  return `data:text/plain;base64,${Buffer.from(content).toString('base64')}`;
}

/**
 * Generate receipt PDF
 */
export function generateReceiptPDF(data: ReceiptData): string {
  const content = `
RECEIPT #${data.receiptNumber}
Date: ${data.date}

Customer: ${data.customer.name}

Items:
${data.items.map((item, i) => `
${i + 1}. ${item.description}
   ${item.quantity} x $${item.price} = $${item.total}
`).join('\n')}

TOTAL: $${data.total}
Payment Method: ${data.paymentMethod}

Thank you for your business!
`;

  return `data:text/plain;base64,${Buffer.from(content).toString('base64')}`;
}

/**
 * Generate barcode as SVG
 */
export function generateBarcodeSVG(code: string): string {
  // Simple barcode SVG representation
  // In production, use a proper barcode library
  return `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="80" fill="white"/>
      <text x="100" y="60" text-anchor="middle" font-family="monospace" font-size="14">${code}</text>
      <rect x="20" y="20" width="2" height="30" fill="black"/>
      <rect x="25" y="20" width="4" height="30" fill="black"/>
      <rect x="32" y="20" width="2" height="30" fill="black"/>
      <rect x="37" y="20" width="6" height="30" fill="black"/>
      <rect x="46" y="20" width="2" height="30" fill="black"/>
      <rect x="51" y="20" width="4" height="30" fill="black"/>
    </svg>
  `;
}

/**
 * Generate QR code as SVG
 */
export function generateQRCodeSVG(data: string): string {
  // Simple QR placeholder
  // In production, use qrcode library
  return `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="160" height="160" fill="black" opacity="0.1"/>
      <text x="100" y="105" text-anchor="middle" font-family="sans-serif" font-size="12">QR: ${data.substring(0, 10)}...</text>
    </svg>
  `;
}

