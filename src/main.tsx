import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './locales/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppConfigProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <SubscriptionProvider>
                <SidebarProvider>
                  <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--toast-bg)',
                      color: 'var(--toast-text)',
                      border: '1px solid var(--toast-border)',
                    },
                  }}
                />
                </SidebarProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </AppConfigProvider>
    </ErrorBoundary>
  </StrictMode>
);
