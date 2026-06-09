// ─── DealRoom — one per-deal hub, shared by builder / cp / customer ─────────────
//
// Renders a single deal for ANY role from the stage machine in src/lib/dealStages.ts:
//   stage stepper + role-specific action card + visibility-scoped documents +
//   live deal chat (socket.io deal:${id} room) + activity timeline.
//
// Each role page fetches its deal (builderApi.getDeal / cpApi.getCPDeal /
// portalApi.getMyDeals), maps it to DealRoomDeal, and renders <DealRoom />.
// Adding a stage or changing an action is a one-line edit in dealStages.ts.

import { Link } from 'react-router-dom';
import { useDealSocket } from '@/hooks/useDealSocket';
import {
  DealRole, DEAL_PIPELINE, normalizeStage, stageIndex,
  STAGE_META, actionFor, headlineFor,
} from '@/lib/dealStages';
import {
  FileText, ExternalLink, Clock, MessageSquare, ArrowRight,
  CheckCircle2, Circle, Send,
} from 'lucide-react';
import { useState } from 'react';

export interface DealRoomDoc {
  id: number | string;
  name: string;
  docType: string;
  fileUrl?: string | null;
  uploadedByRole?: string;
  sharedWithCp?: boolean;
  sharedWithCustomer?: boolean;
  createdAt?: string;
}

export interface DealRoomActivity {
  id: number | string;
  label: string;
  date?: string;
  actorRole?: string;
}

export interface DealRoomDeal {
  id: number;
  projectName: string;
  unitType?: string;
  status: string; // raw backend status — normalized internally
  dealValue?: number | null;
  documents?: DealRoomDoc[];
  activities?: DealRoomActivity[];
}

// Per-party document visibility. Works whether the backend already filtered
// (flag absent → visible) or returned everything (flag present → honour it).
function visibleDocs(docs: DealRoomDoc[], role: DealRole): DealRoomDoc[] {
  if (role === 'builder') return docs;
  const key = role === 'cp' ? 'sharedWithCp' : 'sharedWithCustomer';
  return docs.filter((d) => d[key] === undefined || d[key] === true);
}

function fmtMoney(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function fmtTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Stage stepper (exported for standalone reuse) ──────────────────────────────

export function StageStepper({ status }: { status: string }) {
  const current = stageIndex(status);
  return (
    <div className="flex items-center w-full overflow-x-auto py-1">
      {DEAL_PIPELINE.map((stage, i) => {
        const meta = STAGE_META[stage];
        const done = i < current;
        const active = i === current;
        return (
          <div key={stage} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5 px-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: done || active ? meta.color : '#E5E7EB',
                  boxShadow: active ? `0 0 0 4px ${meta.color}22` : undefined,
                }}
              >
                {done ? (
                  <CheckCircle2 size={15} className="text-white" />
                ) : (
                  <Circle size={13} className={active ? 'text-white' : 'text-gray-400'} />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {meta.label}
              </span>
            </div>
            {i < DEAL_PIPELINE.length - 1 && (
              <div className="h-0.5 w-8 sm:w-12 rounded-full" style={{ background: i < current ? meta.color : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function DealRoom({ deal, role }: { deal: DealRoomDeal; role: DealRole }) {
  const stage = normalizeStage(deal.status);
  const meta = STAGE_META[stage];
  const action = actionFor(deal.status, role, deal.id);
  const docs = visibleDocs(deal.documents ?? [], role);

  const { messages, connected, sendMessage } = useDealSocket(deal.id);
  const [draft, setDraft] = useState('');

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    sendMessage(text);
    setDraft('');
  }

  return (
    <div className="space-y-5">
      {/* Header + stage badge */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Deal #{deal.id}</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{deal.projectName}</h2>
            {deal.unitType && <p className="text-sm text-gray-500">{deal.unitType}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>{meta.label}</span>
            {deal.dealValue ? <p className="text-sm font-semibold text-gray-900 mt-1.5">{fmtMoney(deal.dealValue)}</p> : null}
          </div>
        </div>

        <StageStepper status={deal.status} />
      </div>

      {/* Role-specific action card */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: `${meta.color}33`, background: `${meta.color}0A` }}>
        <p className="text-sm text-gray-700 leading-relaxed">{headlineFor(deal.status, role)}</p>
        {action && (
          <Link
            to={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: meta.color }}
          >
            {action.label}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Documents — visibility-scoped to this role */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <FileText size={12} /> Documents
        </p>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
            No documents shared with you yet.
          </p>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 bg-gray-50/70 border border-gray-100 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText size={15} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.docType}</p>
              </div>
              {doc.fileUrl ? (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 shrink-0"
                >
                  <ExternalLink size={12} /> Open
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium shrink-0">
                  <Clock size={12} /> Pending
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Live deal chat — socket.io deal:${id} room, scoped to this deal only */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <MessageSquare size={12} /> Conversation
          <span className={`ml-1 w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`} title={connected ? 'Live' : 'Connecting…'} />
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No messages yet. Start the conversation below.</p>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderRole === role;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] ${
                    mine ? 'ml-auto bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <p className="text-[10px] font-bold text-gray-500 mb-0.5">
                    {mine ? 'You' : `${msg.senderName} · ${msg.senderRole}`}
                  </p>
                  <p className="text-gray-800 leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{fmtTime(msg.createdAt)}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-end gap-2 pt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || !connected}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity shrink-0"
            style={{ background: meta.color }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Activity timeline */}
      {deal.activities && deal.activities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity</p>
          <div className="space-y-2.5">
            {deal.activities.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">{a.label}</p>
                  {a.date && <p className="text-[11px] text-gray-400">{fmtTime(a.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
