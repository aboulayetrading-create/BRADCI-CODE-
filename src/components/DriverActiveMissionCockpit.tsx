import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Timer, 
  Clock, 
  RotateCcw, 
  Zap, 
  ShieldCheck,
  Package,
  Bike
} from 'lucide-react';
import { DeliveryJob } from '../types';
import { GoogleMapsEmbed } from './GoogleMapsEmbed';

interface DriverActiveMissionCockpitProps {
  job?: DeliveryJob;
  onBrowseOrders: () => void;
}

export const DriverActiveMissionCockpit: React.FC<DriverActiveMissionCockpitProps> = ({ 
  job,
  onBrowseOrders 
}) => {
  const {
    currentUser,
    freightJobs,
    driverConfirmPickup,
    driverDeclareArrival,
    driverSetInspectionVerdict,
    driverConfirmDeliveryOTP,
    driverConfirmReturnOTP,
    driverStartAbsentTimer,
    driverCancelDueToAbsentBuyer,
    setGpsTrackingJob
  } = useApp();

  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [returnOtpInput, setReturnOtpInput] = useState('');

  // 20-min countdown timer for absent buyer
  const [absentTimerSeconds, setAbsentTimerSeconds] = useState(1200);
  const [isAbsentTimerRunning, setIsAbsentTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAbsentTimerRunning && absentTimerSeconds > 0) {
      interval = setInterval(() => {
        setAbsentTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAbsentTimerRunning, absentTimerSeconds]);

  const formatTimerMinutesSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickup = (jobId: string) => {
    driverConfirmPickup(jobId, pickupCodeInput);
    setPickupCodeInput('');
  };

  const handleDeliveryOTP = (jobId: string) => {
    driverConfirmDeliveryOTP(jobId, deliveryOtpInput);
    setDeliveryOtpInput('');
  };

  // If no active job: display sleek radar standby view
  if (!job) {
    return (
      <div id="driver-radar-standby" className="p-8 sm:p-12 rounded-3xl bg-[#0C121E] border border-slate-800 text-center space-y-6 shadow-xl">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner z-10">
            <Compass className="w-8 h-8 animate-spin" />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-500/30 inline-block">
            ● GPS & Radar d'Attribution En Direct
          </span>
          <h3 className="text-xl font-black text-white">Aucune course active en cours</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Votre géolocalisation GPS est synchronisée. Vous êtes positionné à{' '}
            <strong className="text-emerald-300">{currentUser?.gpsLocation?.commune || 'Abidjan'}</strong> et recevrez les propositions de courses prioritaires en temps réel.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            id="driver-standby-browse-orders-btn"
            onClick={onBrowseOrders}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Consulter la Bourse aux Courses Disponibles</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="driver-active-mission-card" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500/50 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-lg font-extrabold text-white font-display">Mission GPS en Cours</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-500/30">
                {job.status === 'accepted' ? 'Étape 1 : Enlèvement Vendeur (Point A)' : 'Étape 2 : Livraison Acheteur (Point B)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Colis / Commande : <strong className="text-white">{job.productTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono-num font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow">
            Rémunération : + {job.deliveryFee.toLocaleString('fr-FR')} FCFA
          </span>
          <button
            id="driver-satellite-view-btn"
            onClick={() => setGpsTrackingJob(job)}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Vue Satellite GPS</span>
          </button>
        </div>
      </div>

      {/* Real-time Google Maps & Turn-by-Turn Voice Navigation Cockpit */}
      <div className="mb-4">
        <GoogleMapsEmbed
          pickupCommune={job.pickupCommune}
          dropoffCommune={job.dropoffCommune}
          vehicleType={job.requiredVehicle || 'moto'}
          isReturning={job.status === 'returning'}
          courierName={currentUser?.name}
          courierPhone={currentUser?.phone || '+225 07 00 00 00 00'}
          currentProgress={job.status === 'in_transit' ? 60 : job.status === 'arrived' ? 95 : 20}
        />
      </div>

      {/* Interactive Trajectory Route (Point A -> Point B) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Route Timeline */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="w-0.5 h-12 bg-slate-700 my-1 border-dashed" />
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                  B
                </div>
              </div>

              <div className="flex-1 space-y-4 text-xs">
                {/* Point A : Seller Pickup */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 uppercase text-[10px] tracking-wider">
                      Point A : Enlèvement (Vendeur)
                    </span>
                    <a
                      href={`tel:${job.sellerPhone || '+2250748921134'}`}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Appeler Vendeur ({job.sellerName})</span>
                    </a>
                  </div>
                  <p className="font-extrabold text-sm text-white mt-0.5">
                    {job.pickupCommune}
                  </p>
                  <p className="text-slate-400">{job.pickupAddress}</p>
                </div>

                {/* Point B : Buyer Dropoff */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                      Point B : Destination (Acheteur)
                    </span>
                    <a
                      href={`tel:${job.buyerPhone || '+2250766112233'}`}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Appeler Acheteur ({job.buyerName})</span>
                    </a>
                  </div>
                  <p className="font-extrabold text-sm text-white mt-0.5">
                    {job.dropoffCommune}
                  </p>
                  <p className="text-slate-400">{job.dropoffAddress}</p>
                </div>
              </div>
            </div>

            {/* Distance & GPS Launch button */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Distance estimée</span>
                  <strong className="text-white font-mono-num">{job.distanceKm || 7.8} km</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Temps de trajet</span>
                  <strong className="text-amber-400 font-mono-num">~{job.etaMinutes || 20} min</strong>
                </div>
              </div>

              <button
                id="driver-launch-gps-nav-btn"
                type="button"
                onClick={() => {
                  const cockpit = document.getElementById('google-maps-navigation-cockpit');
                  if (cockpit) {
                    cockpit.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigation GPS Intégrée (Cartographie Live In-App)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verification Inputs Box */}
        <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          {job.status === 'accepted' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>Étape 1 : Code Enlèvement</span>
              </div>
              <p className="text-xs text-slate-300">
                Demandez au vendeur son <strong>code à 4 chiffres</strong> lors de la remise du colis à {job.pickupCommune} :
              </p>
              <div className="space-y-2">
                <input
                  id="driver-pickup-code-input"
                  type="text"
                  maxLength={4}
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value)}
                  placeholder="Code vendeur (4 chiffres)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-base font-mono-num font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  id="driver-validate-pickup-btn"
                  onClick={() => handlePickup(job.id)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all"
                >
                  Valider Enlèvement & Démarrer Trajet
                </button>
              </div>
            </div>
          )}

          {job.status === 'in_transit' && (
            <div className="space-y-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Étape 2 : Trajet vers l'Acheteur</span>
              </div>
              <p className="text-xs text-slate-300">
                Vous êtes en route vers <strong>{job.dropoffCommune} ({job.dropoffAddress})</strong>. À votre arrivée sur les lieux, signalez votre présence pour débloquer la vérification :
              </p>
              <button
                id="driver-declare-arrival-btn"
                onClick={() => driverDeclareArrival(job.id)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <MapPin className="w-4 h-4 text-slate-950" />
                <span>📍 JE SUIS ARRIVÉ SUR PLACE CHEZ LE CLIENT</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Le client recevra une notification instantanée pour venir vérifier le colis avec vous.
              </p>
            </div>
          )}

          {job.status === 'arrived' && (
            <div className="space-y-4 p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Étape 3 : Contrôle Physique & Verdict Client</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Sur place
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Présentez l'article à <strong>{job.buyerName}</strong>. Après vérification de l'état du produit, sélectionnez le résultat du constat :
              </p>

              {/* Driver Verdict Options */}
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  id="driver-verdict-good-btn"
                  onClick={() => driverSetInspectionVerdict(job.id, 'client_confirmed_good')}
                  className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                    job.inspectionStatus === 'client_confirmed_good'
                      ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${job.inspectionStatus === 'client_confirmed_good' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs text-emerald-400">1. Client Présent & Produit Conforme</div>
                    <div className="text-[11px] text-slate-400">Le client accepte le produit et va vous communiquer son Code Secret de Remise.</div>
                  </div>
                </button>

                <button
                  id="driver-verdict-bad-btn"
                  onClick={() => driverSetInspectionVerdict(job.id, 'client_confirmed_bad')}
                  className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                    job.inspectionStatus === 'client_confirmed_bad'
                      ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-red-500/40'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${job.inspectionStatus === 'client_confirmed_bad' ? 'text-red-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs text-red-400">2. Client Présent mais Produit Refusé</div>
                    <div className="text-[11px] text-slate-400">Le client refuse l'article pour non-conformité. Le retour vers le vendeur s'active.</div>
                  </div>
                </button>
              </div>

              {/* 3. Section CLIENT ABSENT / ATTENTE 20 MINUTES AVEC BONUS 15% */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                    <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Alternative : Client Injoignable ou Absent ?</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Chrono 20 min
                  </span>
                </div>

                <p className="text-[11px] text-slate-300">
                  Si l'acheteur ne se présente pas à l'adresse de livraison, lancez le <strong>Chrono d'attente officiel (20 minutes)</strong>. Si le délai expire sans réponse, vous pouvez annuler la course : <strong>vous encaissez la course + 15% de bonus sur la valeur de l'article</strong>.
                </p>

                {!isAbsentTimerRunning && absentTimerSeconds === 1200 ? (
                  <button
                    id="driver-start-absent-timer-btn"
                    type="button"
                    onClick={() => {
                      setIsAbsentTimerRunning(true);
                      driverStartAbsentTimer(job.id);
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Démarrer le Chronomètre d'Attente (20:00)</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-amber-500/40">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        <span className="text-xs text-slate-300">Temps d'attente restant :</span>
                      </div>
                      <span className="font-mono text-base font-black text-amber-400">
                        {formatTimerMinutesSeconds(absentTimerSeconds)}
                      </span>
                    </div>

                    {absentTimerSeconds === 0 ? (
                      <div className="space-y-2 animate-in fade-in">
                        <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200">
                          ⏱️ <strong>Délai de 20 minutes expiré !</strong> L'acheteur n'a pas répondu. Vous pouvez maintenant annuler, récupérer le bonus de 15% ({Math.round((job.itemValue || 0) * 0.15).toLocaleString('fr-FR')} FCFA) et retourner le colis.
                        </div>
                        <button
                          id="driver-cancel-absent-buyer-btn"
                          type="button"
                          onClick={() => {
                            driverCancelDueToAbsentBuyer(job.id);
                            setIsAbsentTimerRunning(false);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Annuler (Client Absent) & Encaisser Bonus 15% (+{Math.round((job.itemValue || 0) * 0.15).toLocaleString('fr-FR')} F)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <span className="text-[10px] text-amber-400 font-medium">Alerte envoyée au client</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* If Good: Secret Code entry */}
              {job.inspectionStatus === 'client_confirmed_good' && (
                <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-white block">
                    Entrez le Code Secret à 4 chiffres fourni par l'acheteur :
                  </label>
                  <input
                    id="driver-delivery-otp-input"
                    type="text"
                    maxLength={4}
                    value={deliveryOtpInput}
                    onChange={(e) => setDeliveryOtpInput(e.target.value)}
                    placeholder="Code Secret (4 chiffres)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono-num font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 tracking-widest"
                  />
                  <button
                    id="driver-validate-otp-btn"
                    onClick={() => handleDeliveryOTP(job.id)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider la Livraison & Encaisser {job.deliveryFee.toLocaleString('fr-FR')} FCFA</span>
                  </button>
                </div>
              )}

              {/* If Bad: Warning message */}
              {job.inspectionStatus === 'client_confirmed_bad' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-red-400">Colis refusé pour non-conformité :</p>
                  <p className="text-[11px] text-slate-400">L'acheteur doit cliquer sur "Confirmer le Refus" dans son interface pour vous délivrer le <strong>Code Secret de Retour</strong>. Vos frais de course ({job.deliveryFee.toLocaleString('fr-FR')} FCFA) vous sont intégralement payés.</p>
                </div>
              )}
            </div>
          )}

          {job.status === 'returning' && (
            <div className="space-y-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4" />
                <span>Étape 2 (Retour) : Prise en charge du Colis Refusé</span>
              </div>
              <p className="text-xs text-slate-300">
                L'acheteur a refusé le colis (non-conforme). Vos <strong>frais de course ({job.deliveryFee.toLocaleString('fr-FR')} FCFA)</strong> sont garantis. Entrez le <strong>Code Secret de Retour</strong> transmis par l'acheteur pour valider la prise en charge :
              </p>
              <div className="space-y-2">
                <input
                  id="driver-return-otp-input"
                  type="text"
                  maxLength={4}
                  value={returnOtpInput}
                  onChange={(e) => setReturnOtpInput(e.target.value)}
                  placeholder="Code Secret de Retour (4 chiffres)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono-num font-bold text-red-400 focus:outline-none focus:border-red-500 tracking-widest"
                />
                <button
                  id="driver-validate-return-otp-btn"
                  onClick={() => {
                    const ok = driverConfirmReturnOTP(job.id, returnOtpInput);
                    if (ok) setReturnOtpInput('');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Valider le Code Secret & Démarrer Retour vers Vendeur</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <p className="font-bold text-white">Adresse de restitution boutique :</p>
                <p className="text-slate-400">{job.sellerName} • {job.pickupCommune} ({job.pickupAddress})</p>
              </div>

              {/* Return Trip Radar: Match available orders towards seller commune */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-amber-950/40 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Compass className="w-4 h-4 animate-spin" />
                    <span>Radar Retour : Colis en direction de {job.pickupCommune}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    Optimisation Trajet
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Pendant votre trajet retour vers <strong>{job.pickupCommune}</strong>, maximisez vos gains en transportant un colis sur le même axe :
                </p>
                {freightJobs.filter(j => (j.status === 'available' || j.status === 'pending_driver') && (j.dropoffCommune === job.pickupCommune || j.pickupCommune === job.dropoffCommune)).length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {freightJobs.filter(j => (j.status === 'available' || j.status === 'pending_driver') && (j.dropoffCommune === job.pickupCommune || j.pickupCommune === job.dropoffCommune)).map(rj => (
                      <div key={rj.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-white block">{rj.productTitle}</span>
                          <span className="text-[10px] text-slate-400">{rj.pickupCommune} ➔ {rj.dropoffCommune}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400">+{rj.deliveryFee.toLocaleString('fr-FR')} F</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Recherche de colis disponibles en cours sur l'axe {job.dropoffCommune} ➔ {job.pickupCommune}...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
