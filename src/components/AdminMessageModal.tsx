import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  X, 
  MessageSquare, 
  Smartphone, 
  MessageCircle, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';

export const AdminMessageModal: React.FC = () => {
  const { 
    adminMessageModalRecipient, 
    setAdminMessageModalRecipient,
    adminSendMessageToUser
  } = useApp();

  const [channel, setChannel] = useState<'in_app' | 'sms' | 'whatsapp'>('in_app');
  const [subject, setSubject] = useState('Message Officiel - Direction Sécurité Brad\'CI');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!adminMessageModalRecipient) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);

    if (channel === 'whatsapp') {
      const cleanPhone = adminMessageModalRecipient.phone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(`[BRAD'CI SÉCURITÉ] Bonjour ${adminMessageModalRecipient.name},\n\n${message}`);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
      adminSendMessageToUser(adminMessageModalRecipient.id, 'whatsapp', message, subject);
      setIsSending(false);
      setAdminMessageModalRecipient(null);
      return;
    }

    setTimeout(() => {
      adminSendMessageToUser(adminMessageModalRecipient.id, channel, message, subject);
      setIsSending(false);
      setAdminMessageModalRecipient(null);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0C121E] border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={() => setAdminMessageModalRecipient(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Contacter un Membre</h3>
            <p className="text-xs text-slate-400">
              Canal de communication direct avec {adminMessageModalRecipient.name}
            </p>
          </div>
        </div>

        {/* Recipient summary card */}
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={adminMessageModalRecipient.avatar} 
              className="w-10 h-10 rounded-xl object-cover border border-slate-700" 
              alt={adminMessageModalRecipient.name}
            />
            <div>
              <p className="font-bold text-sm text-white">{adminMessageModalRecipient.name}</p>
              <p className="text-xs text-slate-400 font-mono">{adminMessageModalRecipient.phone} • {adminMessageModalRecipient.email}</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {adminMessageModalRecipient.role}
          </span>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Channel selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Canal de Transmission :</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('in_app')}
                className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  channel === 'in_app'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>In-App Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  channel === 'sms'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Passerelle SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Direct</span>
              </button>
            </div>
          </div>

          {/* Subject (for in-app / email) */}
          {channel === 'in_app' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Objet du Message :</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Ex: Information relative à votre compte vendeur"
                required
              />
            </div>
          )}

          {/* Message content */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Contenu du Message :</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Rédigez ici votre message officiel ou rappel des consignes de sécurité..."
              required
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 w-full font-bold">Modèles Rapides :</span>
            <button
              type="button"
              onClick={() => setMessage('Bonjour, merci de mettre à jour votre document KYC (CNI / Passeport) pour débloquer vos retraits.')}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 transition-colors"
            >
              📋 Rappel KYC
            </button>
            <button
              type="button"
              onClick={() => setMessage('Votre virement de retrait a été traité et envoyé sur votre compte Wave / Mobile Money.')}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 transition-colors"
            >
              💰 Virement effectué
            </button>
            <button
              type="button"
              onClick={() => setMessage('Avertissement : Merci de respecter les consignes de remise en main propre avec code OTP.')}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 transition-colors"
            >
              ⚠️ Consigne Sécurité OTP
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdminMessageModalRecipient(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{channel === 'whatsapp' ? 'Ouvrir WhatsApp' : 'Envoyer Maintenant'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
