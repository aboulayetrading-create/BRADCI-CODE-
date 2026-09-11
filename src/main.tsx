import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Initialize Capacitor PWA elements (for web fallback camera dialogs)
if (typeof window !== 'undefined') {
  defineCustomElements(window);
}

// Register Service Worker for PWA and Mobile Push Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  const registerSW = () => {
    navigator.serviceWorker.register('./sw.js?v=14').then((registration) => {
      // Check for update immediately
      registration.update().catch(() => {});
    }).catch(() => {
      return navigator.serviceWorker.register('/sw.js?v=14');
    }).catch((err) => {
      console.info('Service Worker registration notice:', err);
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

// Global Unhandled Error & Promise Rejection Interceptors (Anti-White-Screen Shield)
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.group('%c🛡️ [BRAD\'CI GLOBAL ERROR INTERCEPTOR]', 'background: #b91c1c; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    console.error('Message:', message);
    console.error('Source:', source, `line: ${lineno}:${colno}`);
    if (error) console.error('Error Object:', error);
    console.groupEnd();

    try {
      window.dispatchEvent(new CustomEvent('bradci:runtime_error', {
        detail: {
          message: String(message || error?.message || 'Global runtime error'),
          stack: error?.stack || `${source}:${lineno}:${colno}`,
          timestamp: new Date().toISOString()
        }
      }));
    } catch {
      // safe
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.group('%c⚡ [BRAD\'CI UNHANDLED PROMISE REJECTION]', 'background: #d97706; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    console.warn('Reason:', event.reason);
    console.groupEnd();

    try {
      window.dispatchEvent(new CustomEvent('bradci:runtime_error', {
        detail: {
          message: event.reason?.message || String(event.reason || 'Unhandled asynchronous rejection'),
          stack: event.reason?.stack,
          timestamp: new Date().toISOString()
        }
      }));
    } catch {
      // safe
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

