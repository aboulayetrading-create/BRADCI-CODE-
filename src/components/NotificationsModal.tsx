import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Bike, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Smartphone,
  Navigation,
  RotateCcw,
  Clock,
  Check,
  Eye,
  EyeOff,
  Send,
  Key,
  Flame,
  BellRing
} from 'lucide-react';
import { AppNotification } from '../types';
import { sendTestNotification } from '../utils/universalNotifications';

export const NotificationsModal: React.FC = () => {
  const { 
    notifications, 
    notificationsModalOpen, 
    setNotificationsModalOpen, 
    markNotificationAsRead, 
    toggleNotificationReadStatus,
    deleteNotification,
    markAllNotificationsAsRead, 
    clearAllNotifications,
    currentUser,
    browserNotificationsEnabled,
    pushToken,
    requestBrowserNotificationPermission,
    setGpsTrackingJob,
    freightJobs,
    setActiveTab,
    translate,
    setProductDetailModal,
    products
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'delivery' | 'inspection'>('all');
  const [copiedToken, setCopiedToken] = useState(false);

  if (!notificationsModalOpen) return null;

  // Filter notifications for current user/role
  const userNotifications = notifications.filter(n => {
    if (!currentUser) return true;
    return n.recipientRole === 'all' || n.recipientRole === currentUser.role || n.recipientUserId === currentUser.id || n.recipientUserId === currentUser.name;
  });

  const filteredNotifications = userNotifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'delivery') return n.type === 'delivery';
    if (activeFilter === 'inspection') return n.type === 'inspection' || n.type === 'return';
    return true;
  });

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.type === 'outbid' && notif.productId) {
      const targetProd = products.find(p => p.id === notif.productId);
      if (targetProd) {
        setProductDetailModal(targetProd);
        setNotificationsModalOpen(false);
        return;
      }
    }
    if (notif.jobId) {
      const job = freightJobs.find(j => j.id === notif.jobId);
      if (job) {
        setGpsTrackingJob(job);
        setNotificationsModalOpen(false);
        return;
      }
    }
    if (currentUser?.role === 'client') {
      setActiveTab('dashboard_client');
    } else if (currentUser?.role === 'driver') {
      setActiveTab('dashboard_driver');
    }
    setNotificationsModalOpen(false);
  };

  const handleCopyToken = () => {
    if (!pushToken) return;
    navigator.clipboard?.writeText?.(pushToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const getNotifIcon = (notif: AppNotification) => {
    switch (notif.type) {
      case 'outbid':
        return <Flame className="w-4 h-4 text-red-400 animate-pulse" />;
      case 'delivery':
        return <Bike className="w-4 h-4 text-emerald-400" />;
      case 'inspection':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'return':
        return <RotateCcw className="w-4 h-4 text-red-400" />;
      case 'payment':
      case 'withdrawal':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0C121E] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080C14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono-num font-extrabold text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">{translate("Centre de Notifications", "Notification Center")}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{translate("Alertes courses en direct, séquestre & arrivées livreurs", "Live order alerts, escrow updates & courier arrivals")}</p>
            </div>
          </div>
          <button
            onClick={() => setNotificationsModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Banner & Push Token Status */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border-b border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                {browserNotificationsEnabled 
                  ? translate('Notifications push actives pour les enchères et livraisons.', 'Push notifications active for bids and deliveries.')
                  : translate('Activez les notifications pour être alerté dès l\'arrivée du livreur.', 'Enable push notifications to be alerted when courier arrives.')}
              </span>
            </div>
            {!browserNotificationsEnabled ? (
              <button
                onClick={requestBrowserNotificationPermission}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-all shadow-sm cursor-pointer"
              >
                {translate('Autoriser', 'Enable')}
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>✓ {translate('NOTIFICATIONS ACTIVES', 'NOTIFICATIONS ACTIVE')}</span>
                </span>
                <button
                  id="btn-test-push-notification"
                  type="button"
                  onClick={async () => {
                    await sendTestNotification("BRAD'CI Alerte Test", "Validation réussie du canal push local et de l'affichage notification.");
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Valider le canal push local"
                >
                  <BellRing className="w-3 h-3" />
                  <span>Tester Push</span>
                </button>
              </div>
            )}
          </div>

          {/* Device Push Token status indicator */}
          {pushToken && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <Key className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Jeton Push local :</span>
                <code className="font-mono text-emerald-300 truncate max-w-[200px]">{pushToken}</code>
              </div>
              <button
                onClick={handleCopyToken}
                className="text-[10px] text-amber-400 hover:underline shrink-0"
              >
                {copiedToken ? 'Copié !' : 'Copier'}
              </button>
            </div>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-200/80 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {translate('Toutes', 'All')} ({userNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'unread'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-200/80 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {translate('Non lues', 'Unread')} ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('delivery')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'delivery'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-200/80 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {translate('Livraisons', 'Deliveries')}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                title={translate("Tout marquer comme lu", "Mark all as read")}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tout lire</span>
              </button>
            )}
            {userNotifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title={translate("Vider l'historique", "Clear history")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{translate("Aucune notification pour le moment", "No notifications yet")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-600">{translate("Vous recevrez des alertes lors de vos achats, ventes et livraisons.", "You will receive alerts during your purchases, sales, and deliveries.")}</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  !notif.isRead 
                    ? 'bg-amber-50/90 dark:bg-slate-900/95 border-amber-300 dark:border-amber-500/50 shadow-md' 
                    : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    notif.urgency === 'critical'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      : notif.urgency === 'high'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {getNotifIcon(notif)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </h4>

                      {/* Statut explicite "Lue" ou "Non lue" */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.isRead ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[9.5px] font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Non lue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 text-[9.5px] font-medium flex items-center gap-1">
                            <Check className="w-3 h-3 text-slate-400" />
                            Lue
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    {/* Footer de l'élément : Date & Heure précises + Actions rapides */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{notif.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bouton pour basculer le statut Lu / Non Lu */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotificationReadStatus(notif.id);
                          }}
                          className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-0.5 transition-colors p-1 text-slate-500"
                          title={notif.isRead ? "Marquer comme non lue" : "Marquer comme lue"}
                        >
                          {notif.isRead ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span className="hidden sm:inline">{notif.isRead ? "Non lue" : "Lue"}</span>
                        </button>

                        {/* Bouton pour supprimer */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="hover:text-red-400 transition-colors p-1"
                          title="Supprimer la notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {notif.jobId && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Navigation className="w-3 h-3" />
                          <span>{translate("Suivi GPS Course Direct", "Live Courier GPS Tracking")}</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{translate("Fret sécurisé Abidjan avec contrôle physique obligatoire & séquestre", "Secure Abidjan escrow delivery with mandatory physical inspection")}</span>
        </div>
      </div>
    </div>
  );
};
