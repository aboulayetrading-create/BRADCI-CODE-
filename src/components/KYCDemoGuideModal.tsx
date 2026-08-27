import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  X, 
  Camera, 
  UserCheck, 
  Sparkles, 
  FileText, 
  Bike, 
  Car, 
  AlertTriangle 
} from 'lucide-react';

interface KYCDemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDemoPhoto?: (type: 'cni' | 'selfie' | 'driverLicense' | 'driverLicenseSelfie' | 'vehicleReg', url: string, docNumber?: string) => void;
}

export const KYCDemoGuideModal: React.FC<KYCDemoGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyDemoPhoto
}) => {
  const { translate, addToast } = useApp();

  if (!isOpen) return null;

  const demoItems = [
    {
      type: 'cni' as const,
      title: translate("1. Pièce d'Identité Officielle (CNI / Passeport)", "1. Official ID Card (ID / Passport)"),
      description: translate("Photo à plat, lumière naturelle, 4 coins visibles, texte et numéro 100% nets.", "Flat photo, natural light, 4 corners visible, text and number 100% sharp."),
      demoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      docNum: 'CI003928174',
      validRules: [
        translate("✓ Pas de reflets du flash sur le plastique", "✓ No flash reflections on plastic"),
        translate("✓ Bords du document entièrement visibles", "✓ All 4 edges completely visible"),
        translate("✓ Nom, prénom et numéro ONECI lisibles", "✓ Name and ONECI number readable")
      ],
      invalidRules: [
        translate("✗ Photo floue ou prise dans l'obscurité", "✗ Blurry photo or taken in the dark"),
        translate("✗ Doigt cachant le numéro ou la photo", "✗ Finger covering the number or photo")
      ]
    },
    {
      type: 'selfie' as const,
      title: translate("2. Selfie en Direct avec votre Pièce d'Identité", "2. Live Selfie holding your ID"),
      description: translate("Visage de face bien éclairé, pièce tenue à côté de la joue sans masquer le visage.", "Well-lit face looking forward, holding card next to cheek without covering face."),
      demoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      validRules: [
        translate("✓ Visage net sans lunettes de soleil ni chapeau", "✓ Clear face without sunglasses or hat"),
        translate("✓ La photo sur la CNI correspond au visage du selfie", "✓ ID photo matches the selfie face"),
        translate("✓ Carte tenue de face à hauteur du menton/joue", "✓ Card held upright at chin/cheek height")
      ],
      invalidRules: [
        translate("✗ Pièce masquant la bouche ou les yeux", "✗ Card covering mouth or eyes"),
        translate("✗ Éclairage à contre-jour ou filtre beauté déformant", "✗ Backlight or heavy beauty distortion filter")
      ]
    },
    {
      type: 'driverLicense' as const,
      title: translate("3. Permis de Conduire (Livreurs)", "3. Driving License (Couriers)"),
      description: translate("Recto du permis de conduire ivoirien (Catégorie A moto ou B voiture).", "Front of Ivorian driver's license (Category A bike or B car)."),
      demoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600&auto=format&fit=crop&q=80',
      docNum: 'PC-ABJ-99201',
      validRules: [
        translate("✓ Date de validité en cours", "✓ Active validity date"),
        translate("✓ Catégorie A / B bien lisible", "✓ Category A / B readable")
      ],
      invalidRules: [
        translate("✗ Permis expiré ou illisible", "✗ Expired or illegible license")
      ]
    },
    {
      type: 'vehicleReg' as const,
      title: translate("4. Carte Grise du Véhicule / Moto", "4. Vehicle / Motorcycle Registration"),
      description: translate("Attestation d'immatriculation du moyen de transport utilisé pour le fret.", "Registration certificate for the transport vehicle used for courier jobs."),
      demoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      docNum: 'CG-8829-CI01',
      validRules: [
        translate("✓ Numéro d'immatriculation conforme", "✓ Compliant license plate number"),
        translate("✓ Document officiel complet", "✓ Complete official certificate")
      ],
      invalidRules: [
        translate("✗ Document tronqué ou incomplet", "✗ Truncated or incomplete document")
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0B111E] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto space-y-6">
        
        {/* Top Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
            {translate("Guide & Démo de Prise en Photo KYC", "KYC Photo Capture Guide & Demo")}
          </h3>
          <p className="text-xs text-slate-400">
            {translate("Découvrez comment cadrer vos pièces et votre selfie pour une validation en moins de 15 minutes", "Learn how to frame your ID and selfie for validation in under 15 minutes")}
          </p>
        </div>

        {/* Demo Cards List */}
        <div className="space-y-4">
          {demoItems.map((item, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row gap-4 items-start shadow-md"
            >
              {/* Demo Image with Badge */}
              <div className="relative w-full sm:w-44 h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                <img 
                  src={item.demoUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                  EXEMPLE CONFORME ✓
                </span>
              </div>

              {/* Rules & Explanation */}
              <div className="flex-1 min-w-0 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.title}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                <div className="space-y-1 text-[11px] pt-1">
                  {item.validRules.map((r, i) => (
                    <p key={i} className="text-emerald-400 font-medium">{r}</p>
                  ))}
                  {item.invalidRules.map((r, i) => (
                    <p key={i} className="text-red-400/80">{r}</p>
                  ))}
                </div>

                {onApplyDemoPhoto && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyDemoPhoto(item.type, item.demoUrl, item.docNum);
                        onClose();
                        addToast(
                          translate("Photo Démo Appliquée", "Demo Photo Applied"),
                          translate("L'image d'exemple a été insérée avec succès dans votre formulaire.", "Sample image successfully inserted into your form."),
                          'success'
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{translate("⚡ Insérer cette photo d'exemple", "⚡ Insert this demo photo")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            {translate("Compris, Fermer le Guide", "Got it, Close Guide")}
          </button>
        </div>
      </div>
    </div>
  );
};
