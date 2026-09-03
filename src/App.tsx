/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
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
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  MapPin, 
  CreditCard,
  Heart,
  Crown
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setPricingModalOpen, 
    setNewProductModalOpen,
    isMaintenanceMode,
    isAdminAuthenticated,
    profileAvatarModalOpen,
    setProfileAvatarModalOpen,
    updateUserAvatar,
    translate
  } = useApp();

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

      {/* Rôles & Parcours Acteurs (Acheteur, Vendeur Déstockage, Livreur Express) */}
      <ErrorBoundary fallbackTitle="Parcours Acteurs">
        <RoleSwitcherBar />
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

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 pt-8 pb-24 md:pb-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-400">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-1">
              <BradCiLogo size="md" />
              <p className="text-slate-400 leading-relaxed text-xs">
                {translate(
                  "La 1ère plateforme sécurisée de déstockage express et enchères en direct en Côte d'Ivoire.",
                  "The #1 secure express liquidation and live auctions platform in Ivory Coast."
                )}
              </p>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>{translate("Paiement Direct à la Livraison Garanti", "Direct Pay on Delivery Guaranteed")}</span>
              </div>
            </div>

            {/* Rules shortcuts */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">{translate("Règles & Tarifs", "Rules & Passes")}</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <button onClick={() => { setActiveTab('about_security'); }} className="hover:text-amber-400 transition-colors">
                    {translate("Publications Illimitées & Gratuites (0 F)", "Free & Unlimited Listings (0 F)")}
                  </button>
                </li>
                <li>
                  <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors">
                    {translate("Pass Vendeur Certifié (5 000 F / 5%)", "Certified Seller Pass (5,000 F / 5%)")}
                  </button>
                </li>
                <li>
                  <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors">
                    {translate("Pass Vendeur Or VIP (10 000 F / 2.5%)", "VIP Gold Seller Pass (10,000 F / 2.5%)")}
                  </button>
                </li>
                <li>
                  <button onClick={() => setPricingModalOpen(true)} className="hover:text-amber-400 transition-colors">
                    {translate("Pass Livreur (6 000 F / 0% comm.)", "Courier Pass (6,000 F / 0% comm.)")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Communes Abidjan */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">{translate("Zones Couvertes (Abidjan)", "Covered Zones (Abidjan)")}</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Cocody (Angré, Riviera, Danga)</li>
                <li>• Plateau & Treichville</li>
                <li>• Marcory Zone 4 & Biétry</li>
                <li>• Yopougon & Koumassi</li>
              </ul>
            </div>

            {/* Escrow & Payment Partner logos */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">{translate("Paiements Sécurisés", "Secure Payments")}</h4>
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
              <p className="text-[10px] text-slate-500 mt-2">
                {translate(
                  "Paiement direct à la livraison via API sans blocage de fonds.",
                  "Direct pay on delivery via API with zero upfront fund locking."
                )}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} BRAD'CI Technologies S.A. {translate("Tous droits réservés. Abidjan, Côte d'Ivoire.", "All rights reserved. Abidjan, Ivory Coast.")}</p>
            <p className="flex items-center gap-1">
              <span>{translate("Fait pour la sécurité des enchères en Côte d'Ivoire", "Built for secure auctions in Ivory Coast")}</span>
            </p>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Bottom Navigation Bar (Smartphones & Small Tablets) */}
      <ErrorBoundary fallbackTitle="Barre Mobile">
        <MobileBottomNav />
      </ErrorBoundary>

      {/* 6. Modals & Overlays Protected by Error Boundaries */}
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
