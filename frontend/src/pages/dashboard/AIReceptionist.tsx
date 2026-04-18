import React, { useState, useEffect } from 'react';
import { Mic, Loader2, Lock, ShieldCheck, Sparkles, Plus, CheckCircle2, Phone, Zap, Headphones, Settings, ArrowRight, MessageSquare, Briefcase, Clock, FileText, Play, Pause, Volume2, User, UserCheck, Search, Filter } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

interface UserProfile {
  full_name: string;
  email: string;
  is_paid: boolean;
  business_profile: {
    business_name: string;
    vapi_assistant_id: string;
  };
}

const AVAILABLE_VOICES = [
  // Vapi Native Voices - Verified IDs
  { id: 'Clara', name: 'Clara', gender: 'Female', personality: 'Warm & Professional', provider: 'vapi', previewText: "Hello! I'm Clara. I'll handle your business calls with a warm and professional tone." },
  { id: 'Lily', name: 'Lily', gender: 'Female', personality: 'Energetic & Friendly', provider: 'vapi', previewText: "Hi! I'm Lily! I'll bring a friendly and energetic vibe to your business conversations." },
  { id: 'Emma', name: 'Emma', gender: 'Female', personality: 'Kind & Attentive', provider: 'vapi', previewText: "Hello, I'm Emma. I'm dedicated to providing a kind and attentive experience for your callers." },
  { id: 'Leo', name: 'Leo', gender: 'Male', personality: 'Calm & Trustworthy', provider: 'vapi', previewText: "Hi there, I'm Leo. I'm here to ensure your customers feel heard and valued." },
  { id: 'Nico', name: 'Nico', gender: 'Male', personality: 'Clear & Authoritative', provider: 'vapi', previewText: "Good day. I'm Nico. I specialize in clear, direct, and efficient communication." },
  { id: 'Dan', name: 'Dan', gender: 'Male', personality: 'Deep & Confident', provider: 'vapi', previewText: "Hello, I'm Dan. I'll provide your business with a deep and confident presence." },
  { id: 'Layla', name: 'Layla', gender: 'Female', personality: 'Soft & Natural', provider: 'vapi', previewText: "Hello, I'm Layla. I offer a sweet and natural voice for your business." },
  { id: 'Zoe', name: 'Zoe', gender: 'Female', personality: 'Brisk & Professional', provider: 'vapi', previewText: "Hi, I'm Zoe. I provide a brisk and professional tone for all your calls." },
  { id: 'Sid', name: 'Sid', gender: 'Male', personality: 'Steady & Mature', provider: 'vapi', previewText: "Good day, I'm Sid. I bring a steady and mature presence to your business." },
];

export default function AIReceptionist() {
  const { user: initialUser } = useOutletContext<{ user: UserProfile | null }>();
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [creatingAssistant, setCreatingAssistant] = useState(false);
  const [step, setStep] = useState<'intro' | 'configure'>('intro');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'All' | 'Female' | 'Male'>('All');
  
  // Configuration State
  const [config, setConfig] = useState({
    firstMessage: '',
    role: 'Professional Receptionist',
    services: '',
    specialInstructions: '',
    voiceId: 'Clara',
    model: 'gpt-4o-mini'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch('/user/');
        setUser(data);
        if (data.business_profile) {
          setConfig(prev => ({
            ...prev,
            firstMessage: `Hello! Thank you for calling ${data.business_profile.business_name || 'us'}. I'm your AI assistant. How can I help you?`
          }));
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    };

    if (!initialUser) {
      fetchUser();
    } else {
      setConfig(prev => ({
        ...prev,
        firstMessage: `Hello! Thank you for calling ${initialUser.business_profile?.business_name || 'us'}. I'm your AI assistant. How can I help you?`
      }));
      setLoading(false);
    }
  }, [initialUser]);

  const handlePreviewVoice = (voiceId: string, text: string) => {
    if (previewingVoice === voiceId) {
      window.speechSynthesis.cancel();
      setPreviewingVoice(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPreviewingVoice(voiceId);
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const voiceData = AVAILABLE_VOICES.find(v => v.id === voiceId);
    const isFemale = voiceData?.gender === 'Female';
    
    let targetVoice = voices.find(v => 
      (isFemale ? (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Samantha')) : 
                 (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK English Male') || v.name.includes('Alex')))
    );

    if (targetVoice) utterance.voice = targetVoice;
    utterance.rate = 1.0;
    utterance.pitch = isFemale ? 1.2 : 0.8;
    utterance.onend = () => setPreviewingVoice(null);
    utterance.onerror = () => setPreviewingVoice(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleCreate = async () => {
    if (!user?.is_paid) return;
    setCreatingAssistant(true);
    
    const businessName = user?.business_profile?.business_name || "your business";
    const selectedVoice = AVAILABLE_VOICES.find(v => v.id === config.voiceId);
    
    const assistantData = {
      name: `Ekko Assistant - ${businessName}`,
      firstMessage: config.firstMessage,
      model: {
        provider: "openai",
        model: config.model,
        systemPrompt: config.role
      },
      voice: {
        provider: "vapi",
        voiceId: config.voiceId
      }
    };

    try {
      const assistantId = user?.business_profile?.vapi_assistant_id;
      const url = assistantId 
        ? `/api/auth/vapi/assistants/${assistantId}/` 
        : '/api/auth/vapi/assistants/';
      
      const result = await apiFetch(url, {
        method: assistantId ? 'PATCH' : 'POST',
        body: JSON.stringify({ assistant_data: assistantData })
      });
      
      if (result && (result.id || assistantId)) {
        // Handle case where Vapi returns 404 for an existing ID
        if (result.statusCode === 404 || result.error === "Not Found") {
          toast.error("Assistant no longer exists on Vapi. Re-initializing...");
          // Clear the invalid ID from the database
          await apiFetch('/user/', {
            method: 'PATCH',
            body: JSON.stringify({
              business_profile: { vapi_assistant_id: "" }
            })
          });
          // Refresh local user state
          const updatedUser = await apiFetch('/user/');
          setUser(updatedUser);
          setCreatingAssistant(false);
          return;
        }

        // If it was a new creation, update the user profile
        if (!assistantId && result.id) {
          const updatedUser = await apiFetch('/user/', {
            method: 'PATCH',
            body: JSON.stringify({
              business_profile: { vapi_assistant_id: result.id }
            })
          });
          setUser(updatedUser);
        }
        toast.success(assistantId ? 'Receptionist updated successfully!' : 'AI Receptionist deployed successfully!');
        setStep('intro'); // Return to live dashboard view
      } else {
        const errorMsg = result?.message || 'Failed to create assistant on Vapi.';
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
    } catch (err: any) {
      if (err?.status === 404) {
        toast.error("Assistant no longer exists on Vapi. Re-initializing...");
        await apiFetch('/user/', {
          method: 'PATCH',
          body: JSON.stringify({
            business_profile: { vapi_assistant_id: "" }
          })
        });
        const updatedUser = await apiFetch('/user/');
        setUser(updatedUser);
        setCreatingAssistant(false);
        return;
      }
      const errorMsg = err?.data?.message || 'Deployment failed. Please check your Private API Key.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setCreatingAssistant(false);
    }
  };

  const filteredVoices = AVAILABLE_VOICES.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.personality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = filterGender === 'All' || v.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#4355FF]" />
      </div>
    );
  }

  const hasAssistant = !!user?.business_profile?.vapi_assistant_id;

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <Mic size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Receptionist</h1>
          </div>
          <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
            Configure your AI agent with Vapi's high-fidelity native voices.
          </p>
        </div>
        
        {user?.is_paid && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl text-sm font-bold border border-emerald-100 shadow-sm">
            <ShieldCheck size={18} className="text-emerald-500" />
            PRO Features Active
          </div>
        )}
      </div>

      {!user?.is_paid ? (
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-16 text-center shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Subscription Required</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg">
            Upgrade to Ekko Loop PRO to deploy your own AI voice agent.
          </p>
          <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">
            Upgrade Now
          </button>
        </div>
      ) : hasAssistant && step !== 'configure' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-xl shadow-slate-200/50"
        >
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 size={48} />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Receptionist Live</h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Currently using the <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">{AVAILABLE_VOICES.find(v => v.id === config.voiceId)?.name}</span> native model.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                 <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-500 tracking-widest uppercase">
                    Model: GPT-4o-mini
                 </div>
                 <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-600 tracking-widest uppercase">
                    Status: Online
                 </div>
              </div>
            </div>
            <button 
              onClick={() => setStep('configure')}
              className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black transition-all hover:bg-indigo-600 active:scale-95 shadow-xl shadow-slate-200"
            >
              Update Settings
            </button>
          </div>
        </motion.div>
      ) : step === 'intro' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Ready to <span className="text-indigo-600">initialize</span> your agent.
            </h2>
            <p className="text-slate-500 text-xl font-medium leading-relaxed">
              Use Vapi's high-fidelity native voices to provide a world-class experience for your callers. No external integrations required.
            </p>
            <button 
              onClick={() => setStep('configure')}
              className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl flex items-center gap-4 text-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              Start Setup
              <ArrowRight size={24} />
            </button>
          </div>
          <div className="bg-slate-100 rounded-[4rem] aspect-square flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
             <div className="relative scale-110">
                <Mic size={180} className="text-slate-300" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 border-4 border-indigo-200 rounded-full" 
                />
             </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-200 rounded-[3.5rem] p-12 shadow-2xl space-y-12"
        >
          {/* Section 1: Voice Selection */}
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <Volume2 className="text-indigo-600" size={32} />
                  1. Native Voice Library
                </h3>
                <p className="text-slate-500 font-medium text-sm italic">Showing Vapi-optimized voices (Recommended).</p>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                 {['All', 'Female', 'Male'].map((g) => (
                   <button
                      key={g}
                      onClick={() => setFilterGender(g as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterGender === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {g}
                   </button>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVoices.map((voice) => (
                <div 
                  key={voice.id}
                  onClick={() => setConfig({...config, voiceId: voice.id})}
                  className={`relative group cursor-pointer p-6 rounded-[2.5rem] border-2 transition-all ${
                    config.voiceId === voice.id 
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100 scale-[1.02]' 
                    : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-all ${config.voiceId === voice.id ? 'bg-indigo-600 text-white rotate-6' : 'bg-white text-slate-400 group-hover:rotate-6'}`}>
                      <User size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 leading-tight">{voice.name}</h4>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{voice.gender}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">"{voice.personality}"</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVoice(voice.id, voice.previewText);
                      }}
                      className={`w-full py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                        previewingVoice === voice.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                      }`}
                    >
                      {previewingVoice === voice.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                      {previewingVoice === voice.id ? "Playing..." : "Preview"}
                    </button>
                  </div>
                  
                  {config.voiceId === voice.id && (
                    <div className="absolute top-4 right-4 text-indigo-600">
                      <UserCheck size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 2: Core Configuration */}
          <div className="space-y-8">
             <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Settings className="text-indigo-600" />
                2. Business Profile
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Receptionist Role
                  </label>
                  <input 
                    type="text"
                    value={config.role}
                    onChange={(e) => setConfig({...config, role: e.target.value})}
                    placeholder="e.g. Booking Agent"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> Greeting Message
                  </label>
                  <input 
                    type="text"
                    value={config.firstMessage}
                    onChange={(e) => setConfig({...config, firstMessage: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Knowledge Base
                  </label>
                  <textarea 
                    rows={3}
                    value={config.services}
                    onChange={(e) => setConfig({...config, services: e.target.value})}
                    placeholder="Provide your services and hours so the AI can answer accurately..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none transition-all"
                  />
                </div>
             </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setStep('intro')}
              className="px-10 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={creatingAssistant}
              className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-70"
            >
              {creatingAssistant ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} fill="currentColor" />}
              <span className="text-lg">Deploy My AI Receptionist</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
