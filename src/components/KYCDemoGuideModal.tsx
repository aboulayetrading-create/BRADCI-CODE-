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
import { 
  CNIVectorDrawing, 
  SelfieVectorDrawing, 
  SelfieWithCardVectorDrawing, 
  DriverLicenseVectorDrawing, 
  VehicleRegVectorDrawing,
  KYC_DRAWING_DATA_URIS
} from './KYCIllustrations';

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
      demoUrl: KYC_DRAWING_DATA_URIS.cni,
      docNum: 'CI003928174',
      renderDrawing: () => <CNIVectorDrawing className="w-full h-36" />,
      validRules: [
        translate("✓ Pas de reflets du flash sur le plastique", "✓ No flash reflections on plastic"),
        translate("✓ 4 coins du document entièrement cadrés", "✓ All 4 corners completely framed"),
        translate("✓ Nom, prénom et numéro ONECI lisibles", "✓ Name and ONECI number readable")
      ],
      invalidRules: [
        translate("✗ Photo floue ou prise dans l'obscurité", "✗ Blurry photo or taken in the dark"),
        translate("✗ Doigt cachant le numéro ou la photo", "✗ Finger covering the number or photo")
      ]
    },
    {
      type: 'selfie' as const,
      title: translate("2. Selfie Portrait de Face", "2. Front-facing Face Selfie"),
      description: translate("Visage de face bien centré dans l'ovale, éclairage naturel sans lunettes ni casquette.", "Well-lit face centered in the oval, natural light without sunglasses or hat."),
      demoUrl: KYC_DRAWING_DATA_URIS.selfie,
      docNum: 'SELFIE-OK',
      renderDrawing: () => <SelfieVectorDrawing className="w-full h-36" />,
      validRules: [
        translate("✓ Visage net sans lunettes de soleil ni couvre-chef", "✓ Clear face without sunglasses or hat"),
        translate("✓ Regard droit vers la caméra, bouche fermée", "✓ Looking straight at camera, neutral expression"),
        translate("✓ Éclairage frontal uniforme, yeux bien dégagés", "✓ Uniform frontal lighting, open eyes")
      ],
      invalidRules: [
        translate("✗ Contre-jour ou visage sombre dans l'ombre", "✗ Backlight or face darkened by shadows"),
        translate("✗ Filtre beauté déformant ou photo floue", "✗ Beauty filters or blurry photo")
      ]
    },
    {
      type: 'driverLicenseSelfie' as const,
      title: translate("3. Selfie avec Pièce d'Identité en Main", "3. Live Selfie holding your ID Card"),
      description: translate("Tenez votre pièce à côté du menton/joue. Votre visage et la pièce doivent être simultanément nets.", "Hold ID card next to chin/cheek. Face and card must both be sharp."),
      demoUrl: KYC_DRAWING_DATA_URIS.driverLicenseSelfie,
      docNum: 'POSE-ID-OK',
      renderDrawing: () => <SelfieWithCardVectorDrawing className="w-full h-36" />,
      validRules: [
        translate("✓ Visage et carte d'identité 100% visibles", "✓ Face and ID card 100% visible"),
        translate("✓ Doigts tenant la pièce par le bord sans cacher le texte", "✓ Fingers holding edge without hiding details"),
        translate("✓ La photo de la carte correspond au visage", "✓ Card photo matches the live face")
      ],
      invalidRules: [
        translate("✗ Pièce masquant la bouche ou les yeux", "✗ Card covering mouth or eyes"),
        translate("✗ Texte de la pièce masqué par les doigts", "✗ Card text covered by fingers")
      ]
    },
    {
      type: 'driverLicense' as const,
      title: translate("4. Permis de Conduire (Livreurs)", "4. Driving License (Couriers)"),
      description: translate("Recto du permis de conduire ivoirien (Catégorie A moto, B auto ou C cargo).", "Front of Ivorian driver's license (Category A bike, B car or C cargo)."),
      demoUrl: KYC_DRAWING_DATA_URIS.driverLicense,
      docNum: 'PC-ABJ-99201',
      renderDrawing: () => <DriverLicenseVectorDrawing className="w-full h-36" />,
      validRules: [
        translate("✓ Date de validité en cours", "✓ Active validity date"),
        translate("✓ Catégorie A (Moto), B (Voiture) ou C (Cargo) bien lisible", "✓ Category A (Bike), B (Car) or C (Cargo) readable"),
        translate("✓ Signature et photo du titulaire visibles", "✓ Signature and photo visible")
      ],
      invalidRules: [
        translate("✗ Permis expiré ou illisible", "✗ Expired or illegible license"),
        translate("✗ Document tronqué ou plié", "✗ Cropped or folded document")
      ]
    },
    {
      type: 'vehicleReg' as const,
      title: translate("5. Carte Grise & Immatriculation Engin (Livreurs)", "5. Vehicle Registration & Plate (Couriers)"),
      description: translate("Attestation d'immatriculation officielle et déclaration de l'engin de livraison.", "Official registration certificate & delivery asset declaration."),
      demoUrl: KYC_DRAWING_DATA_URIS.vehicleReg,
      docNum: 'CG-8829-CI01',
      renderDrawing: () => <VehicleRegVectorDrawing className="w-full h-36" />,
      validRules: [
        translate("✓ Matricule conforme aux standards CI (Ex: 4523 JJ 01)", "✓ License plate compliant with CI standards"),
        translate("✓ Marque et modèle déclarés conformes à l'engin", "✓ Brand and model matching delivery vehicle"),
        translate("✓ Numéro de châssis lisible", "✓ Readable chassis number")
      ],
      invalidRules: [
        translate("✗ Carte grise expirée ou falsifiée", "✗ Expired or forged certificate")
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
            {translate("Dessins & Guide Exemplaire KYC Conforme", "Exemplary Drawing & KYC Compliance Guide")}
          </h3>
          <p className="text-xs text-slate-400">
            {translate("Schémas vectoriels professionnels pour réussir la prise de photo du premier coup comme sur les meilleures applications bancaires & VTC", "Professional vector diagrams to get photo framing right on the first try")}
          </p>
        </div>

        {/* Demo Cards List */}
        <div className="space-y-4">
          {demoItems.map((item, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row gap-4 items-start shadow-md"
            >
              {/* Professional Vector Drawing Demonstration */}
              <div className="relative w-full sm:w-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                {item.renderDrawing()}
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
                          translate("Modèle Démo Inséré", "Demo Graphic Inserted"),
                          translate("Le schéma d'exemple conforme a été appliqué avec succès.", "The compliant example graphic was applied successfully."),
                          'success'
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{translate("⚡ Utiliser ce modèle d'exemple", "⚡ Use this demo graphic")}</span>
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
