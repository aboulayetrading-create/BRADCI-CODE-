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
  RotateCcw
} from 'lucide-react';
import { AppNotification } from '../types';

export const NotificationsModal: React.FC = () => {
  const { 
    notifications, 
    notificationsModalOpen, 
    setNotificationsModalOpen, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearAllNotifications,
    currentUser,
    browserNotificationsEnabled,
    requestBrowserNotificationPermission,
    setGpsTrackingJob,
    freightJobs,
    setActiveTab,
    translate
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'delivery' | 'inspection'>('all');

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

  const getNotifIcon = (notif: AppNotification) => {
    switch (notif.type) {
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
      <div className="w-full max-w-lg bg-[#0C121E] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#080C14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono-num font-extrabold text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{translate("Centre de Notifications", "Notification Center")}</h2>
              <p className="text-xs text-slate-400">{translate("Alertes courses en direct, séquestre & arrivées livreurs", "Live order alerts, escrow updates & courier arrivals")}</p>
            </div>
          </div>
          <button
            onClick={() => setNotificationsModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Banner */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              {browserNotificationsEnabled 
                ? translate('Notifications push autorisées sur ce téléphone/navigateur.', 'Push notifications active on this device/browser.')
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
            <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
              ✓ {translate('ACTIF', 'ACTIVE')}
            </span>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {translate('Toutes', 'All')} ({userNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'unread'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {translate('Non lues', 'Unread')} ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('delivery')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'delivery'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {translate('Livraisons', 'Deliveries')}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                title={translate("Tout marquer comme lu", "Mark all as read")}
              >
                <CheckCheck className="w-4 h-4" />
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
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-medium">{translate("Aucune notification pour le moment", "No notifications yet")}</p>
              <p className="text-xs text-slate-600">{translate("Vous recevrez des alertes lors de vos achats, ventes et livraisons.", "You will receive alerts during your purchases, sales, and deliveries.")}</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  !notif.isRead 
                    ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    notif.urgency === 'critical'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : notif.urgency === 'high'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {getNotifIcon(notif)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>

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

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
                  )}
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
