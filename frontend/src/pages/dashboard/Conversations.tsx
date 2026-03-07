import { Search, CheckCheck } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: "Marcus Wright",
    message: "Can I book for tomorrow at 2pm?",
    time: "10:45 AM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    active: true
  },
  {
    id: 2,
    name: "Elena Gilbert",
    message: "I need to talk to someone about my refund.",
    time: "Yesterday",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    active: false
  },
  {
    id: 3,
    name: "Tyler Lockwood",
    message: "Thank you, see you then!",
    time: "Monday",
    avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    active: false
  }
];

const messages = [
  {
    id: 1,
    text: "Hi! I'd like to book a haircut and beard trim for tomorrow around 4 PM.",
    time: "12:42 PM",
    sender: "user"
  },
  {
    id: 2,
    text: "Hello Sarah! I can certainly help with that. Let me check the schedule for tomorrow at 4:00 PM...",
    time: "12:43 PM",
    sender: "agent"
  },
  {
    id: 3,
    text: "4:15 works perfect. Do I need to pay a deposit?",
    time: "12:45 PM",
    sender: "user"
  },
  {
    id: 4,
    text: "Hello Sarah! I can certainly help with that. Let me check the schedule for tomorrow at 4:00 PM...",
    time: "12:43 PM",
    sender: "agent"
  },
  {
    id: 5,
    text: "Hello Sarah! I can certainly help with that. Let me check the schedule for tomorrow at 4:00 PM...",
    time: "12:45 PM",
    sender: "agent",
    isAi: true
  }
];

export default function Conversations() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6 pb-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-[350px] bg-white rounded-2xl border border-gray-200 flex flex-col shrink-0 h-full overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${chat.active ? 'bg-[#F9FAFB]' : ''}`}
            >
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-gray-900 text-[15px] truncate">{chat.name}</h3>
                  <span className="text-[11px] text-[#6B7280] font-medium shrink-0">{chat.time}</span>
                </div>
                <p className="text-[13px] text-[#6B7280] truncate">{chat.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#1BBB75] rounded-2xl flex flex-col overflow-hidden relative h-full">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] lg:max-w-[70%] p-4 relative shadow-sm ${msg.sender === 'agent'
                  ? 'bg-[#E1FFED] text-gray-800 rounded-2xl rounded-tr-sm'
                  : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'
                  }`}
              >
                <p className="text-[14px] leading-relaxed mb-2">{msg.text}</p>

                <div className="flex justify-end items-center gap-1.5 mt-1">
                  {msg.isAi && <span className="text-[11px] text-[#F59E0B] font-medium flex items-center gap-1">✨ AI generated</span>}
                  <span className="text-[11px] text-gray-400 font-medium">{msg.time}</span>
                  {msg.sender === 'agent' && <CheckCheck className="w-[14px] h-[14px] text-[#3B82F6]" />}
                </div>

                {/* Triangle Tail */}
                <div
                  className={`absolute top-0 w-0 h-0 border-[10px] border-transparent ${msg.sender === 'agent'
                    ? 'right-[-8px] border-t-[#E1FFED] border-l-[#E1FFED]'
                    : 'left-[-8px] border-t-white border-r-white'
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
