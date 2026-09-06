import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  User,
  Bike,
  Sparkles,
  MapPin,
  Building,
  KeyRound,
  RotateCcw,
  AlertCircle,
  Gift,
  Check,
  Tag,
  Info,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { UserRole } from '../types';
import { getTranslation } from '../utils/translations';
import { ALL_COMMUNE_NAMES } from '../data/communes';
import { Logo } from './Logo';
import { sendOtpEmail } from '../services/resendEmailService';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    setKycModalOpen,
    setActiveTab,
    registerUser, 
    verifyEmailOtp, 
    requestEmailLoginOtp,
    resendEmailOtp,
    loginWithEmail, 
    loginWithGoogle, 
    completeGoogleProfile,
    language,
    translate,
    addToast,
    users,
    pendingReferralCode,
    setPendingReferralCode
  } = useApp();

  // 'login' | 'register' | 'otp_verify' | 'google_complete'
  const [authView, setAuthView] = useState<'login' | 'register' | 'otp_verify' | 'google_complete'>('login');
  
  // Registration form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('Cocody');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [referralCodeInput, setReferralCodeInput] = useState(pendingReferralCode || '');
  const [showReferralInputManual, setShowReferralInputManual] = useState(false);

  // OTP Verification state (6 boxes, 5-min expiration, Resend API)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Loading states
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRequestingLoginOtp, setIsRequestingLoginOtp] = useState(false);

  // Login form state
  const [loginRole, setLoginRole] = useState<UserRole>('client');
  const [loginEmail, setLoginEmail] = useState('kouassi.jean@bradci.ci');
  const [loginPassword, setLoginPassword] = useState('••••••••');

  // Sync pending referral code when modal opens or changes
  useEffect(() => {
    if (pendingReferralCode) {
      setReferralCodeInput(pendingReferralCode);
      setAuthView('register');
      setShowReferralInputManual(true);
    }
  }, [pendingReferralCode, authModalOpen]);

  // Countdown timer for OTP expiration (5 minutes = 300s)
  useEffect(() => {
    if (authView !== 'otp_verify' || !otpExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setOtpError(translate(
          "Ce code de sécurité a expiré. Veuillez cliquer sur « Renvoyer le code » pour en recevoir un nouveau.",
          "This security code has expired. Please click « Resend code » to receive a new one."
        ));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authView, otpExpiresAt, translate]);

  if (!authModalOpen) return null;

  // Active Sponsor verification check
  const cleanEnteredRefCode = referralCodeInput.trim().toUpperCase();
  const activeSponsor = cleanEnteredRefCode
    ? users.find(u => u.referralCode?.toUpperCase() === cleanEnteredRefCode)
    : null;

  const handleRoleChangeForLogin = (role: UserRole) => {
    setLoginRole(role);
    setSelectedRole(role);
    if (role === 'driver') {
      setLoginEmail('soro.mamadou@bradci.ci');
      setLoginPassword('123456');
    } else {
      setLoginEmail('kouassi.jean@bradci.ci');
      setLoginPassword('123456');
    }
  };

  // Handle 6-box OTP digits change
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const char = cleaned ? cleaned[cleaned.length - 1] : '';
    
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto advance to next input box
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and arrow navigation
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste event for 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Format seconds remaining as MM:SS
  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Registration Submit -> Generates and sends OTP via Resend API
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !firstName || !lastName) {
      addToast(
        translate('Champs incomplets', 'Incomplete Fields'),
        translate('Veuillez remplir tous les champs obligatoires.', 'Please fill in all required fields.'),
        'warning'
      );
      return;
    }

    setIsSendingEmail(true);
    setOtpError(null);

    const res = registerUser({
      firstName,
      lastName,
      city,
      email,
      phone,
      role: selectedRole,
      password: password || '123456',
      referralCode: cleanEnteredRefCode || undefined
    });

    if (res.success) {
      setOtpTargetEmail(email);
      setGeneratedOtpDisplay(res.otpCode);
      setOtpExpiresAt(res.expiresAt);
      setSecondsRemaining(300);
      setOtpDigits(['', '', '', '', '', '']);

      // Appel sécurisé au service Resend API
      const emailRes = await sendOtpEmail(email, res.otpCode);
      setIsSendingEmail(false);

      setAuthView('otp_verify');

      if (!emailRes.success) {
        addToast(
          translate("Attention d'envoi", "Delivery Notice"),
          emailRes.error || translate("Impossible de transmettre l'email via Resend.", "Could not deliver email via Resend."),
          "warning"
        );
      } else {
        addToast(
          translate('📧 Code de Sécurité Envoyé', '📧 Security Code Sent'),
          emailRes.isSimulated 
            ? translate(`Code [${res.otpCode}] généré pour ${email} (Valide 5 minutes).`, `Code [${res.otpCode}] generated for ${email} (Valid 5 minutes).`)
            : translate(`Code transmis avec succès à ${email} via Resend (Valide 5 minutes).`, `Code delivered to ${email} via Resend (Valid 5 minutes).`),
          'info'
        );
      }

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setIsSendingEmail(false);
    }
  };

  // Handle Resend OTP Code
  const handleResendCode = async () => {
    if (isResending || !otpTargetEmail) return;
    setIsResending(true);
    setOtpError(null);

    const res = await resendEmailOtp(otpTargetEmail);
    setIsResending(false);

    if (res.success && res.otpCode && res.expiresAt) {
      setGeneratedOtpDisplay(res.otpCode);
      setOtpExpiresAt(res.expiresAt);
      setSecondsRemaining(300);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    } else {
      setOtpError(res.error || translate("Impossible de renvoyer le code pour le moment.", "Unable to resend code right now."));
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setOtpError(translate("Veuillez renseigner l'ensemble des 6 chiffres du code.", "Please enter all 6 digits of the code."));
      return;
    }

    if (secondsRemaining <= 0) {
      setOtpError(translate("Ce code de sécurité a expiré (validité 5 min). Veuillez cliquer sur « Renvoyer le code ».", "This code has expired (5 min validity). Please click « Resend code »."));
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    await new Promise(r => setTimeout(r, 450));

    const res = verifyEmailOtp(otpTargetEmail, code);
    setIsVerifyingOtp(false);

    if (res.success) {
      setAuthModalOpen(false);
      setAuthView('login');
      addToast(
        translate('Bienvenue sur BRAD\'CI !', 'Welcome to BRAD\'CI!'),
        translate('Authentification réussie. Votre session est active.', 'Authentication successful. Your session is active.'),
        'success'
      );
    } else {
      setOtpError(res.error || translate("Code de sécurité incorrect. Veuillez vérifier vos e-mails.", "Incorrect security code. Please check your emails."));
    }
  };

  // Handle Login via OTP email (passwordless)
  const handleRequestLoginOtp = async () => {
    if (!loginEmail || !loginEmail.includes('@')) {
      addToast(
        translate("E-mail Requis", "Email Required"),
        translate("Veuillez saisir une adresse e-mail valide pour recevoir le code OTP.", "Please enter a valid email address to receive the OTP code."),
        "warning"
      );
      return;
    }

    setIsRequestingLoginOtp(true);
    setOtpError(null);

    const res = await requestEmailLoginOtp(loginEmail);
    setIsRequestingLoginOtp(false);

    if (res.success && res.otpCode && res.expiresAt) {
      setOtpTargetEmail(loginEmail);
      setGeneratedOtpDisplay(res.otpCode);
      setOtpExpiresAt(res.expiresAt);
      setSecondsRemaining(300);
      setOtpDigits(['', '', '', '', '', '']);
      setAuthView('otp_verify');
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setOtpError(res.error || translate("Compte introuvable ou erreur de transmission.", "Account not found or sending error."));
    }
  };

  // Handle Standard Login (No OTP required for daily logins)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginWithEmail(loginEmail, loginPassword);
    if (res.success) {
      setAuthModalOpen(false);
    }
  };

  // Handle Google Login
  const handleGoogleClick = () => {
    const res = loginWithGoogle(selectedRole);
    if (res.needsProfileCompletion) {
      setEmail(res.user?.email || 'google.user@gmail.com');
      setFirstName(res.user?.firstName || 'Utilisateur');
      setLastName(res.user?.lastName || 'Google');
      setPhone(res.user?.phone || '07 00 00 00 00');
      setAuthView('google_complete');
    } else {
      setAuthModalOpen(false);
    }
  };

  // Handle Google Profile Completion Submit
  const handleCompleteGoogleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeGoogleProfile({
      firstName,
      lastName,
      phone,
      city,
      role: selectedRole,
      referralCode: cleanEnteredRefCode || undefined
    });
    setAuthModalOpen(false);
    setAuthView('login');
    // Free navigation without registration blocking: user can freely browse catalog, auctions, and configure profile
    addToast(
      translate('Bienvenue sur BRAD\'CI !', 'Welcome to BRAD\'CI!'),
      translate('Votre profil a été configuré avec succès. Vous pouvez parcourir le catalogue et les enchères librement.', 'Your profile was set up successfully. You can freely browse the catalog and auctions.'),
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div 
        id="auth-modal-card" 
        className="w-full max-w-md bg-[#0C121E] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Official Logo */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <Logo 
              variant="full" 
              size="md" 
              showSubtitle={true}
              subtitleText="ENCHÈRES • PAIEMENT SÉQUESTRÉ • LIVRAISON GPS" 
            />
          </div>
          {authView === 'register' && cleanEnteredRefCode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2 animate-pulse">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>{translate("Code Parrain Actif appliqué !", "Active Sponsor Code applied!")}</span>
            </div>
          )}
          <h3 className="text-base sm:text-lg font-extrabold text-white font-display">
            {authView === 'register' 
              ? translate("Inscription Sécurisée", "Secure Registration")
              : authView === 'otp_verify'
              ? translate("Validation par Code de Sécurité", "Security Code Validation")
              : authView === 'google_complete'
              ? translate("Finalisation du Profil Google", "Complete Google Profile")
              : translate("Espace de Connexion", "Sign In Portal")}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {authView === 'otp_verify' 
              ? translate("Code de sécurité envoyé par email pour valider votre compte", "Security code sent to your email to validate your account")
              : translate("Enchères express, séquestre 100% garanti et logistique temps réel", "Express auctions, 100% guaranteed escrow & real-time delivery")}
          </p>
        </div>

        {/* ================= VIEW 1: LOGIN ================= */}
        {authView === 'login' && (
          <div className="space-y-4">
            {/* Two Explicit Login Options: Acheteur / Vendeur vs Livreur Express */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block mb-2">
                {translate("Choisir l'Espace de Connexion :", "Select Login Portal:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-login-role-client"
                  type="button"
                  onClick={() => handleRoleChangeForLogin('client')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    loginRole === 'client'
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-md ring-2 ring-blue-500/30'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${loginRole === 'client' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      {translate("Acheteur / Vendeur", "Buyer / Seller")}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {translate("Enchères, Boutiques & Achats", "Auctions, Shops & Buying")}
                  </p>
                </button>

                <button
                  id="btn-login-role-driver"
                  type="button"
                  onClick={() => handleRoleChangeForLogin('driver')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    loginRole === 'driver'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${loginRole === 'driver' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                      <Bike className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      {translate("Livreur Express", "Express Courier")}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {translate("Courses, Bourse de Fret & GPS", "Deliveries, Freight & GPS")}
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Google 1-Click Button */}
            <button
              id="auth-btn-google-login"
              type="button"
              onClick={handleGoogleClick}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow flex items-center justify-center gap-2.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {loginRole === 'driver' 
                  ? translate("Connexion Livreur avec Google", "Courier Sign In with Google") 
                  : translate("Connexion Acheteur/Vendeur avec Google", "Buyer/Seller Sign In with Google")}
              </span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">{translate("Ou avec identifiant & mot de passe", "Or with email & password")}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Standard Email Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  {loginRole === 'driver'
                    ? translate("Email Compte Livreur :", "Courier Account Email:")
                    : translate("Email Compte Acheteur / Vendeur :", "Buyer / Seller Account Email:")}
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nom@exemple.ci"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono-num"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  {translate("Mot de passe :", "Password:")}
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginRole === 'driver'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 shadow-amber-500/20'
                }`}
              >
                <span>
                  {loginRole === 'driver'
                    ? translate("Se Connecter en tant que Livreur", "Sign In as Express Courier")
                    : translate("Se Connecter en tant qu'Acheteur / Vendeur", "Sign In as Buyer / Seller")}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Passwordless OTP Login Option */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 font-bold uppercase">{translate("Ou par e-mail sécurisé", "Or via secure email")}</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <button
                type="button"
                onClick={handleRequestLoginOtp}
                disabled={isRequestingLoginOtp}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isRequestingLoginOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{translate("Envoi du code OTP via Resend...", "Sending OTP code via Resend...")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{translate("Connexion par code OTP (Sans mot de passe)", "Sign In with OTP code (Passwordless)")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
              >
                {translate("Pas encore de compte ? Créer un Compte", "Don't have an account yet? Create an Account")}
              </button>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: REGISTER ================= */}
        {authView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">

            {/* AUTOMATIC REFERRAL BANNER WITH DETAILED INSTRUCTIONS */}
            {cleanEnteredRefCode && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-500/40 shadow-lg space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        {translate("🎁 Parrainage Activé (+1 000 FCFA Offerts)", "🎁 Referral Activated (+1,000 FCFA Bonus)")}
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        {activeSponsor ? (
                          <span>
                            {translate("Parrainé par :", "Sponsored by:")} <strong className="text-white font-semibold">{activeSponsor.name}</strong> <span className="text-amber-400 font-mono font-bold">({activeSponsor.referralCode})</span>
                          </span>
                        ) : (
                          <span>
                            {translate("Code Parrain :", "Sponsor Code:")} <strong className="text-amber-400 font-mono font-bold">{cleanEnteredRefCode}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>{translate("Auto-Appliqué", "Auto-Applied")}</span>
                  </span>
                </div>

                {/* Clear 3-Step Consignes */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-[10.5px]">
                  <div className="font-extrabold text-amber-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>{translate("Consignes de Déblocage du Bonus :", "Bonus Release Instructions:")}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1 text-slate-300 pl-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span><strong>{translate("Inscription immédiate :", "Immediate signup:")}</strong> {translate("Votre compte est automatiquement relié à votre parrain.", "Your account is linked to your sponsor.")}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span><strong>{translate("Certification KYC :", "KYC Verification:")}</strong> {translate("Validez votre CNI/Passeport pour sécuriser 1 000 FCFA dans votre solde d'attente.", "Verify your ID to place 1,000 FCFA in your pending balance.")}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <span><strong>{translate("1ère Livraison Validée :", "1st Delivery Validated:")}</strong> {translate("Dès votre 1er achat ou vente avec confirmation par code secret, vos 1 000 FCFA sont instantanément utilisables pour vos achats !", "Upon your 1st secret code-confirmed purchase or sale, your 1,000 FCFA becomes fully spendable!")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Role Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                {translate("Type de Compte :", "Account Type:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    selectedRole === 'client'
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-bold leading-none">{translate("Acheteur / Vendeur", "Buyer / Seller")}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{translate("Enchères & Boutiques", "Auctions & Stores")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    selectedRole === 'driver'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold leading-none">{translate("Livreur Express", "Express Courier")}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{translate("Courses avec GPS direct", "Direct GPS Deliveries")}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  {translate("Prénom :", "First Name:")}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Bakary"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  {translate("Nom de famille :", "Last Name:")}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Touré"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Ville / Commune */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Ville / Commune (Côte d'Ivoire) :", "City / Commune (Ivory Coast):")}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_COMMUNE_NAMES.map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>

            {/* Email Address (Immutable Unique Account ID) */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Adresse Mail (Identifiant Propriétaire Unique) :", "Email Address (Immutable Account ID):")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@domaine.ci"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
              <span className="text-[9px] text-amber-400/90 block mt-0.5">
                {translate("* Ne pourra plus être modifiée après validation de votre compte.", "* Cannot be changed once account is verified.")}
              </span>
            </div>

            {/* Numéro de Téléphone (+225) */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Numéro de Téléphone (+225) :", "Phone Number (+225):")}
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <span className="bg-slate-800 px-2.5 py-2 text-xs font-bold text-amber-400 flex items-center border-r border-slate-700">
                  🇨🇮 +225
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 48 92 11 34"
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Mot de passe :", "Password:")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translate("Minimum 6 caractères", "Minimum 6 characters")}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* CODE DE PARRAINAGE EXPLICITE & CONSIGNES */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  <span>{translate("Code de Parrainage (Optionnel / Automatique) :", "Referral Code (Optional / Automatic):")}</span>
                </label>
                {cleanEnteredRefCode && (
                  <button
                    type="button"
                    onClick={() => {
                      setReferralCodeInput('');
                      setPendingReferralCode(null);
                      localStorage.removeItem('bradci_pending_sponsor_code');
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                  >
                    {translate("Effacer le code", "Clear code")}
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ex: BRAD-89A2"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-xs font-mono text-white tracking-wider focus:outline-none transition-colors ${
                    cleanEnteredRefCode 
                      ? 'border-amber-500/70 text-amber-300 ring-1 ring-amber-500/30' 
                      : 'border-slate-700 focus:border-amber-500'
                  }`}
                />
                {cleanEnteredRefCode && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+1 000 FCFA</span>
                  </div>
                )}
              </div>

              {/* Real-time status indicator & Quick test chip */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[10.5px]">
                {activeSponsor ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{translate("Parrain validé :", "Verified Sponsor:")} {activeSponsor.name} (+1 000 FCFA)</span>
                  </span>
                ) : cleanEnteredRefCode ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{translate("Code pris en compte (+1 000 FCFA sous réserve de validation)", "Code registered (+1,000 FCFA upon validation)")}</span>
                  </span>
                ) : (
                  <div className="w-full text-slate-400">
                    <span>{translate("Code parrain facultatif (+1 000 FCFA à la première commande livrée)", "Optional referral code (+1,000 FCFA on first delivered order)")}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingEmail}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 disabled:opacity-75 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{translate("Transmission du code e-mail via Resend...", "Sending security code via Resend...")}</span>
                </>
              ) : (
                <>
                  <span>{translate("Créer mon Compte & Recevoir le Code par Email", "Create Account & Receive Verification Code")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {translate("Vous avez déjà un compte ?", "Already have an account?")} <strong className="text-amber-400 underline">{translate("Se Connecter", "Sign In")}</strong>
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW 3: OTP VERIFY (RESEND API & 6 BOXES) ================= */}
        {authView === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Header info banner */}
            <div className="p-3.5 bg-[#06102e] border border-amber-500/40 rounded-2xl text-center space-y-2 shadow-inner">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-amber-300">
                  {translate("Vérification Sécurisée par E-mail", "Secure Email Verification")}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {translate("Un code confidentiel à 6 chiffres a été expédié à l'adresse :", "A confidential 6-digit code has been dispatched to:")}
                <strong className="text-white block font-mono text-xs mt-0.5">{otpTargetEmail}</strong>
              </p>

              {/* 5-minute countdown badge */}
              <div className="pt-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  secondsRemaining > 60 
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                    : secondsRemaining > 0 
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 animate-pulse'
                      : 'bg-red-500/20 border-red-500/40 text-red-300'
                }`}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {secondsRemaining > 0 
                      ? `${translate("Valable encore :", "Valid for:")} ${formatTimeRemaining(secondsRemaining)}`
                      : translate("Code expiré (5 min dépassées)", "Code expired (5 min exceeded)")}
                  </span>
                </div>
              </div>

              {/* Simulated demo hint if in preview/fallback environment */}
              {generatedOtpDisplay && (
                <div className="pt-1">
                  <div className="p-1.5 px-3 bg-slate-950/80 rounded-lg border border-slate-800 inline-flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{translate("Code OTP démo :", "Demo OTP code:")}</span>
                    <strong className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                      {generatedOtpDisplay}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Error banner */}
            {otpError && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block text-red-200 font-bold mb-0.5">{translate("Erreur de validation", "Validation Error")}</strong>
                  <span>{otpError}</span>
                </div>
              </div>
            )}

            {/* 6 Individual Digit Inputs with auto-focus & backspace */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-2 text-center">
                {translate("Saisissez le code de sécurité à 6 chiffres :", "Enter the 6-digit security code:")}
              </label>
              <div className="flex justify-center items-center gap-2 sm:gap-2.5 max-w-sm mx-auto my-1">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    id={`auth-otp-box-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all ${
                      otpError
                        ? 'border-red-500/60 bg-red-950/20 text-red-300'
                        : digit
                          ? 'bg-slate-900 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-700 text-white hover:border-slate-600'
                    } focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20`}
                    autoComplete="one-time-code"
                    required
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-1.5">
                {translate("Passage automatique d'une case à l'autre et support du collage direct", "Automatic cell jump and clipboard paste supported")}
              </p>
            </div>

            {/* Validation Submit button with loading spinner */}
            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 disabled:opacity-75 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{translate("Vérification en cours...", "Verifying code...")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{translate("Valider le Code & Activer la Session", "Validate Code & Activate Session")}</span>
                </>
              )}
            </button>

            {/* Resend & Back actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-60 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{translate("Envoi en cours...", "Sending...")}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{translate("Renvoyer le code", "Resend code")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← {translate("Modifier l'adresse e-mail", "Change email address")}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW 4: GOOGLE COMPLETE PROFILE ================= */}
        {authView === 'google_complete' && (
          <form onSubmit={handleCompleteGoogleProfileSubmit} className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200">
              <p className="font-bold">{translate("Première connexion avec Google :", "First time sign in with Google:")}</p>
              <p className="text-[11px] text-blue-300/90 mt-0.5">
                {translate("Veuillez compléter votre inscription avec vos informations réelles (Nom, Prénom, Téléphone, Ville).", "Please complete your registration with your verified info (First Name, Last Name, Phone, City).")}
              </p>
            </div>

            {/* AUTOMATIC REFERRAL BANNER IN GOOGLE COMPLETION */}
            {cleanEnteredRefCode && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>{translate("Bonus de Parrainage (+1 000 FCFA)", "Referral Bonus (+1,000 FCFA)")}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {translate("Code Parrain Appliqué :", "Sponsor Code Applied:")} <strong className="text-amber-400 font-mono">{cleanEnteredRefCode}</strong> {activeSponsor && `(${activeSponsor.name})`}
                </p>
              </div>
            )}

            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  {translate("Prénom :", "First Name:")}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  {translate("Nom :", "Last Name:")}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Ville / Commune */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Ville / Commune (Côte d'Ivoire) :", "City / Commune (Ivory Coast):")}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_COMMUNE_NAMES.map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>

            {/* Téléphone */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Numéro de Téléphone (+225) :", "Phone Number (+225):")}
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <span className="bg-slate-800 px-2.5 py-2 text-xs font-bold text-amber-400 flex items-center border-r border-slate-700">
                  🇨🇮 +225
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 48 92 11 34"
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Code Parrain optionnel dans Google */}
            <div>
              <label className="text-[11px] text-slate-300 font-medium block mb-1">
                {translate("Code Parrainage (Optionnel) :", "Referral Code (Optional):")}
              </label>
              <input
                type="text"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: BRAD-89A2"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{translate("Finaliser & Accéder à BRAD'CI", "Finalize & Enter BRAD'CI")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{translate("Vérification Anti-Fraude KYC & Cryptage SSL 256 bits", "KYC Anti-Fraud Verification & 256-bit SSL Encryption")}</span>
        </div>
      </div>
    </div>
  );
};

