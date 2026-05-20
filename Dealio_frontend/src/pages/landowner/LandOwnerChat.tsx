import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { Send, Paperclip } from 'lucide-react';

type DealStage = 'Interested' | 'In Discussion' | 'Term Sheet' | 'Agreement' | 'Closed';
const dealStages: DealStage[] = ['Interested', 'In Discussion', 'Term Sheet', 'Agreement', 'Closed'];
const dealStageColors: Record<DealStage, string> = { Interested: '#3B82F6', 'In Discussion': '#F59E0B', 'Term Sheet': '#8B5CF6', Agreement: '#0A7E8C', Closed: '#16A34A' };

interface ChatMessage {
  id: string;
  sender: 'owner' | 'builder';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  landParcel: string;
  builderName: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  dealStage: DealStage;
  messages: ChatMessage[];
}

const initialConversations: Conversation[] = [
  {
    id: 'C001', landParcel: 'Kokapet — 2.5 acres', builderName: 'Rajesh Mehta', company: 'Prestige Group',
    lastMessage: 'We can discuss the JV terms tomorrow.', timestamp: '2025-01-19 14:30', dealStage: 'In Discussion',
    messages: [
      { id: 'm1', sender: 'builder', text: 'Hello, we are very interested in your Kokapet land parcel for a premium villa project.', time: '10:00 AM' },
      { id: 'm2', sender: 'owner', text: 'Thank you for your interest. What JV terms are you proposing?', time: '10:15 AM' },
      { id: 'm3', sender: 'builder', text: 'We propose a 40:60 split with premium villa development. Expected 120 units.', time: '10:30 AM' },
      { id: 'm4', sender: 'owner', text: 'I was hoping for 45:55. Let me think about it.', time: '11:00 AM' },
      { id: 'm5', sender: 'builder', text: 'We can discuss the JV terms tomorrow.', time: '2:30 PM' },
    ],
  },
  {
    id: 'C002', landParcel: 'Kokapet — 2.5 acres', builderName: 'Sunil Kapoor', company: 'Sobha Ltd',
    lastMessage: 'NDA has been signed. Sharing detailed proposal.', timestamp: '2025-01-18 16:00', dealStage: 'Term Sheet',
    messages: [
      { id: 'm1', sender: 'builder', text: 'We have signed the NDA and would like to share our detailed proposal.', time: '3:00 PM' },
      { id: 'm2', sender: 'owner', text: 'Please go ahead and share the proposal.', time: '3:30 PM' },
      { id: 'm3', sender: 'builder', text: 'NDA has been signed. Sharing detailed proposal.', time: '4:00 PM' },
    ],
  },
  {
    id: 'C003', landParcel: 'Adibatla — 4.1 acres', builderName: 'Anand Sharma', company: 'Aparna Constructions',
    lastMessage: 'Can we schedule a site visit next week?', timestamp: '2025-01-17 11:00', dealStage: 'Interested',
    messages: [
      { id: 'm1', sender: 'builder', text: 'We are interested in outright purchase of the Adibatla land.', time: '10:00 AM' },
      { id: 'm2', sender: 'builder', text: 'Can we schedule a site visit next week?', time: '11:00 AM' },
    ],
  },
];

const LandOwnerChat = () => {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChat, setActiveChat] = useState(conversations[0].id);
  const [newMessage, setNewMessage] = useState('');

  const active = conversations.find(c => c.id === activeChat)!;

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = { id: `m${Date.now()}`, sender: 'owner', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversations(prev => prev.map(c => c.id === activeChat ? { ...c, messages: [...c.messages, msg], lastMessage: newMessage, timestamp: new Date().toISOString() } : c));
    setNewMessage('');
  };

  const updateDealStage = () => {
    const currentIdx = dealStages.indexOf(active.dealStage);
    if (currentIdx < dealStages.length - 1) {
      const next = dealStages[currentIdx + 1];
      setConversations(prev => prev.map(c => c.id === activeChat ? { ...c, dealStage: next } : c));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex gap-0 h-[calc(100vh-7rem)] bg-card rounded-lg border border-border overflow-hidden card-shadow">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border"><h3 className="font-semibold text-card-foreground">Deal Conversations</h3></div>
          {conversations.map(c => (
            <button key={c.id} onClick={() => setActiveChat(c.id)} className={`w-full text-left p-4 border-b border-border hover:bg-muted/30 transition-colors ${activeChat === c.id ? 'bg-muted/50' : ''}`}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#C0392B] flex items-center justify-center text-white text-xs font-bold">{c.builderName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">{c.builderName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.landParcel}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
            </button>
          ))}
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{active.builderName} — {active.company}</h3>
              <p className="text-xs text-muted-foreground">{active.landParcel}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {dealStages.map((s, i) => {
                  const isActive = dealStages.indexOf(active.dealStage) >= i;
                  return (
                    <div key={s} className={`px-2 py-1 rounded text-[10px] font-medium ${isActive ? 'text-white' : 'bg-muted text-muted-foreground'}`} style={isActive ? { backgroundColor: dealStageColors[s] } : {}}>
                      {s}
                    </div>
                  );
                })}
              </div>
              <button onClick={updateDealStage} className="px-3 py-1.5 rounded text-xs font-medium bg-[#C0392B] text-white hover:opacity-90">
                Advance Stage
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {active.messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'owner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.sender === 'owner' ? 'bg-[#C0392B] text-white rounded-br-md' : 'bg-muted text-card-foreground rounded-bl-md'}`}>
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.sender === 'owner' ? 'text-white/70' : 'text-muted-foreground'}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex items-center gap-3">
            <button className="p-2 hover:bg-muted rounded-lg"><Paperclip size={18} className="text-muted-foreground" /></button>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-sm outline-none text-foreground" />
            <button onClick={handleSend} className="p-2.5 rounded-lg bg-[#C0392B] text-white hover:opacity-90"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LandOwnerChat;
