import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Loader2, Star, MessageSquare, Calendar, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminMeeting {
  id: number;
  projectName: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  confirmedDate: string | null;
  confirmedTime: string | null;
  status: string;
  notes: string | null;
  builderNotes: string | null;
  cpNotes: string | null;
  cpRating: number | null;
  customerRating: number | null;
  meetingType: string | null;
  createdAt: string;
  cpName?: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  Pending:              'bg-amber-100 text-amber-700 border-amber-200',
  Confirmed:            'bg-blue-100 text-blue-700 border-blue-200',
  Rescheduled:          'bg-orange-100 text-orange-700 border-orange-200',
  Completed:            'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Follow-up Required': 'bg-violet-100 text-violet-700 border-violet-200',
  Cancelled:            'bg-red-100 text-red-600 border-red-200',
};

const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-[11px] text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`text-base ${rating >= s ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground ml-0.5">{RATING_LABEL[rating]}</span>
    </div>
  );
}

const STATUSES = ['All', 'Pending', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled', 'Follow-up Required'];

const AdminMeetings = () => {
  const [meetings, setMeetings]     = useState<AdminMeeting[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('All');
  const [ratingFilter, setRating]   = useState('All');
  const [selected, setSelected]     = useState<AdminMeeting | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMeetings({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search || undefined,
      }) as AdminMeeting[];
      setMeetings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = meetings.filter(m => {
    if (ratingFilter === 'Rated')   return !!(m.cpRating || m.customerRating);
    if (ratingFilter === 'Unrated') return !m.cpRating && !m.customerRating;
    return true;
  });

  const avgCpRating = (() => {
    const rated = meetings.filter(m => m.cpRating);
    if (!rated.length) return null;
    return (rated.reduce((s, m) => s + (m.cpRating ?? 0), 0) / rated.length).toFixed(1);
  })();
  const avgCustomerRating = (() => {
    const rated = meetings.filter(m => m.customerRating);
    if (!rated.length) return null;
    return (rated.reduce((s, m) => s + (m.customerRating ?? 0), 0) / rated.length).toFixed(1);
  })();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Meeting Reviews</h1>
            <p className="text-sm text-muted-foreground mt-0.5">CP ratings &amp; notes across all site visits</p>
          </div>
          {/* Summary pills */}
          <div className="flex gap-2 flex-wrap text-sm">
            <div className="bg-card border border-border rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="font-semibold">{meetings.length}</span>
              <span className="text-muted-foreground">total</span>
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Star size={13} className="text-amber-400" />
              <span className="font-semibold">{meetings.filter(m => m.cpRating || m.customerRating).length}</span>
              <span className="text-muted-foreground">rated</span>
            </div>
            {avgCpRating && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Star size={13} className="text-amber-500 fill-amber-400" />
                <span className="font-bold text-amber-700">{avgCpRating}</span>
                <span className="text-amber-600 text-[11px]">CP avg</span>
              </div>
            )}
            {avgCustomerRating && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Star size={13} className="text-blue-500 fill-blue-400" />
                <span className="font-bold text-blue-700">{avgCustomerRating}</span>
                <span className="text-blue-600 text-[11px]">Customer avg</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer, project…"
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  statusFilter === s ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'
                }`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {['All', 'Rated', 'Unrated'].map(r => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  ratingFilter === r ? 'bg-amber-500 text-white border-amber-500' : 'border-border text-muted-foreground hover:border-amber-300'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table / list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No meetings match this filter.</div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Project</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CP Rating</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Customer Rating</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">CP Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{m.customerName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={10} />{m.customerPhone}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{m.projectName}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-[12px]">
                      {fmtDate(m.confirmedDate ?? m.preferredDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StarDisplay rating={m.cpRating} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StarDisplay rating={m.customerRating} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-[220px]">
                      {m.cpNotes
                        ? <p className="text-[12px] text-muted-foreground truncate">{m.cpNotes}</p>
                        : <span className="text-[11px] text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail drawer */}
        {selected && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <div className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl overflow-y-auto p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg text-foreground">{selected.customerName}</h2>
                  <p className="text-sm text-muted-foreground">{selected.projectName}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">✕</button>
              </div>

              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_COLOR[selected.status] ?? ''}`}>
                {selected.status}
              </span>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selected.customerPhone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Preferred</span><span>{fmtDate(selected.preferredDate)} · {selected.preferredTime}</span></div>
                {selected.confirmedDate && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Confirmed</span><span className="text-emerald-600 font-medium">{fmtDate(selected.confirmedDate)}{selected.confirmedTime ? ` · ${selected.confirmedTime}` : ''}</span></div>
                )}
                {selected.cpName && (
                  <div className="flex justify-between"><span className="text-muted-foreground">CP</span><span>{selected.cpName}</span></div>
                )}
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">CP Rating</p>
                  <StarDisplay rating={selected.cpRating} />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Customer Rating</p>
                  <StarDisplay rating={selected.customerRating} />
                </div>
              </div>

              {/* CP Notes */}
              {selected.cpNotes && (
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MessageSquare size={10} /> CP Notes
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.cpNotes}</p>
                </div>
              )}

              {/* Builder Notes */}
              {selected.builderNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Builder Notes</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{selected.builderNotes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminMeetings;
