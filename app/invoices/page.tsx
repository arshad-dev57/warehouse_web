'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Plus, Search, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, X, FileText, Download,
  Share2, Printer, Calendar, Upload, ArrowLeft,
  CheckCircle, Clock, AlertCircle, Send, Copy, Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// ==================== TYPES ====================
interface LineItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
}

interface ExtraCharge {
  enabled: boolean;
  chargeType: '%' | '$';
  value: number;
}

interface InvoiceForm {
  invoiceNumber: number;
  from: string;
  billTo: string;
  shipTo: string;
  logo: string;
  date: string;
  dueDate: string;
  paymentTerms: string;
  poNumber: string;
  lineItems: LineItem[];
  notes: string;
  terms: string;
  discount: ExtraCharge;
  tax: ExtraCharge;
  shipping: { enabled: boolean; amount: number };
  amountPaid: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: number;
  from: string;
  billTo: string;
  shipTo?: string;
  logo?: string;
  date: string;
  dueDate: string;
  paymentTerms?: string;
  poNumber?: string;
  lineItems: { description: string; quantity: number; rate: number }[];
  notes?: string;
  terms?: string;
  discount?: ExtraCharge;
  tax?: ExtraCharge;
  shipping?: { enabled: boolean; amount: number };
  total: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  amountPaid: number;
  balanceDue: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
}

// ==================== HELPERS ====================
const today = () => new Date().toISOString().split('T')[0];
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string; icon: any; label: string }> = {
  draft:   { bg: 'bg-gray-100',   text: 'text-gray-700',  dot: 'bg-gray-400',  border: 'border-gray-200', icon: Clock,         label: 'Draft'   },
  sent:    { bg: 'bg-blue-50',    text: 'text-blue-700',  dot: 'bg-blue-500',  border: 'border-blue-200', icon: Send,          label: 'Sent'    },
  paid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', icon: CheckCircle, label: 'Paid' },
  overdue: { bg: 'bg-red-50',     text: 'text-red-700',   dot: 'bg-red-500',   border: 'border-red-200',  icon: AlertCircle,   label: 'Overdue' }
};

// ==================== DELETE MODAL ====================
function DeleteModal({ invoice, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Invoice</h3>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-gray-700">Invoice #{invoice?.invoiceNumber}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Deleting...</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SHARE MODAL ====================
function ShareModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invoices/${invoice._id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invoice #${invoice.invoiceNumber}`);
    const body = encodeURIComponent(`Please find your invoice #${invoice.invoiceNumber} for ${fmt(invoice.total)}.\n\nView it here: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Share Invoice</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Link</label>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-600 truncate" />
              <button onClick={handleCopy} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Share Via</label>
            <button onClick={handleEmailShare} className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Send className="w-4 h-4 text-blue-600" /></div>
              Share via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== INVOICE DETAIL VIEW ====================
function InvoiceDetailView({ invoice, onBack, onEdit, onDelete, onStatusChange }: {
  invoice: Invoice;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const status = statusConfig[invoice.status] || statusConfig.draft;
  const subtotal = invoice.subtotal ?? (invoice.lineItems || []).reduce((s, i) => s + i.quantity * i.rate, 0);
  const discountAmt = invoice.discountAmount ?? 0;
  const taxAmt = invoice.taxAmount ?? 0;
  const shippingAmt = invoice.shippingAmount ?? 0;

  const handleDownloadPDF = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Invoice #${invoice.invoiceNumber}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;padding:40px;background:white;}
        table{width:100%;border-collapse:collapse;}
        th{background:#111;color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:600;}
        td{padding:10px 14px;font-size:13px;border-bottom:1px solid #f0f0f0;}
        .invoice-header{display:flex;justify-content:space-between;margin-bottom:40px;}
        .invoice-title{font-size:36px;font-weight:700;}
        .section-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:32px;}
        .label{font-size:10px;font-weight:600;text-transform:uppercase;color:#999;margin-bottom:6px;}
        .value{font-size:13px;color:#333;line-height:1.6;}
        .totals{margin-left:auto;width:300px;margin-top:24px;}
        .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;}
        .total-final{display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:700;border-top:2px solid #111;border-bottom:2px solid #111;margin:8px 0;}
        .balance{display:flex;justify-content:space-between;padding:8px 0;font-size:15px;font-weight:600;}
        .footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;}
      </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>${invoice.logo ? `<img src="${invoice.logo}" style="height:56px;margin-bottom:16px;" />` : ''}<div class="invoice-title">INVOICE</div><div style="font-size:13px;color:#999;">#${invoice.invoiceNumber}</div></div>
          <div style="text-align:right;">${invoice.from ? `<div style="font-size:13px;">${invoice.from.replace(/\n/g, '<br/>')}</div>` : ''}</div>
        </div>
        <div class="section-grid">
          <div><div class="label">Bill To</div><div class="value">${(invoice.billTo || '—').replace(/\n/g, '<br/>')}</div>${invoice.shipTo ? `<div class="label" style="margin-top:16px;">Ship To</div><div class="value">${invoice.shipTo.replace(/\n/g, '<br/>')}</div>` : ''}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div><div class="label">Invoice Date</div><div class="value">${new Date(invoice.date).toLocaleDateString()}</div></div>
            <div><div class="label">Due Date</div><div class="value">${new Date(invoice.dueDate).toLocaleDateString()}</div></div>
            ${invoice.paymentTerms ? `<div><div class="label">Payment Terms</div><div class="value">${invoice.paymentTerms}</div></div>` : ''}
            ${invoice.poNumber ? `<div><div class="label">PO Number</div><div class="value">${invoice.poNumber}</div></div>` : ''}
          </div>
        </div>
        <table><thead><tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>${(invoice.lineItems || []).map(item => `<tr><td>${item.description}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:right;">${fmt(item.rate)}</td><td style="text-align:right;font-weight:600;">${fmt(item.quantity * item.rate)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${discountAmt > 0 ? `<div class="total-row" style="color:#e53e3e;"><span>Discount</span><span>-${fmt(discountAmt)}</span></div>` : ''}
          ${taxAmt > 0 ? `<div class="total-row"><span>Tax</span><span>+${fmt(taxAmt)}</span></div>` : ''}
          ${shippingAmt > 0 ? `<div class="total-row"><span>Shipping</span><span>+${fmt(shippingAmt)}</span></div>` : ''}
          <div class="total-final"><span>Total</span><span>${fmt(invoice.total)}</span></div>
          ${invoice.amountPaid > 0 ? `<div class="total-row"><span>Amount Paid</span><span style="color:#38a169;">-${fmt(invoice.amountPaid)}</span></div>` : ''}
          <div class="balance"><span>Balance Due</span><span style="color:${invoice.balanceDue <= 0 ? '#38a169' : '#111'};">${fmt(invoice.balanceDue)}</span></div>
        </div>
        <div class="footer">Generated by Warehouse Management System</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back to Invoices</button>
            <span className="text-gray-200">|</span>
            <span className="text-sm font-semibold text-gray-900">Invoice #{invoice.invoiceNumber}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={invoice.status} onChange={(e) => onStatusChange(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-gray-900">
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
            </select>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><Share2 className="w-3.5 h-3.5" /> Share</button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"><Download className="w-3.5 h-3.5" /> PDF</button>
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"><Edit className="w-3.5 h-3.5" /> Edit</button>
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 text-white px-10 py-8"><div className="flex items-start justify-between"><div>{invoice.logo && <img src={invoice.logo} alt="Logo" className="h-14 object-contain mb-4 rounded" />}<h1 className="text-5xl font-black tracking-tight text-white">INVOICE</h1><p className="text-gray-400 text-sm mt-1 font-mono">#{invoice.invoiceNumber}</p></div><div className="text-right">{invoice.from && <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{invoice.from}</div>}<div className="mt-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.text} border ${status.border}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}</span></div></div></div></div>
          <div className="px-10 py-8 space-y-8">
            <div className="grid grid-cols-2 gap-12">
              <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</p><div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line font-medium">{invoice.billTo || '—'}</div>{invoice.shipTo && <div className="mt-4"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ship To</p><div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{invoice.shipTo}</div></div>}</div>
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Date</p><p className="text-gray-800 text-sm font-medium">{new Date(invoice.date).toLocaleDateString()}</p></div>
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</p><p className={`text-sm font-semibold ${invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>{new Date(invoice.dueDate).toLocaleDateString()}</p></div>
                {invoice.paymentTerms && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Terms</p><p className="text-gray-800 text-sm font-medium">{invoice.paymentTerms}</p></div>}
                {invoice.poNumber && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">PO Number</p><p className="text-gray-800 text-sm font-medium">{invoice.poNumber}</p></div>}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <table className="w-full">
                <thead><tr className="bg-gray-900 text-white"><th className="px-5 py-3.5 text-left text-xs font-semibold">Description</th><th className="px-5 py-3.5 text-center text-xs font-semibold w-24">Qty</th><th className="px-5 py-3.5 text-right text-xs font-semibold w-32">Rate</th><th className="px-5 py-3.5 text-right text-xs font-semibold w-36">Amount</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(invoice.lineItems || []).map((item, idx) => (<tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}><td className="px-5 py-4 text-sm text-gray-700">{item.description}</td><td className="px-5 py-4 text-sm text-gray-600 text-center">{item.quantity}</td><td className="px-5 py-4 text-sm text-gray-600 text-right">{fmt(item.rate)}</td><td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right">{fmt(item.quantity * item.rate)}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="w-80 space-y-1">
                <div className="flex justify-between py-2 text-sm text-gray-600"><span>Subtotal</span><span className="font-medium text-gray-800">{fmt(subtotal)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between py-2 text-sm text-red-600"><span>Discount</span><span className="font-medium">−{fmt(discountAmt)}</span></div>}
                {taxAmt > 0 && <div className="flex justify-between py-2 text-sm text-gray-600"><span>Tax</span><span className="font-medium text-gray-800">+{fmt(taxAmt)}</span></div>}
                {shippingAmt > 0 && <div className="flex justify-between py-2 text-sm text-gray-600"><span>Shipping</span><span className="font-medium text-gray-800">+{fmt(shippingAmt)}</span></div>}
                <div className="flex justify-between py-3 border-t-2 border-b-2 border-gray-900 mt-2"><span className="text-base font-bold text-gray-900">Total</span><span className="text-base font-black text-gray-900">{fmt(invoice.total)}</span></div>
                {invoice.amountPaid > 0 && <div className="flex justify-between py-2 text-sm text-emerald-600"><span>Amount Paid</span><span className="font-medium">−{fmt(invoice.amountPaid)}</span></div>}
                <div className="flex justify-between py-3 rounded-xl bg-gray-50 px-4 mt-1"><span className="text-sm font-bold text-gray-900">Balance Due</span><span className={`text-lg font-black ${invoice.balanceDue <= 0 ? 'text-emerald-600' : 'text-gray-900'}`}>{fmt(invoice.balanceDue)}</span></div>
              </div>
            </div>
            {(invoice.notes || invoice.terms) && (<div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">{invoice.notes && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p><p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p></div>}{invoice.terms && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Terms</p><p className="text-sm text-gray-600 leading-relaxed">{invoice.terms}</p></div>}</div>)}
            <div className="pt-6 border-t border-gray-100 text-center text-xs text-gray-400">Generated by Warehouse Management System</div>
          </div>
        </div>
      </div>
      {showShare && <ShareModal invoice={invoice} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ==================== CREATE / EDIT MODAL ====================
function InvoiceFormModal({
  mode,
  existingInvoice,
  onClose,
  onSuccess
}: {
  mode: 'create' | 'edit';
  existingInvoice?: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const defaultForm: InvoiceForm = {
    invoiceNumber: 1,
    from: '',
    billTo: '',
    shipTo: '',
    logo: '',
    date: today(),
    dueDate: addDays(14),
    paymentTerms: 'NO TERMS',
    poNumber: '',
    lineItems: [{ id: Date.now(), description: '', quantity: 1, rate: 0 }],
    notes: '',
    terms: '',
    discount: { enabled: false, chargeType: '%', value: 0 },
    tax: { enabled: false, chargeType: '%', value: 0 },
    shipping: { enabled: false, amount: 0 },
    amountPaid: 0,
  };

const [form, setForm] = useState<InvoiceForm>(() => {
  if (mode === 'edit' && existingInvoice) {
    console.log('Building form from:', existingInvoice);
    
    // ✅ Get line items safely
    const items = existingInvoice.lineItems || [];
    console.log('Items to map:', items);
    
    return {
      invoiceNumber: existingInvoice.invoiceNumber,
      from: existingInvoice.from || '',
      billTo: existingInvoice.billTo || '',
      shipTo: existingInvoice.shipTo || '',
      logo: existingInvoice.logo || '',
      date: existingInvoice.date?.split('T')[0] || today(),
      dueDate: existingInvoice.dueDate?.split('T')[0] || addDays(14),
      paymentTerms: existingInvoice.paymentTerms || 'NO TERMS',
      poNumber: existingInvoice.poNumber || '',
      // ✅ Make sure this mapping is correct
      lineItems: items.map((l: any, i: number) => ({
        id: i + 1,
        description: l.description || '',
        quantity: l.quantity || 1,
        rate: l.rate || 0
      })),
      notes: existingInvoice.notes || '',
      terms: existingInvoice.terms || '',
      discount: existingInvoice.discount || { enabled: false, chargeType: '%', value: 0 },
      tax: existingInvoice.tax || { enabled: false, chargeType: '%', value: 0 },
      shipping: existingInvoice.shipping || { enabled: false, amount: 0 },
      amountPaid: existingInvoice.amountPaid || 0,
    };
  }
  return defaultForm;
});  useEffect(() => {
    if (mode === 'create') {
      (async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_URL}/invoices/next-number`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (data.success) setForm((p) => ({ ...p, invoiceNumber: data.nextNumber }));
        } catch {}
      })();
    }
  }, [mode]);

  const subtotal = form.lineItems.reduce((s, i) => s + (i.quantity || 0) * (i.rate || 0), 0);
  const discountAmt = form.discount.enabled ? (form.discount.chargeType === '%' ? (subtotal * form.discount.value) / 100 : form.discount.value) : 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = form.tax.enabled ? (form.tax.chargeType === '%' ? (afterDiscount * form.tax.value) / 100 : form.tax.value) : 0;
  const shippingAmt = form.shipping.enabled ? form.shipping.amount : 0;
  const total = afterDiscount + taxAmt + shippingAmt;
  const balanceDue = total - form.amountPaid;

  const setField = <K extends keyof InvoiceForm>(key: K, val: InvoiceForm[K]) => setForm((p) => ({ ...p, [key]: val }));
  const updateLine = (id: number, field: keyof LineItem, val: string | number) => setField('lineItems', form.lineItems.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  const addLine = () => setField('lineItems', [...form.lineItems, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  const removeLine = (id: number) => setField('lineItems', form.lineItems.filter((l) => l.id !== id));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setField('logo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.billTo.trim()) { setError('Bill To is required'); return; }
    if (form.lineItems.every(item => !item.description.trim())) { setError('At least one line item with description is required'); return; }
    setSaving(true);
    setError('');
    const token = getToken();
    if (!token) { setError('No authentication token found.'); setSaving(false); return; }

    try {
      const cleanLineItems = form.lineItems.filter(item => item.description.trim() !== '');
      const payload = {
        invoiceNumber: form.invoiceNumber,
        from: form.from,
        billTo: form.billTo,
        shipTo: form.shipTo,
        logo: form.logo,
        date: form.date,
        dueDate: form.dueDate,
        paymentTerms: form.paymentTerms,
        poNumber: form.poNumber,
        lineItems: cleanLineItems.map(item => ({ description: item.description, quantity: item.quantity, rate: item.rate })),
        notes: form.notes,
        terms: form.terms,
        discount: form.discount,
        tax: form.tax,
        shipping: form.shipping,
        amountPaid: form.amountPaid,
        subtotal,
        discountAmount: discountAmt,
        taxAmount: taxAmt,
        shippingAmount: shippingAmt,
        total,
        balanceDue,
        status: mode === 'create' ? 'draft' : existingInvoice?.status,
      };

      const url = mode === 'create' ? `${API_URL}/invoices` : `${API_URL}/invoices/${existingInvoice?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.success) { onSuccess(); onClose(); }
      else setError(data.message || 'Failed to save invoice');
    } catch { setError('Network error. Please check your connection.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="p-2 bg-gray-900 rounded-xl"><FileText className="w-4 h-4 text-white" /></div><div><h3 className="text-lg font-bold text-gray-900">{mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}</h3><p className="text-xs text-gray-500">{mode === 'create' ? 'Fill in the details below' : `Editing Invoice #${form.invoiceNumber}`}</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logo</label>{form.logo ? (<div className="relative w-32 h-20 border border-gray-200 rounded-xl overflow-hidden bg-gray-50"><img src={form.logo} alt="Logo" className="w-full h-full object-contain" /><button onClick={() => setField('logo', '')} className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm border"><X className="w-3 h-3 text-gray-500" /></button></div>) : (<button onClick={() => fileRef.current?.click()} className="w-32 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-400"><Upload className="w-5 h-5" /><span className="text-xs mt-1">Upload Logo</span></button>)}<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">From (Your Company)</label><textarea value={form.from} onChange={(e) => setField('from', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 resize-none" placeholder="Your company name & address" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Invoice #</label><input type="number" value={form.invoiceNumber} onChange={(e) => setField('invoiceNumber', Number(e.target.value))} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-gray-900" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-gray-900" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-gray-900" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Terms</label><input type="text" value={form.paymentTerms} onChange={(e) => setField('paymentTerms', e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-gray-900" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To <span className="text-red-500">*</span></label><textarea value={form.billTo} onChange={(e) => setField('billTo', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 resize-none" placeholder="Customer name & address" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ship To (Optional)</label><textarea value={form.shipTo} onChange={(e) => setField('shipTo', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 resize-none" placeholder="Shipping address" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Line Items</label><div className="border border-gray-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[560px]"><thead><tr className="bg-gray-900 text-white"><th className="px-4 py-3 text-left text-xs font-semibold">Description</th><th className="px-4 py-3 text-center text-xs font-semibold w-24">Qty</th><th className="px-4 py-3 text-right text-xs font-semibold w-32">Rate</th><th className="px-4 py-3 text-right text-xs font-semibold w-32">Amount</th><th className="w-10" /></tr></thead><tbody className="divide-y divide-gray-100">{form.lineItems.map((item) => (<tr key={item.id}><td className="p-2"><input type="text" value={item.description} onChange={(e) => updateLine(item.id, 'description', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900" placeholder="Item description" /></td><td className="p-2"><input type="number" min="0" value={item.quantity} onChange={(e) => updateLine(item.id, 'quantity', Number(e.target.value))} className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900" /></td><td className="p-2"><input type="number" min="0" value={item.rate} onChange={(e) => updateLine(item.id, 'rate', Number(e.target.value))} className="w-full px-3 py-2 text-sm text-right border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900" /></td><td className="p-2 text-right text-sm font-semibold text-gray-800 pr-4">{fmt((item.quantity || 0) * (item.rate || 0))}</td><td className="p-2 text-center">{form.lineItems.length > 1 && <button onClick={() => removeLine(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}</td></tr>))}</tbody></table></div></div><button onClick={addLine} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"><Plus className="w-4 h-4" /> Add Line Item</button></div>
          <div className="flex justify-end"><div className="w-80 space-y-2"><div className="flex justify-between py-1.5 text-sm text-gray-600"><span>Subtotal</span><span className="font-medium text-gray-800">{fmt(subtotal)}</span></div>{form.discount.enabled && (<div className="flex items-center gap-2"><span className="text-sm text-red-600 w-24">Discount</span><select value={form.discount.chargeType} onChange={(e) => setForm(p => ({ ...p, discount: { ...p.discount, chargeType: e.target.value as '%' | '$' } }))} className="border border-gray-200 rounded-lg px-2 py-1 text-xs"><option value="%">%</option><option value="$">$</option></select><input type="number" min="0" value={form.discount.value} onChange={(e) => setForm(p => ({ ...p, discount: { ...p.discount, value: Number(e.target.value) } }))} className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right" /><span className="text-sm text-red-600 w-20 text-right">−{fmt(discountAmt)}</span></div>)}<div className="flex gap-3 pt-1 flex-wrap">{(['discount', 'tax'] as const).map((key) => (<button key={key} onClick={() => setForm(p => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }))} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{form[key].enabled ? `Remove ${key.charAt(0).toUpperCase() + key.slice(1)}` : `+ Add ${key.charAt(0).toUpperCase() + key.slice(1)}`}</button>))}<button onClick={() => setForm(p => ({ ...p, shipping: { ...p.shipping, enabled: !p.shipping.enabled } }))} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{form.shipping.enabled ? 'Remove Shipping' : '+ Add Shipping'}</button></div><div className="flex justify-between py-3 border-t-2 border-b-2 border-gray-900 font-bold"><span>Total</span><span>{fmt(total)}</span></div><div className="flex justify-between items-center py-1.5 text-sm text-gray-600"><span>Amount Paid</span><input type="number" min="0" value={form.amountPaid} onChange={(e) => setField('amountPaid', Number(e.target.value))} className="w-28 border border-gray-200 rounded-lg p-1.5 text-right text-sm" /></div><div className={`flex justify-between pt-2 text-base font-bold rounded-xl px-4 py-3 ${balanceDue <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-900'}`}><span>Balance Due</span><span>{fmt(balanceDue)}</span></div></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</label><textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 resize-none" placeholder="Notes for customer (optional)" /></div><div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</label><textarea value={form.terms} onChange={(e) => setField('terms', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 resize-none" placeholder="Payment terms (optional)" /></div></div>
        </div>
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving...</> : mode === 'create' ? 'Create Invoice' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ==================== INVOICE CARD (MOBILE) ====================
function InvoiceCard({ invoice, onView, onEdit, onDelete }: any) {
  const status = statusConfig[invoice.status] || statusConfig.draft;
  return (
    <div onClick={() => onView(invoice)} className="bg-white rounded-xl border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md">
      <div className="flex items-start justify-between mb-3"><div><p className="font-bold text-gray-900 font-mono">#{invoice.invoiceNumber}</p><p className="text-sm text-gray-500 mt-0.5">{invoice.billTo?.split('\n')[0] || '—'}</p></div><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}><span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}</span></div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</span></div><div className="text-right"><p className="text-sm font-bold text-gray-900">{fmt(invoice.total)}</p>{invoice.balanceDue > 0 && <p className="text-xs text-red-500 font-medium">Due: {fmt(invoice.balanceDue)}</p>}</div></div>
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}><button onClick={() => onView(invoice)} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 border border-blue-100 rounded-lg bg-blue-50">View</button><button onClick={() => onEdit(invoice)} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg">Edit</button><button onClick={() => onDelete(invoice)} className="flex-1 py-1.5 text-xs font-semibold text-red-600 border border-red-100 rounded-lg bg-red-50">Delete</button></div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const PER_PAGE = 10;
  const statusTabs = [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft' }, { id: 'sent', label: 'Sent' }, { id: 'paid', label: 'Paid' }, { id: 'overdue', label: 'Overdue' }];

  useEffect(() => { loadInvoices(); }, [page, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', PER_PAGE.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      const response = await fetch(`${API_URL}/invoices?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalInvoices(data.pagination?.total || 0);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { const timer = setTimeout(() => { setPage(1); loadInvoices(); }, 500); return () => clearTimeout(timer); }, [search]);

  const fetchInvoiceDetail = async (id: string): Promise<Invoice | null> => {
    try { const token = getToken(); const res = await fetch(`${API_URL}/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } }); const data = await res.json(); return data.success ? data.data : null; } catch { return null; }
  };

  const handleViewInvoice = async (invoice: Invoice) => { const detail = await fetchInvoiceDetail(invoice._id); setSelectedInvoice(detail || invoice); setView('detail'); };
const handleEditInvoice = async (invoice: Invoice) => { 
  const detail = await fetchInvoiceDetail(invoice._id); 
  setEditingInvoice(detail || invoice); 
  setShowEditModal(true); 
};  const handleDeleteClick = (invoice: Invoice) => { setDeletingInvoice(invoice); setShowDeleteModal(true); };

  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    setDeleting(true);
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/invoices/${deletingInvoice._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        setDeletingInvoice(null);
        if (view === 'detail' && selectedInvoice?._id === deletingInvoice._id) { setView('list'); setSelectedInvoice(null); }
        loadInvoices();
      } else { alert(data.message || 'Failed to delete invoice'); }
    } catch { alert('Error deleting invoice'); } finally { setDeleting(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedInvoice) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/invoices/${selectedInvoice._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...selectedInvoice, status }) });
      const data = await res.json();
      if (data.success) { setSelectedInvoice(prev => prev ? { ...prev, status: status as any } : null); loadInvoices(); }
    } catch {}
  };

  const tabActiveClass = (id: string) => {
    if (statusFilter !== id) return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    const map: Record<string, string> = { all: 'bg-gray-900 text-white', draft: 'bg-gray-200 text-gray-800', sent: 'bg-blue-100 text-blue-700 border border-blue-200', paid: 'bg-emerald-100 text-emerald-700 border border-emerald-200', overdue: 'bg-red-100 text-red-700 border border-red-200' };
    return map[id] || 'bg-gray-900 text-white';
  };

  if (view === 'detail' && selectedInvoice) {
    return (<><InvoiceDetailView invoice={selectedInvoice} onBack={() => { setView('list'); setSelectedInvoice(null); }} onEdit={() => handleEditInvoice(selectedInvoice)} onDelete={() => handleDeleteClick(selectedInvoice)} onStatusChange={handleStatusChange} />
      {showEditModal && editingInvoice && <InvoiceFormModal mode="edit" existingInvoice={editingInvoice} onClose={() => { setShowEditModal(false); setEditingInvoice(null); }} onSuccess={async () => { loadInvoices(); const updated = await fetchInvoiceDetail(editingInvoice._id); if (updated) setSelectedInvoice(updated); setShowEditModal(false); setEditingInvoice(null); }} />}
      {showDeleteModal && deletingInvoice && <DeleteModal invoice={deletingInvoice} onConfirm={handleDeleteInvoice} onClose={() => { setShowDeleteModal(false); setDeletingInvoice(null); }} loading={deleting} />}</>);
  }

  if (loading && page === 1) { return (<div className="flex flex-col items-center justify-center h-96 gap-4"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-gray-100" /><div className="absolute inset-0 rounded-full border-4 border-t-gray-900 animate-spin" /></div><p className="text-sm text-gray-400 font-medium">Loading invoices...</p></div>); }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b sticky top-0 z-10"><div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between"><nav className="flex items-center gap-1.5 text-sm"><button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-900"><Home className="w-3.5 h-3.5" /><span>Dashboard</span></button><span className="text-gray-300">/</span><span className="text-gray-900 font-semibold">Invoices</span></nav><button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"><Plus className="w-4 h-4" /> Create Invoice</button></div></div>
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        <div><h1 className="text-3xl font-black text-gray-900 tracking-tight">Invoices</h1><p className="text-sm text-gray-500 mt-1">{totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''} total</p></div>
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">{statusTabs.map((tab) => (<button key={tab.id} onClick={() => { setStatusFilter(tab.id); setPage(1); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tabActiveClass(tab.id)}`}>{tab.label}</button>))}</div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" /></div>
{/* Desktop Table */}
<div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50">
          {['Invoice #', 'Customer', 'Date', 'Due Date', 'Total', 'Balance', 'Status', 'Actions'].map((h) => (
            <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-6 py-16 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No invoices found</p>
              <p className="text-xs text-gray-300 mt-1">Create your first invoice to get started</p>
            </td>
          </tr>
        ) : (
          invoices.map((invoice) => {
            const s = statusConfig[invoice.status] || statusConfig.draft;
            return (
              <tr
                key={invoice._id}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => handleViewInvoice(invoice)}
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    #{invoice.invoiceNumber}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-800 max-w-[200px] truncate font-medium">
                    {invoice.billTo?.split('\n')[0] || '—'}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(invoice.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">
                  {fmt(invoice.total)}
                </td>
                <td className={`px-6 py-4 text-right font-semibold text-sm ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmt(invoice.balanceDue)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleViewInvoice(invoice)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditInvoice(invoice)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(invoice)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
  
  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} · {totalInvoices} invoices
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors bg-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg">
          {page}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors bg-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )}
</div>        <div className="md:hidden">{invoices.length === 0 ? (<div className="text-center py-16 bg-white rounded-xl border border-gray-200"><FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 font-medium">No invoices found</p></div>) : (invoices.map((invoice) => (<InvoiceCard key={invoice._id} invoice={invoice} onView={handleViewInvoice} onEdit={handleEditInvoice} onDelete={handleDeleteClick} />)))}</div>
        <div className="flex items-center justify-between py-4 border-t border-gray-100"><p className="text-xs text-gray-400">System-generated invoice list</p><p className="text-xs text-gray-400">Warehouse Management System © {new Date().getFullYear()}</p></div>
      </div>
      {showCreateModal && <InvoiceFormModal mode="create" onClose={() => setShowCreateModal(false)} onSuccess={() => { loadInvoices(); setShowCreateModal(false); }} />}
      {showEditModal && editingInvoice && <InvoiceFormModal mode="edit" existingInvoice={editingInvoice} onClose={() => { setShowEditModal(false); setEditingInvoice(null); }} onSuccess={() => { loadInvoices(); setShowEditModal(false); setEditingInvoice(null); }} />}
      {showDeleteModal && deletingInvoice && <DeleteModal invoice={deletingInvoice} onConfirm={handleDeleteInvoice} onClose={() => { setShowDeleteModal(false); setDeletingInvoice(null); }} loading={deleting} />}
    </div>
  );
}