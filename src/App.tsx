/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { VisitorFeed } from './components/VisitorFeed';
import { ClientDashboard } from './components/ClientDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminBackOffice } from './components/AdminBackOffice';
import { SecurityGuideView } from './components/SecurityGuideView';
import { BradCiLogo } from './components/BradCiLogo';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { FiveBiddersModal } from './components/FiveBiddersModal';
import { BuyerDepositModal } from './components/BuyerDepositModal';
import { NewProductModal } from './components/NewProductModal';
import { GpsTrackingModal } from './components/GpsTrackingModal';
import { GpsModal } from './components/GpsModal';
import { ShopStorefrontModal } from './components/ShopStorefrontModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AIChatSupport } from './components/AIChatSupport';
import { ToastContainer } from './components/ToastContainer';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { AdminMessageModal } from './components/AdminMessageModal';
import { AdminMemberDetailModal } from './components/AdminMemberDetailModal';
import { AdminExportModal } from './components/AdminExportModal';
import { LiveDeliveryStatusBar } from './components/LiveDeliveryStatusBar';
import { NotificationsModal } from './components/NotificationsModal';
import { KYCModal } from './components/KYCModal';
import { MandatoryKYCGate } from './components/MandatoryKYCGate';
import { KycRequiredModal } from './components/KycRequiredModal';
import { ProfileAvatarModal } from './components/ProfileAvatarModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OrderDispatchModal } from './components/OrderDispatchModal';
import { ReviewModal } from './components/ReviewModal';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { B2BLiquidationHub } from './components/B2BLiquidationHub';
import { CartModal } from './components/CartModal';
import { CartInvoiceModal } from './components/CartInvoiceModal';
import { NativePermissionModal } from './components/NativePermissionModal';
import { SplashScreen } from './components/SplashScreen';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  MapPin, 
  CreditCard,
  Heart,
  Crown,
  Smartphone,
  Globe,
  Download,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  FileText,
  Share2,
  Check
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    currentUser,
    activeTab, 
    setActiveTab, 
    setPricingModalOpen, 
    setNewProductModalOpen,
    setTermsModalOpen,
    addToast,
    isMaintenanceMode,
    isAdminAuthenticated,
    profileAvatarModalOpen,
    setProfileAvatarModalOpen,
    updateUserAvatar,
    translate
  } = useApp();

  // Footer Display Mode: 'app' (mode application compact & mobile) vs 'web' (option portail site web complet)
  const [footerDisplayMode, setFooterDisplayMode] = React.useState<'app' | 'web'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'web';
    }
    return 'app';
  });

  const [installPromptEvent, setInstallPromptEvent] = React.useState<any>(null);
  const [showPwaGuide, setShowPwaGuide] = React.useState<boolean>(false);
  const [isCopiedShare, setIsCopiedShare] = React.useState<boolean>(false);
  const [showSplashManual, setShowSplashManual] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleOpenSplash = () => setShowSplashManual(true);
    window.addEventListener('bradci_open_splash', handleOpenSplash);
    return () => window.removeEventListener('bradci_open_splash', handleOpenSplash);
  }, []);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choice: any) => {
        if (choice && choice.outcome === 'accepted') {
          addToast(
            translate('Application Installée !', 'App Installed!'),
            translate("BRAD'CI a été installée avec succès sur votre appareil.", "BRAD'CI was installed successfully."),
            'success'
          );
        }
        setInstallPromptEvent(null);
      });
    } else {
      setShowPwaGuide((prev) => !prev);
    }
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: "BRAD'CI - Enchères & Déstockage Côte d'Ivoire",
        text: "Découvrez BRAD'CI, la plateforme sécurisée de déstockage et enchères en direct à Abidjan avec paiement direct à la livraison !",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedShare(true);
      addToast(
        translate('Lien copié !', 'Link copied!'),
        translate("Le lien de l'application a été copié dans le presse-papier.", "App link copied to clipboard."),
        'info'
      );
      setTimeout(() => setIsCopiedShare(false), 2500);
    }
  };

  // If driver account is active, ensure driver stays strictly in the delivery dashboard
  useEffect(() => {
    if (currentUser?.role === 'driver' && (activeTab === 'explore' || activeTab === 'feed' || activeTab === 'b2b_liquidation' || activeTab === 'dashboard_client')) {
      setActiveTab('dashboard_driver');
    }
  }, [currentUser?.role, activeTab, setActiveTab]);

  // If site is in maintenance mode and user is not an authenticated admin, show maintenance screen
  if (isMaintenanceMode && !isAdminAuthenticated && activeTab !== 'dashboard_admin') {
    return (
      <ErrorBoundary fallbackTitle="Écran de maintenance">
        <MaintenanceScreen />
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      {/* 1. Main Navigation Bar */}
      <ErrorBoundary fallbackTitle="Navigation">
        <Navbar />
      </ErrorBoundary>

      {/* 2. Persistent Live Delivery Status Bar (Buyer, Seller & Driver Dispatch Notification) */}
      <ErrorBoundary fallbackTitle="Statut de livraison">
        <LiveDeliveryStatusBar />
      </ErrorBoundary>

      {/* 3. Main Views Container with Isolated Error Boundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <ErrorBoundary fallbackTitle="Vue Principale">
          {(activeTab === 'explore' || activeTab === 'feed') && <VisitorFeed />}
          {(activeTab === 'b2b_liquidation' || activeTab === 'destockage_b2b' || activeTab === 'b2b') && <B2BLiquidationHub />}
          {(activeTab === 'dashboard_client' || activeTab === 'client_dashboard') && <ClientDashboard />}
          {(activeTab === 'dashboard_driver' || activeTab === 'driver_dashboard') && <DriverDashboard />}
          {(activeTab === 'dashboard_admin' || activeTab === 'admin_backoffice') && <AdminBackOffice />}
          {(activeTab === 'about' || activeTab === 'about_security' || activeTab === 'tarifs') && <SecurityGuideView />}
        </ErrorBoundary>
      </main>

      {/* 4. Footer - Mode Application & Option Site Web */}
      <footer id="app-main-footer" className="mt-auto border-t border-slate-800/80 bg-[#070B14] pt-6 sm:pt-8 pb-28 md:pb-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Control Bar: Mode Application vs Option Site Web */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">
                {translate("Affichage :", "View:")}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-semibold text-[11px]">
                  {footerDisplayMode === 'app'
                    ? translate("Mode Application Mobile (PWA)", "Mobile App View (PWA)")
                    : translate("Option Site Web Complet (Portail)", "Full Website Option (Portal)")}
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
              <button
                id="btn-footer-mode-app"
                type="button"
                onClick={() => setFooterDisplayMode('app')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  footerDisplayMode === 'app'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={translate("Activer le rendu application mobile épuré", "Switch to clean mobile app view")}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{translate("Mode Application", "App Mode")}</span>
              </button>

              <button
                id="btn-footer-mode-web"
                type="button"
                onClick={() => setFooterDisplayMode('web')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  footerDisplayMode === 'web'
                    ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={translate("Activer l'option site web complet avec tous les liens", "Switch to full website portal option")}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{translate("Option Site Web", "Website Option")}</span>
              </button>
            </div>
          </div>

          {/* RENDU 1: MODE APPLICATION (Comme sur une vraie application mobile) */}
          {footerDisplayMode === 'app' ? (
            <div className="space-y-6">
              {/* App Identity Banner */}
              <div className="bg-[#0B111D] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <BradCiLogo size="md" onClick={() => setShowSplashManual(true)} className="cursor-pointer" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-sm">BRAD'CI</span>
                      <button 
                        type="button"
                        onClick={() => setShowSplashManual(true)}
                        title="Ouvrir le Splash Screen Officiel"
                        className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                      >
                        APP MOBILE v2.5
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {translate(
                        "Enchères en direct & Déstockage express • 100% Paiement à la livraison",
                        "Live auctions & Express clearance • 100% Pay on delivery"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    id="btn-install-app-footer"
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{translate("Installer l'Application", "Install App")}</span>
                  </button>

                  <button
                    id="btn-share-app-footer"
                    type="button"
                    onClick={handleShareApp}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title={translate("Partager l'application", "Share app")}
                  >
                    {isCopiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isCopiedShare ? translate("Copié !", "Copied!") : translate("Partager", "Share")}</span>
                  </button>
                </div>
              </div>

              {/* Install PWA Guide (collapsible if manual instructions needed) */}
              {showPwaGuide && (
                <div className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-2xl text-xs text-slate-300 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      {translate("Comment ajouter l'application sur votre smartphone :", "How to add app to your smartphone:")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPwaGuide(false)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                    >
                      {translate("Fermer", "Close")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <p className="font-bold text-white mb-1">🍎 iPhone / iPad (Safari) :</p>
                      <p className="text-slate-400">1. Touchez l'icône de partage <strong>« Partager ⎋ »</strong> en bas.</p>
                      <p className="text-slate-400">2. Faites défiler et sélectionnez <strong>« Sur l'écran d'accueil ➕ »</strong>.</p>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <p className="font-bold text-white mb-1">🤖 Android (Chrome / Samsung) :</p>
                      <p className="text-slate-400">1. Touchez les 3 points verticaux <strong>« ⋮ »</strong> en haut à droite.</p>
                      <p className="text-slate-400">2. Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* App Quick Hub Grid: 4 Modern App Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Quick Support & WhatsApp */}
                <div className="bg-[#0B111D] border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>{translate("Assistance & Support Direct", "Help & Direct Support")}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {translate("Assistance 7j/7 pour vos commandes, litiges et questions de livraison.", "7/7 support for orders, disputes and delivery inquiries.")}
                  </p>
                  <a
                    href="https://wa.me/2250700000000?text=Bonjour%20BRAD'CI,%20j'ai%20besoin%20d'aide%20sur%20l'application"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors pt-1"
                  >
                    <span>💬 WhatsApp (+225)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 2. Security & Zero advance payment */}
                <div className="bg-[#0B111D] border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{translate("Paiement Direct à la Livraison", "Direct Pay on Delivery")}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {translate("Inspection physique du colis avant tout règlement. Aucun risque d'arnaque.", "Physical check before any payment. Zero scam risk.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('about_security')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors pt-1 cursor-pointer"
                  >
                    <span>🛡️ {translate("Guide Sécurité", "Security Guide")}</span>
                  </button>
                </div>

                {/* 3. Tarifs & Pass Vendeur */}
                <div className="bg-[#0B111D] border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{translate("Tarifs & Abonnements", "Passes & Pricing")}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {translate("Publications gratuites à 0 F. Pass Vendeur Certifié & Livreur à 0% com.", "Free listings at 0 F. Certified Seller & Courier Pass.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPricingModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors pt-1 cursor-pointer"
                  >
                    <span>⚡ {translate("Voir la Grille Tarifaire", "View Pricing Grid")}</span>
                  </button>
                </div>

                {/* 4. Conditions Générales & Légalité */}
                <div className="bg-[#0B111D] border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>{translate("Règles & Conditions (CGU)", "Rules & Terms (CGU)")}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {translate("Charte vendeur, clauses anti-contrefaçon et gestion des retours 1h max.", "Seller charter, anti-counterfeit clauses and return policy.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors pt-1 cursor-pointer"
                  >
                    <span>📑 {translate("Lire les CGU & Règles", "Read Terms & Rules")}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Switch Banner: "Option Site Web" Call to Action */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {translate(
                      "Vous souhaitez explorer l'arborescence complète du portail ?",
                      "Want to explore the full portal web sitemap?"
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFooterDisplayMode('web')}
                  className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all"
                >
                  <span>{translate("Afficher l'Option Site Web Complet", "Show Full Website Option")}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* RENDU 2: OPTION SITE WEB (Version Portail Web Complète) */
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs text-slate-400">
                {/* Brand column */}
                <div className="space-y-3">
                  <BradCiLogo size="md" />
                  <p className="text-slate-400 leading-relaxed text-xs">
                    {translate(
                      "La 1ère plateforme sécurisée de déstockage express, enchères en direct et boutiques professionnelles en Côte d'Ivoire.",
                      "The #1 secure express clearance, live auctions and official stores platform in Ivory Coast."
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{translate("Paiement Direct à la Livraison Garanti", "Direct Pay on Delivery Guaranteed")}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setFooterDisplayMode('app')}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{translate("Revenir au Rendu Application 📱", "Back to App View 📱")}</span>
                    </button>
                  </div>
                </div>

                {/* Rules shortcuts */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    {translate("Règles & Tarifs", "Rules & Passes")}
                  </h4>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>
                      <button onClick={() => { setActiveTab('about_security'); }} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                        {translate("Publications Illimitées & Gratuites (0 F)", "Free & Unlimited Listings (0 F)")}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                        {translate("Pass Vendeur Certifié (5 000 F / 5%)", "Certified Seller Pass (5,000 F / 5%)")}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                        {translate("Pass Vendeur Or VIP (10 000 F / 2.5%)", "VIP Gold Seller Pass (10,000 F / 2.5%)")}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                        {translate("Pass Livreur (6 000 F / 0% comm.)", "Courier Pass (6,000 F / 0% comm.)")}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setTermsModalOpen(true)} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                        {translate("Conditions Générales d'Utilisation (CGU)", "Terms of Service (CGU)")}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Communes Abidjan */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    {translate("Zones Couvertes (Grand Abidjan)", "Covered Zones (Greater Abidjan)")}
                  </h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• Cocody (Angré, Riviera, Danga, 2 Plateaux)</li>
                    <li>• Plateau, Treichville & Adjamé</li>
                    <li>• Marcory Zone 4, Biétry & Koumassi</li>
                    <li>• Yopougon, Port-Bouët & Abobo</li>
                    <li className="text-cyan-400 font-semibold">• Grand-Bassam, Bingerville & Assinie</li>
                  </ul>
                </div>

                {/* Escrow & Payment Partner logos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    {translate("Paiements Sécurisés", "Secure Payments")}
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold font-mono text-[11px]">
                      Wave Money
                    </span>
                    <span className="px-2.5 py-1 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-lg font-bold font-mono text-[11px]">
                      Orange Money
                    </span>
                    <span className="px-2.5 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-lg font-bold font-mono text-[11px]">
                      MTN MoMo
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {translate(
                      "Paiement direct à la livraison via Mobile Money après remise du colis. Aucun blocage préalable.",
                      "Direct payment on delivery via Mobile Money after parcel handover. No upfront hold."
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Copyright & Guarantee Bar */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()} BRAD'CI Technologies S.A. {translate("Tous droits réservés. Abidjan, Côte d'Ivoire.", "All rights reserved. Abidjan, Ivory Coast.")}
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{translate("Plateforme Certifiée Côte d'Ivoire", "Certified Platform Ivory Coast")}</span>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="hover:text-slate-300 underline cursor-pointer"
              >
                {translate("Légalité & Mentions", "Legal & Privacy")}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Bottom Navigation Bar (Smartphones & Small Tablets) */}
      <ErrorBoundary fallbackTitle="Barre Mobile">
        <MobileBottomNav />
      </ErrorBoundary>

      {/* 6. Modals & Overlays Protected by Error Boundaries */}
      <SplashScreen 
        forceOpen={showSplashManual} 
        onDismiss={() => setShowSplashManual(false)} 
      />
      <ErrorBoundary fallbackTitle="Module d'authentification">
        <AuthModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Vérification KYC Requise">
        <KycRequiredModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Modal KYC">
        <KYCModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Avatar Profile">
        <ProfileAvatarModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Dispatch Livreur">
        <OrderDispatchModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Avis & Évaluations">
        <ReviewModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Tarification">
        <PricingModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Détails Produit">
        <ProductDetailModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Enchères">
        <FiveBiddersModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Dépôt">
        <BuyerDepositModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Nouveau Produit">
        <NewProductModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Tracking GPS">
        <GpsTrackingModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Position GPS">
        <GpsModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Centre de Notifications">
        <NotificationsModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Boutique Officielle">
        <ShopStorefrontModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Administration">
        <AdminMessageModal />
        <AdminMemberDetailModal />
        <AdminExportModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Conditions d'utilisation">
        <TermsAndConditionsModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Support Client IA">
        <AIChatSupport />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Reçu Officiel & Facture PDF">
        <ReceiptModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Panier & Commande Multi-Articles">
        <CartModal />
        <CartInvoiceModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Autorisations Système & Permissions Android">
        <NativePermissionModal />
      </ErrorBoundary>


      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application BRAD'CI">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
