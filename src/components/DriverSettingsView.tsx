import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileCheck, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Globe, 
  Volume2, 
  VolumeX, 
  Bike, 
  Car, 
  Truck, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Edit3,
  Bell,
  Play,
  Crown
} from 'lucide-react';
import { playDriverNewOrderRingtone, voiceNavigator } from '../utils/voiceNavigator';

export const DriverSettingsView: React.FC = () => {
  const { 
    currentUser, 
    setKycModalOpen, 
    setPricingModalOpen,
    setTargetPlanForPricing,
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    voiceEnabled, 
    toggleVoice,
    addToast 
  } = useApp();

  const toggleVoiceEnabled = toggleVoice;

  const [orderRingtoneEnabled, setOrderRingtoneEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bradci_driver_ringtone') !== 'false';
  });

  const toggleRingtone = () => {
    const next = !orderRingtoneEnabled;
    setOrderRingtoneEnabled(next);
    localStorage.setItem('bradci_driver_ringtone', String(next));
    if (next) {
      playDriverNewOrderRingtone();
      addToast("Sonnerie activée", "Alerte sonore 30s active pour chaque nouvelle course.", "info");
    } else {
      addToast("Sonnerie coupée", "Mode silencieux actif pour les propositions de courses.", "info");
    }
  };

  const testVoiceAnnouncement = () => {
    playDriverNewOrderRingtone();
    if (voiceNavigator) {
      voiceNavigator.speak(
        language === 'en'
          ? "Attention, new priority delivery order matched near Cocody Duncan. Payout 2,500 Francs CFA."
          : "Attention, nouvelle course prioritaire détectée à Cocody Duncan. Rémunération 2 500 Francs CFA.",
        language
      );
    }
    addToast("Test Audio", "Signal sonore et annonce vocale diffusés.", "info");
  };

  const getVehicleIcon = () => {
    const type = currentUser?.kycVehicleType || currentUser?.vehicleDetails?.type;
    if (type === 'voiture' || type === 'car') return <Car className="w-5 h-5 text-amber-400" />;
    if (type === 'cargo') return <Truck className="w-5 h-5 text-purple-400" />;
    return <Bike className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div id="driver-settings-view-root" className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#06102E] border border-slate-800 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center border border-[#F97316]/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-display">Paramètres de l'Espace Livreur</h3>
            <p className="text-xs text-slate-400">KYC, affichage visuel, langue et alertes sonores</p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Agréé BRAD'CI</span>
        </span>
      </div>

      {/* SECTION PASS LIVREUR VIP (OPTION BIENTÔT) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0C121E] via-[#06102E] to-[#0C121E] border border-amber-500/40 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-white font-display">Pass Livreur VIP BRAD'CI</h4>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm border border-amber-300">
                  ⏳ BIENTÔT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Offre exclusive réservée aux livreurs et transporteurs partenaires</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTargetPlanForPricing('vip_pass');
              setPricingModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Consulter le Pass Livreur</span>
            <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded font-mono">6 000 F/m</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Statut actuel :</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[11px] border border-emerald-500/30">
                ✓ Courses 100% Gratuites & Illimitées Actives (0 FCFA)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Toutes les courses sont sans frais d'abonnement. Lors du lancement officiel du Pass Livreur VIP, 5 courses gratuites d'essai vous seront offertes avant l'activation.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>0% Commission Livreur</span>
          </div>
        </div>
      </div>

      {/* 1. Vérification KYC (CNI / Permis / Véhicule) */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Vérification KYC & Matériel de Livraison</h4>
              <p className="text-xs text-slate-400">Conformité légale et agrément de sécurité</p>
            </div>
          </div>

          <button
            onClick={() => setKycModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#F97316]/15 hover:bg-[#F97316]/25 border border-[#F97316]/40 text-[#F97316] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Mettre à jour</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* CNI */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Pièce d'Identité</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-white font-bold">{currentUser?.kycDocumentNumber || 'CI0084729188'}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                Validé
              </span>
            </div>
            <p className="text-[10px] text-slate-400">CNI / Passeport biométrique certifié</p>
          </div>

          {/* Permis de conduire */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">2. Permis de Conduire</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-white font-bold">Catégorie A/B</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                Conforme
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Permis ivoirien en cours de validité</p>
          </div>

          {/* Véhicule */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">3. Véhicule Déclaré</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-300 font-bold uppercase">
                {currentUser?.kycVehiclePlate || currentUser?.vehicleDetails?.plate || '4523 JJ 01'}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                Contrôlé
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {currentUser?.kycVehicleModel || currentUser?.vehicleDetails?.model || 'Yamaha Crypton 110'} ({currentUser?.kycVehicleColor || 'Noir & Rouge'})
            </p>
          </div>
        </div>
      </div>

      {/* 2. Thème (Mode Sombre / Mode Clair) */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Thème & Confort Visuel</h4>
            <p className="text-xs text-slate-400">Basculez entre le mode nuit (#06102e) et le mode haute luminosité</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Dark Mode */}
          <button
            id="btn-settings-theme-dark"
            onClick={() => {
              setTheme('dark');
              addToast("Mode Sombre", "Thème bleu nuit BRAD'CI activé.", "info");
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#06102E] text-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-300">
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-black text-white">Mode Sombre</span>
              <span className="text-[10px] text-slate-400">Bleu Nuit #06102E</span>
            </div>
          </button>

          {/* Light Mode */}
          <button
            id="btn-settings-theme-light"
            onClick={() => {
              setTheme('light');
              addToast("Mode Clair", "Thème clair pour plein soleil activé.", "info");
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-950 border-emerald-500 shadow-lg ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-[#F97316]">
              <Sun className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-black text-white">Mode Clair</span>
              <span className="text-[10px] text-slate-400">Plein Soleil</span>
            </div>
          </button>

          {/* Auto Mode */}
          <button
            id="btn-settings-theme-auto"
            onClick={() => {
              setTheme('auto');
              addToast("Mode Auto", "Adapté au rythme jour/nuit de votre appareil.", "info");
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
              theme === 'auto'
                ? 'bg-slate-800 text-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-black text-white">Automatique</span>
              <span className="text-[10px] text-slate-400">Jour / Nuit Auto</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Langue (Français / English) */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Langue de l'Application</h4>
            <p className="text-xs text-slate-400">Choisissez la langue d'affichage des missions et des adresses</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-settings-lang-fr"
            onClick={() => {
              setLanguage('fr');
              addToast("Langue", "Français sélectionné.", "info");
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
              language === 'fr'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className="text-2xl">🇨🇮</span>
            <div className="text-left">
              <span className="block font-black text-white">Français (Côte d'Ivoire)</span>
              <span className="text-[10px] text-slate-400">Communes & Argot local</span>
            </div>
          </button>

          <button
            id="btn-settings-lang-en"
            onClick={() => {
              setLanguage('en');
              addToast("Language", "English selected.", "info");
            }}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
              language === 'en'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="text-left">
              <span className="block font-black text-white">English</span>
              <span className="text-[10px] text-slate-400">International Courier</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Voix Off & Alertes Sonores */}
      <div className="p-6 rounded-3xl bg-[#0C121E] border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center border border-[#F97316]/30">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Voix Off & Alertes Sonores de Course</h4>
              <p className="text-xs text-slate-400">Notifications vocales et sonores dès qu'une offre apparaît</p>
            </div>
          </div>

          <button
            onClick={testVoiceAnnouncement}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Tester l'annonce audio</span>
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {/* Switch 1: Voix Off guidage */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Guidage Vocal & Synthèse Vocale</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${voiceEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {voiceEnabled ? 'ACTIF' : 'MUET'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Annonce à voix haute l'adresse de ramassage, la commune et le montant de la course
              </p>
            </div>

            <button
              id="toggle-voice-enabled-switch"
              onClick={toggleVoiceEnabled}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 cursor-pointer shrink-0 ${
                voiceEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Switch 2: Sonnerie d'urgence 30s */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Alerte Sonore Nouvelle Course (30s)</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${orderRingtoneEnabled ? 'bg-[#F97316]/20 text-[#F97316]' : 'bg-slate-800 text-slate-400'}`}>
                  {orderRingtoneEnabled ? 'ACTIF' : 'DÉSACTIVÉ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Jingle sonore distinctif répété pour attirer l'attention lors de la fenêtre d'acceptation de 30 secondes
              </p>
            </div>

            <button
              id="toggle-ringtone-enabled-switch"
              onClick={toggleRingtone}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 cursor-pointer shrink-0 ${
                orderRingtoneEnabled ? 'bg-[#F97316]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  orderRingtoneEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
