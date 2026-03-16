import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Phone, RefreshCw, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

interface WebhookConversation {
  Contact_name?: string;
  Contact_number?: string;
  timestamp?: string | number;
  Business_Name?: string;
  Business_ID?: string | null;
  Recieved_Message?: string;  // capital M — user's message
  Sent_message?: string;      // lowercase m — AI's message
}

interface ContactGroup {
  contactName: string;
  contactNumber: string;
  businessName: string;
  messages: WebhookConversation[];
  latestTimestamp: number;
}

const WA_GREEN = '#25D366';
const WA_DARK_GREEN = '#128C7E';
const WA_TEAL = '#075E54';
const WA_BG = '#ECE5DD';
const WA_PANEL = '#f0f2f5';

export default function Conversations() {
  const [conversations, setConversations] = useState<WebhookConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactGroup | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (isBgRefresh = false) => {
    if (!isBgRefresh) setLoading(true);
    try {
      const data = await apiFetch('/api/chatbot/conversations/');
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load conversations.');
    } finally {
      if (!isBgRefresh) setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await apiFetch('/api/chatbot/conversations/sync/', { method: 'POST' });
      if (result.new_messages_synced > 0) {
        toast.success(`${result.new_messages_synced} new messages synced!`);
      } else {
        toast.success('Already up to date!');
      }
      await fetchConversations(true);
    } catch {
      toast.error('Sync failed. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact]);

  const formatTime = (ts?: string | number) => {
    if (!ts) return '';
    const date = new Date(Number(ts) * 1000);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts?: string | number) => {
    if (!ts) return '';
    const date = new Date(Number(ts) * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const filtered = conversations.filter(c => {
    const term = searchQuery.toLowerCase();
    return (
      (c.Contact_name || '').toLowerCase().includes(term) ||
      (c.Business_Name || '').toLowerCase().includes(term) ||
      (c.Contact_number || '').includes(term)
    );
  });

  // Group by Business, then by contact
  const groupedByBusiness: Record<string, ContactGroup[]> = {};
  filtered.forEach(chat => {
    const biz = chat.Business_Name || 'Unassigned';
    if (!groupedByBusiness[biz]) groupedByBusiness[biz] = [];
    const contactNum = chat.Contact_number || '';
    const contactName = chat.Contact_name || 'Unknown';
    const ts = chat.timestamp ? Number(chat.timestamp) : 0;
    const existing = groupedByBusiness[biz].find(g =>
      (contactNum && g.contactNumber === contactNum) ||
      (!contactNum && g.contactName === contactName)
    );
    if (existing) {
      existing.messages.push(chat);
      if (ts > existing.latestTimestamp) existing.latestTimestamp = ts;
    } else {
      groupedByBusiness[biz].push({ contactName, contactNumber: contactNum, businessName: biz, messages: [chat], latestTimestamp: ts });
    }
  });

  // Sort messages chronologically within each group
  Object.values(groupedByBusiness).forEach(groups => {
    groups.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
    groups.forEach(g => g.messages.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)));
  });

  // Group messages by date for separators
  const getDateGroups = (messages: WebhookConversation[]) => {
    const groups: { date: string; msgs: WebhookConversation[] }[] = [];
    messages.forEach(msg => {
      const d = formatDate(msg.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.date === d) last.msgs.push(msg);
      else groups.push({ date: d, msgs: [msg] });
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: WA_DARK_GREEN }} />
          <p className="text-sm text-gray-500">Loading conversations…</p>
        </div>
      </div>
    );
  }

  const avatarInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white" style={{ fontFamily: "'Segoe UI', Helvetica Neue, Arial, sans-serif" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <div className={`w-full md:w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white ${selectedContact ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: WA_TEAL }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: WA_DARK_GREEN }}>
              AI
            </div>
            <span className="text-white font-semibold text-[15px]">AI Conversations</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sync latest messages"
            className="p-2 rounded-full transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-white ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2" style={{ background: WA_PANEL }}>
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search in the name of Business or Contact"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#fff' }}>
          {Object.keys(groupedByBusiness).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <RefreshCw className="w-8 h-8 opacity-30" />
              <p className="text-sm">No conversations yet. Click Sync!</p>
            </div>
          ) : (
            Object.entries(groupedByBusiness).map(([bizName, groups]) => (
              <div key={bizName}>
                {/* Business Header */}
                <div className="px-4 py-1.5 flex items-center gap-2 sticky top-0 z-10" style={{ background: WA_PANEL }}>
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: WA_DARK_GREEN }}>
                    {bizName}
                  </span>
                </div>

                {groups.map((group, idx) => {
                  const isSelected = selectedContact?.contactNumber === group.contactNumber && selectedContact?.contactName === group.contactName;
                  const latestMsg = group.messages[group.messages.length - 1];
                  const preview = latestMsg.Sent_message || latestMsg.Recieved_Message || '…';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedContact(group)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors"
                      style={{ background: isSelected ? '#f0f2f5' : 'transparent' }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-xl font-bold" style={{ background: WA_DARK_GREEN }}>
                        {avatarInitial(group.contactName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-[15px] text-gray-900 truncate">{group.contactName}</span>
                          <span className="text-[11px] shrink-0 ml-2" style={{ color: isSelected ? WA_DARK_GREEN : '#667781' }}>
                            {formatTime(group.latestTimestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 shrink-0" style={{ color: WA_GREEN }} />
                          <span className="text-[13px] text-gray-500 truncate">{preview}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CHAT PANEL ───────────────────────────────────────── */}
      <div className={`flex-1 flex-col ${!selectedContact ? 'hidden md:flex' : 'flex'}`} style={{ background: WA_PANEL }}>
        {selectedContact ? (
          <>
            {/* Chat Top Bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 shadow-sm shrink-0" style={{ background: WA_TEAL }}>
              <button
                onClick={() => setSelectedContact(null)}
                className="md:hidden mr-1 p-1.5 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                title="Back to contacts"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: WA_DARK_GREEN }}>
                {avatarInitial(selectedContact.contactName)}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-[15px] leading-tight">{selectedContact.contactName}</p>
                <p className="text-white/70 text-[12px] flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selectedContact.contactNumber || 'No number'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-white/70 font-medium">{selectedContact.businessName}</span>
                <p className="text-[10px] text-white/50">{selectedContact.messages.length} messages</p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
              style={{
                background: `${WA_BG} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath fill='%23c9c3bb' fill-opacity='0.15' d='M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'/%3E%3C/svg%3E")`,
              }}
            >
              {getDateGroups(selectedContact.messages).map((group, gi) => (
                <div key={gi}>
                  {/* Date Separator */}
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm" style={{ background: '#e1f0e8', color: '#545454' }}>
                      {group.date}
                    </span>
                  </div>

                  {group.msgs.map((msg, mi) => (
                    <div key={mi} className="space-y-1 mb-1">

                      {/* User Message — left, white bubble */}
                      {msg.Recieved_Message && (
                        <div className="flex justify-start">
                          <div className="max-w-[65%] relative">
                            <div
                              className="px-3 py-2 rounded-lg rounded-tl-sm shadow-sm"
                              style={{ background: '#fff' }}
                            >
                              {/* Tail */}
                              <div
                                className="absolute top-0 left-[-8px] w-0 h-0"
                                style={{
                                  borderRight: '8px solid #fff',
                                  borderBottom: '8px solid transparent',
                                }}
                              />
                              <p className="text-[14px] text-gray-800 leading-relaxed">{msg.Recieved_Message}</p>
                              <div className="flex justify-end items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Message — right, green bubble */}
                      {msg.Sent_message && (
                        <div className="flex justify-end">
                          <div className="max-w-[65%] relative">
                            <div
                              className="px-3 py-2 rounded-lg rounded-tr-sm shadow-sm"
                              style={{ background: '#d9fdd3' }}
                            >
                              {/* Tail */}
                              <div
                                className="absolute top-0 right-[-8px] w-0 h-0"
                                style={{
                                  borderLeft: '8px solid #d9fdd3',
                                  borderBottom: '8px solid transparent',
                                }}
                              />
                              <p className="text-[14px] text-gray-800 leading-relaxed">{msg.Sent_message}</p>
                              <div className="flex justify-end items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                                <CheckCheck className="w-3.5 h-3.5" style={{ color: WA_DARK_GREEN }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* System ping — no messages on either side */}
                      {!msg.Recieved_Message && !msg.Sent_message && (
                        <div className="flex justify-center my-2">
                          <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: '#ffe9c6', color: '#888' }}>
                            System ping · {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Input bar (read-only indicator) */}
            <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: WA_PANEL }}>
              <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-gray-400 border border-gray-200 select-none">
                View-only mode — conversations are read-only
              </div>
            </div>
          </>
        ) : (
          /* No chat selected */
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: WA_BG }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: WA_DARK_GREEN }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.14-1.34A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-light text-gray-700 mb-1">AI Conversations</h3>
              <p className="text-sm text-gray-500">Select a contact to view their conversation history</p>
            </div>
            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <span className="text-[12px] text-gray-500">🔒 End-to-end context secured</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
