import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { quotes, Quote } from '@/data/vendorLeads';
import { formatCurrency, formatDate } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const quoteStatusColors: Record<string, string> = { Sent: '#3B82F6', Viewed: '#F59E0B', Accepted: '#16A34A', Rejected: '#DC2626' };

const scopeOptions = ['Living Room', 'Bedrooms', 'Kitchen', 'Bathrooms', 'False Ceiling', 'Flooring', 'Electrical', 'Plumbing'];

const VendorQuotes = () => {
  const [allQuotes] = useState(quotes);
  const [showBuilder, setShowBuilder] = useState(false);
  const [items, setItems] = useState<{ scope: string; description: string; qty: number; unit: string; rate: number }[]>([]);
  const [grade, setGrade] = useState<'Basic' | 'Standard' | 'Premium'>('Standard');
  const [customerName, setCustomerName] = useState('');

  const gradeMultiplier = { Basic: 0.8, Standard: 1, Premium: 1.4 };
  const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate * gradeMultiplier[grade]), 0);

  const addItem = () => setItems(prev => [...prev, { scope: scopeOptions[0], description: '', qty: 1, unit: 'sqft', rate: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSendQuote = () => {
    if (!customerName || items.length === 0) { toast.error('Add customer name and at least one item'); return; }
    setShowBuilder(false);
    setItems([]);
    setCustomerName('');
    toast.success('Quote sent to customer via WhatsApp');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Quotes</h2>
          <button onClick={() => setShowBuilder(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:opacity-90 flex items-center gap-2">
            <Plus size={16} /> Create Quote
          </button>
        </div>

        {/* Quotes Table */}
        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Quote ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Date Sent</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {allQuotes.map(q => (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{q.id}</td>
                  <td className="px-4 py-3 text-card-foreground">{q.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.project}</td>
                  <td className="px-4 py-3 text-right font-semibold text-card-foreground">{formatCurrency(q.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(q.dateSent)}</td>
                  <td className="px-4 py-3"><StatusBadge status={q.status} color={quoteStatusColors[q.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBuilder(false)} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up space-y-4">
            <h3 className="text-lg font-bold text-card-foreground">Quote Builder</h3>

            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />

            <div className="flex gap-2">
              {(['Basic', 'Standard', 'Premium'] as const).map(g => (
                <button key={g} onClick={() => setGrade(g)} className={`px-4 py-2 rounded-lg text-sm font-medium ${grade === g ? 'bg-[#0D9488] text-white' : 'bg-muted text-muted-foreground'}`}>{g}</button>
              ))}
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <select value={item.scope} onChange={e => updateItem(i, 'scope', e.target.value)} className="px-2 py-1 rounded bg-card text-sm outline-none flex-1">
                      {scopeOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => removeItem(i)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                  </div>
                  <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" className="w-full px-2 py-1 rounded bg-card text-sm outline-none" />
                  <div className="flex gap-2">
                    <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', +e.target.value)} className="w-20 px-2 py-1 rounded bg-card text-sm outline-none" placeholder="Qty" />
                    <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-20 px-2 py-1 rounded bg-card text-sm outline-none" placeholder="Unit" />
                    <input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', +e.target.value)} className="w-28 px-2 py-1 rounded bg-card text-sm outline-none" placeholder="Rate" />
                    <span className="text-sm font-medium text-card-foreground self-center">{formatCurrency(Math.round(item.qty * item.rate * gradeMultiplier[grade]))}</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="w-full px-4 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted flex items-center justify-center gap-2">
              <Plus size={14} /> Add Line Item
            </button>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-semibold text-card-foreground">Total ({grade})</span>
              <span className="text-lg font-bold text-card-foreground">{formatCurrency(Math.round(totalAmount))}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowBuilder(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleSendQuote} className="flex-1 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:opacity-90">Send via WhatsApp</button>
              <button onClick={() => toast.success('PDF downloaded')} className="flex-1 px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:opacity-90">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VendorQuotes;
