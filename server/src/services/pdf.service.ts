import PDFDocument from 'pdfkit';
import { IInvoice } from '../models/Invoice.js';
import { ICustomer } from '../models/Customer.js';
import { IBusinessProfile } from '../models/BusinessProfile.js';

export interface InvoicePdfData {
  invoice: IInvoice;
  customer: ICustomer;
  business: IBusinessProfile;
}

export const generateInvoicePdf = (
  data: InvoicePdfData,
  onData: (chunk: Buffer) => void,
  onEnd: () => void
) => {
  const { invoice, customer, business } = data;
  const currency = business.defaultCurrency || 'BDT';

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.on('data', onData);
  doc.on('end', onEnd);

  // Colors
  const primaryColor = '#0284c7'; // Sky-600
  const darkTextColor = '#0f172a'; // Slate-900
  const grayTextColor = '#64748b'; // Slate-500
  const borderColor = '#e2e8f0'; // Slate-200

  // 1. Header (Business Identity & Invoice Title)
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(primaryColor)
    .text(business.businessName || 'INVOICE', 50, 50);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(grayTextColor)
    .text(business.email ? `Email: ${business.email}` : '', 50, 80)
    .text(business.phone ? `Phone: ${business.phone}` : '', 50, 95)
    .text(business.address ? `Address: ${business.address}` : '', 50, 110)
    .text(business.taxVatNumber ? `Tax ID / VAT: ${business.taxVatNumber}` : '', 50, 125);

  // Right side: Invoice title and numbering
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(darkTextColor)
    .text('INVOICE', 350, 50, { align: 'right' });

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text(`#${invoice.invoiceNumber}`, 350, 75, { align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(grayTextColor)
    .text(`Status: ${invoice.status}`, 350, 95, { align: 'right' })
    .text(
      `Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}`,
      350,
      110,
      { align: 'right' }
    )
    .text(
      `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`,
      350,
      125,
      { align: 'right' }
    );

  // Divider
  doc
    .moveTo(50, 155)
    .lineTo(545, 155)
    .strokeColor(borderColor)
    .stroke();

  // 2. Bill To Block
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(grayTextColor)
    .text('BILL TO:', 50, 170);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(darkTextColor)
    .text(customer.name, 50, 185);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(grayTextColor)
    .text(customer.email || '', 50, 202)
    .text(customer.phone || '', 50, 215)
    .text(customer.address || '', 50, 228);

  // 3. Line Items Table Header
  const tableTop = 260;
  doc
    .rect(50, tableTop, 495, 24)
    .fillColor('#f8fafc')
    .fill();

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(darkTextColor)
    .text('Description', 60, tableTop + 7)
    .text('Qty', 290, tableTop + 7, { width: 40, align: 'right' })
    .text('Price', 340, tableTop + 7, { width: 60, align: 'right' })
    .text('Tax', 410, tableTop + 7, { width: 40, align: 'right' })
    .text('Total', 460, tableTop + 7, { width: 75, align: 'right' });

  // 4. Line Items Rows
  let currentY = tableTop + 30;
  doc.font('Helvetica').fillColor(darkTextColor).fontSize(9);

  invoice.items.forEach((item) => {
    const lineTotal = item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100);

    doc
      .text(item.description, 60, currentY, { width: 220 })
      .text(String(item.quantity), 290, currentY, { width: 40, align: 'right' })
      .text(`${currency} ${item.unitPrice.toFixed(2)}`, 340, currentY, { width: 60, align: 'right' })
      .text(`${item.taxRate || 0}%`, 410, currentY, { width: 40, align: 'right' })
      .text(`${currency} ${lineTotal.toFixed(2)}`, 460, currentY, { width: 75, align: 'right' });

    currentY += 22;

    doc
      .moveTo(50, currentY - 5)
      .lineTo(545, currentY - 5)
      .strokeColor('#f1f5f9')
      .stroke();
  });

  // 5. Totals Section (Right-aligned)
  const totalsY = Math.max(currentY + 20, 420);
  const labelX = 350;
  const valueX = 460;
  const valueWidth = 85;

  doc.font('Helvetica').fontSize(9).fillColor(grayTextColor);

  doc.text('Subtotal:', labelX, totalsY);
  doc.text(`${currency} ${invoice.subtotal.toFixed(2)}`, valueX, totalsY, {
    width: valueWidth,
    align: 'right',
  });

  if (invoice.discount > 0) {
    doc.text('Discount:', labelX, totalsY + 18);
    doc.text(`-${currency} ${invoice.discount.toFixed(2)}`, valueX, totalsY + 18, {
      width: valueWidth,
      align: 'right',
    });
  }

  doc.text('Tax Total:', labelX, totalsY + 36);
  doc.text(`${currency} ${invoice.taxTotal.toFixed(2)}`, valueX, totalsY + 36, {
    width: valueWidth,
    align: 'right',
  });

  // Grand Total bar
  doc
    .rect(340, totalsY + 54, 205, 26)
    .fillColor('#f0f9ff')
    .fill();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('Grand Total:', labelX, totalsY + 61)
    .text(`${currency} ${invoice.grandTotal.toFixed(2)}`, valueX, totalsY + 61, {
      width: valueWidth,
      align: 'right',
    });

  doc.font('Helvetica').fontSize(9).fillColor(grayTextColor);
  doc.text('Amount Paid:', labelX, totalsY + 88);
  doc.text(`${currency} ${invoice.amountPaid.toFixed(2)}`, valueX, totalsY + 88, {
    width: valueWidth,
    align: 'right',
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(darkTextColor)
    .text('Amount Due:', labelX, totalsY + 106)
    .text(`${currency} ${invoice.amountDue.toFixed(2)}`, valueX, totalsY + 106, {
      width: valueWidth,
      align: 'right',
    });

  // 6. Notes / Terms (Left-aligned)
  if (invoice.notes) {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(darkTextColor)
      .text('Notes & Payment Terms:', 50, totalsY)
      .font('Helvetica')
      .fontSize(8)
      .fillColor(grayTextColor)
      .text(invoice.notes, 50, totalsY + 16, { width: 260 });
  }

  // Footer
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(
      `Generated by Invoice & Expense Manager — Thank you for your business!`,
      50,
      760,
      { align: 'center', width: 495 }
    );

  doc.end();
};

