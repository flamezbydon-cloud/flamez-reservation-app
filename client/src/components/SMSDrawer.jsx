import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Wifi, 
  Battery, 
  Signal, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function SMSDrawer({
  isOpen,
  onClose,
  activePhone = '+1 (555) 234-8901',
  onMessageReceived
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSmsLogs();
      setMessages(res.logs || []);
    } catch (err) {
      console.error('Failed to load SMS logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle user replying from the virtual phone
  const handleSendReply = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setIsSending(true);
    setInputText('');

    try {
      await api.simulateReply(activePhone, text.trim());
      await fetchLogs();
      if (onMessageReceived) onMessageReceived();
    } catch (err) {
      alert('Failed to send SMS reply: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-noir-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Virtual Smartphone Container */}
      <div className="w-full max-w-md h-full bg-noir-950 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden relative animate-in slide-in-from-right duration-300">
        
        {/* Smartphone Bezel Header */}
        <div className="bg-noir-900 border-b border-white/10 pt-3 pb-2 px-4 select-none">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
            <span className="font-semibold">9:41</span>
            <div className="w-20 h-4 bg-noir-950 rounded-full mx-auto"></div>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Conversation Nav Bar */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-noir-950 font-bold font-serif text-sm shadow-md">
                🔥
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">Flamez by Don</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-emerald-400 font-mono">
                  Verified SMS Gateway • Guru 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchLogs}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                title="Refresh SMS"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                title="Close Virtual Phone"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Pill */}
        <div className="bg-noir-900/60 px-4 py-1.5 border-b border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Active Device: <span className="font-mono text-gold-300">{activePhone}</span></span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
            Live Two-Way SMS
          </span>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-noir-950 via-noir-900 to-noir-950">
          
          <div className="text-center my-2">
            <span className="text-[10px] bg-white/5 text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Today
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
              <p>No SMS messages sent yet.</p>
              <p className="text-[11px]">Book a reservation to see instant SMS confirmation here!</p>
            </div>
          ) : (
            messages.map((sms) => {
              const isUserReply = sms.type === 'INCOMING_USER_SMS';

              return (
                <div
                  key={sms.id}
                  className={`flex flex-col ${isUserReply ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                      isUserReply
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-sm'
                        : 'bg-noir-850 text-slate-100 border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{sms.message}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 px-1 font-mono">
                    <span>
                      {sms.timestamp ? new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                    <span>•</span>
                    <span className={sms.status?.includes('Delivered') ? 'text-emerald-400' : 'text-slate-400'}>
                      {sms.provider || 'Gateway'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (e.g. Reply CANCEL) */}
        <div className="px-3 py-2 bg-noir-900/90 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Quick Reply:</span>
          <button
            onClick={() => handleSendReply('CANCEL')}
            className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 whitespace-nowrap transition-all"
          >
            Reply CANCEL
          </button>
          <button
            onClick={() => handleSendReply('DIRECTIONS')}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10 whitespace-nowrap transition-all"
          >
            Directions & Parking
          </button>
          <button
            onClick={() => handleSendReply('HELP')}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10 whitespace-nowrap transition-all"
          >
            Host Stand Info
          </button>
        </div>

        {/* SMS Input Box */}
        <div className="p-3 bg-noir-900 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendReply();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Text message (e.g. CANCEL)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-noir-850 border border-white/10 text-white placeholder-slate-500 text-xs outline-none focus:border-gold-400 transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-noir-950 flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
