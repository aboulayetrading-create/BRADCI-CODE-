import React from 'react';
import { ShieldAlert, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check, RefreshCw, AlertTriangle, Bug } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isRoot?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.group('%c🚨 BRAD\'CI ERROR BOUNDARY CAPTURE', 'background: #dc2626; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    console.error('Error Object:', error);
    console.error('Component Stack Trace:', errorInfo?.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });

    // Broadcast error event for DemoDebugPanel
    try {
      window.dispatchEvent(new CustomEvent('bradci:runtime_error', {
        detail: {
          message: error?.message || 'Unknown runtime error',
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          timestamp: new Date().toISOString()
        }
      }));
    } catch {
      // safe fallback
    }
  }

  private handleRefresh = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      localStorage.removeItem('bradci_active_tab');
      sessionStorage.clear();
    } catch {
      // safe
    }
    window.location.href = '/';
  };

  private handleResetSession = (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // safe
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleCopyStackTrace = (): void => {
    const errorText = `[BRAD'CI Error Log]\nTime: ${new Date().toISOString()}\nMessage: ${this.state.error?.message}\nStack:\n${this.state.error?.stack}\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      const isRoot = this.props.isRoot !== false;
      const title = this.props.fallbackTitle || "Une erreur est survenue sur ce composant.";
      const message = this.props.fallbackMessage || "Le système de protection automatique BRAD'CI a isolé cette anomalie pour empêcher un écran blanc.";

      return (
        <div className={`${isRoot ? 'min-h-[60vh] py-12' : 'p-6 my-4'} flex flex-col items-center justify-center text-slate-100 animate-in fade-in duration-200`}>
          <div className="w-full max-w-xl p-5 sm:p-7 rounded-3xl bg-[#0B111E] border border-amber-500/40 shadow-2xl relative overflow-hidden">
            {/* Ambient accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                    Sécurité Anti-Écran Blanc
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fallback UI Actif
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Error Stack Trace collapsible */}
            <div className="mt-3 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 text-xs">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Bug className="w-3.5 h-3.5 text-amber-400" />
                  <span>Détail technique de l'erreur (Stack Trace)</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <button
                    type="button"
                    onClick={this.handleCopyStackTrace}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                  >
                    {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{this.state.copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                )}
              </div>

              {this.state.showDetails && (
                <div className="mt-2.5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-[11px] break-words">
                    <strong>Message :</strong> {this.state.error?.message || 'Erreur non spécifiée'}
                  </div>
                  {this.state.error?.stack && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800/80 text-slate-400 font-mono text-[10px] max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {this.state.error.stack}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={this.handleResetSession}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                Réinitialiser la Démo
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>Retour à l'accueil</span>
              </button>

              <button
                type="button"
                onClick={this.handleRefresh}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rafraîchir la page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
