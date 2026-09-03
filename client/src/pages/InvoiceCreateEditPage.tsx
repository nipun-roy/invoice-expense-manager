import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { invoiceService, InvoiceStatus } from '../services/invoice.service';
import { customerService, CustomerData } from '../services/customer.service';
import { productService, ProductData } from '../services/product.service';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Loader2,
  FileText,
  Calculator,
} from 'lucide-react';

interface LineItemForm {
  product?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export const InvoiceCreateEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.businessProfile?.defaultCurrency || 'BDT';

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('DRAFT');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<LineItemForm[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Initial load
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100, isActive: 'true' }),
        ]);
        setCustomers(custRes.customers);
        setProducts(prodRes.products);

        if (isEdit && id) {
          const inv = await invoiceService.getInvoice(id);
          if (inv.status !== 'DRAFT') {
            setError(
              `Only draft invoices can be edited. This invoice is currently "${inv.status}".`
            );
          }
          const custId =
            typeof inv.customer === 'object' && inv.customer !== null
              ? (inv.customer as CustomerData)._id
              : (inv.customer as string);

          setCustomerId(custId);
          setInvoiceNumber(inv.invoiceNumber);
          setStatus(inv.status);
          setIssueDate(inv.issueDate ? inv.issueDate.split('T')[0] : '');
          setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
          setDiscount(inv.discount || 0);
          setNotes(inv.notes || '');

          if (inv.items && inv.items.length > 0) {
            setItems(
              inv.items.map((i) => {
                const pId =
                  typeof i.product === 'object' && i.product !== null
                    ? (i.product as any)._id
                    : (i.product as string);
                return {
                  product: pId || undefined,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  taxRate: i.taxRate || 0,
                };
              })
            );
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load initial form data';
        setError(msg);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadDependencies();
  }, [id, isEdit]);

  // Handle product selection to auto-fill description, price & tax
  const handleProductSelect = (index: number, selectedProductId: string) => {
    const updated = [...items];
    if (!selectedProductId) {
      updated[index] = { ...updated[index], product: undefined };
      setItems(updated);
      return;
    }

    const prod = products.find((p) => p._id === selectedProductId);
    if (prod) {
      updated[index] = {
        product: prod._id,
        description: prod.description ? `${prod.name} - ${prod.description}` : prod.name,
        quantity: updated[index].quantity || 1,
        unitPrice: prod.price,
        taxRate: prod.taxRate,
      };
      setItems(updated);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof LineItemForm,
    value: any
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Client preview calculation (mirrors safe server logic for UI responsiveness)
  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  let subtotalPreview = 0;
  let taxTotalPreview = 0;
  items.forEach((item) => {
    const lineSubtotal = round2(item.quantity * item.unitPrice);
    const lineTax = round2(lineSubtotal * (item.taxRate / 100));
    subtotalPreview = round2(subtotalPreview + lineSubtotal);
    taxTotalPreview = round2(taxTotalPreview + lineTax);
  });
  const grandTotalPreview = Math.max(0, round2(subtotalPreview - (discount || 0) + taxTotalPreview));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer for this invoice.');
      return;
    }

    if (items.length === 0) {
      setError('At least one item is required.');
      return;
    }

    for (const item of items) {
      if (!item.description.trim()) {
        setError('All invoice line items require a description.');
        return;
      }
      if (item.quantity <= 0) {
        setError('Item quantities must be greater than zero.');
        return;
      }
      if (item.unitPrice < 0) {
        setError('Unit prices cannot be negative.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: customerId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        status,
        issueDate,
        dueDate,
        items: items.map((i) => ({
          product: i.product || undefined,
          description: i.description.trim(),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          taxRate: Number(i.taxRate || 0),
        })),
        discount: Number(discount) || 0,
        notes: notes.trim(),
      };

      if (isEdit && id) {
        await invoiceService.updateInvoice(id, payload);
        navigate(`/invoices/${id}`);
      } else {
        const created = await invoiceService.createInvoice(payload);
        navigate(`/invoices/${created._id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save invoice';
      setError(msg);
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Preparing invoice form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? `Edit Draft Invoice #${invoiceNumber}` : 'Draft New Invoice'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Financial totals are verified and calculated on the server
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Core Metadata Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Invoice Recipient & Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Client / Customer <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No customers found. <Link to="/customers" className="underline font-medium">Add a customer first</Link>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Invoice Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Payment Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Line Items & Services
            </h3>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const lineTotal = round2(
                item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100)
              );

              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Catalog Pre-fill Picker */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Catalog Item (Auto-fill)
                      </label>
                      <select
                        value={item.product || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Custom Item / Service</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({currency} {p.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Item Description <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        placeholder="e.g. Full-stack development sprint"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                    {/* Quantity */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Qty <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Price ({currency}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Tax Rate */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Tax (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.taxRate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'taxRate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Line Total Preview */}
                    <div className="sm:col-span-3 text-right">
                      <span className="block text-[11px] font-medium text-gray-400 mb-1">
                        Line Total
                      </span>
                      <span className="font-semibold text-gray-800 text-xs">
                        {currency} {lineTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary & Notes Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Notes & Payment Terms
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Payment due within 14 days. Direct bank transfers preferred to Account #12345."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Totals Breakdown Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Calculator className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Financial Summary Preview
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">
                  {currency} {subtotalPreview.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-2">
                  Discount ({currency})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-right text-xs"
                  />
                </span>
                <span className="text-rose-600 font-medium">
                  -{currency} {(discount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>Estimated Tax Total</span>
                <span className="font-medium text-gray-800">
                  {currency} {taxTotalPreview.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between font-bold text-sm text-sky-900">
                <span>Calculated Grand Total</span>
                <span>{currency} {grandTotalPreview.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/invoices"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Update Draft Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreateEditPage;

