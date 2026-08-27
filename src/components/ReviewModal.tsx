import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  X, 
  Send, 
  Sparkles, 
  Store, 
  Bike, 
  CheckCircle2, 
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Headphones
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { DeliveryJob } from '../types';
import { cleanReviewComment, containsProfanity } from '../utils/profanityFilter';

interface ReviewModalProps {
  job: DeliveryJob | null;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ job, onClose }) => {
  const { 
    currentUser, 
    submitReview, 
    language,
    addToast 
  } = useApp();

  const [sellerRating, setSellerRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [sellerTags, setSellerTags] = useState<string[]>(['Article conforme', 'Vendeur réactif']);
  const [driverTags, setDriverTags] = useState<string[]>(['Livraison rapide', 'Livreur très courtois']);
  const [sellerComment, setSellerComment] = useState<string>('');
  const [driverComment, setDriverComment] = useState<string>('');

  if (!job || !currentUser) return null;

  const sellerHasProfanity = containsProfanity(sellerComment);
  const driverHasProfanity = containsProfanity(driverComment);

  const sellerAvailableTags = [
    'Article conforme',
    'Vendeur très réactif',
    'Emballage soigné',
    'Conformité parfaite',
    'Article non conforme',
    'Transaction fluide'
  ];

  const driverAvailableTags = [
    'Livraison rapide',
    'Livreur très courtois',
    'Tracking GPS précis',
    'Déballage respecté',
    'Retard de livraison',
    'Professionnel'
  ];

  const toggleSellerTag = (tag: string) => {
    setSellerTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleDriverTag = (tag: string) => {
    setDriverTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSeller = cleanReviewComment(sellerComment);
    const cleanDriver = cleanReviewComment(driverComment);

    if (cleanSeller.wasProfane || cleanDriver.wasProfane) {
      addToast(
        'Modération Automatique Appliquée',
        'Les termes inappropriés ont été automatiquement modérés (***) conformément à la charte de respect Brad\'CI.',
        'info'
      );
    }

    submitReview({
      jobId: job.id,
      productId: job.productId,
      productTitle: job.productTitle,
      sellerRating,
      sellerComment: cleanSeller.cleanedText,
      sellerQuickTags: sellerTags,
      driverRating,
      driverComment: cleanDriver.cleanedText,
      driverQuickTags: driverTags
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="review-modal-card"
        className="w-full max-w-lg bg-[#0C121E] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
            {getTranslation(language, 'reviewModalTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Colis : <strong className="text-white">{job.productTitle}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Note Vendeur */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  Évaluer le Vendeur ({job.sellerName})
                </span>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSellerRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        star <= sellerRating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tags Vendeur */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {sellerAvailableTags.map((tag) => {
                const selected = sellerTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSellerTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      selected 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <input
              type="text"
              value={sellerComment}
              onChange={(e) => setSellerComment(e.target.value)}
              placeholder="Commentaire sur le vendeur / boutique (filtrage anti-injures actif)..."
              className="w-full mt-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {sellerHasProfanity && (
              <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Les propos injurieux seront automatiquement masqués par étoiles (***).</span>
              </p>
            )}
          </div>

          {/* Section 2: Note Livreur */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Évaluer le Livreur ({job.assignedDriverName || 'Coursier'})
                </span>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDriverRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        star <= driverRating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tags Livreur */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {driverAvailableTags.map((tag) => {
                const selected = driverTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDriverTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      selected 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <input
              type="text"
              value={driverComment}
              onChange={(e) => setDriverComment(e.target.value)}
              placeholder="Commentaire sur la livraison (courtoisie, ponctualité)..."
              className="w-full mt-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {driverHasProfanity && (
              <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Les propos injurieux seront automatiquement masqués par étoiles (***).</span>
              </p>
            )}
          </div>

          {/* Automatic Report Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-[11px] text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Un rapport automatique d'évaluation avec note sur 5 étoiles sera transmis dans le centre de notifications et affiché sur le profil public.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{getTranslation(language, 'submitReviewBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

