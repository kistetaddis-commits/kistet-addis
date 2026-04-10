import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import PurchaseFlow from './pages/PurchaseFlow';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import CreateEventPage from './pages/CreateEventPage';
import ScannerPage from './pages/ScannerPage';
import OrganizerLogin from './pages/OrganizerLogin';
import OrganizerDashboard from './pages/OrganizerDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">{t('loading') || 'Verifying access...'}</p>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`[ProtectedRoute] Access denied for role: ${user.role}. Allowed: ${allowedRoles.join(',')}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <>{children}</>;
  
  if (user) {
    console.log('[AuthRedirect] User already logged in, redirecting to dashboard');
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/scanner';
    return <Navigate to={destination} replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isLoading } = useAuth();
  const { t } = useLanguage();
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/organizer/login';
  const isDashboardPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/organizer') || location.pathname === '/scanner';
  
  const showLayout = !isAuthPage && !isDashboardPage;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 font-medium animate-pulse">{t('loading') || 'Loading event platform...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showLayout && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetailsPage />} />
          <Route path="/purchase/:id" element={<PurchaseFlow />} />
          
          <Route 
            path="/login" 
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            } 
          />
          <Route 
            path="/organizer/login" 
            element={
              <AuthRedirect>
                <OrganizerLogin />
              </AuthRedirect>
            } 
          />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/events/create" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateEventPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/organizer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
          
          <Route 
            path="/scanner" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'organizer']}>
                <ScannerPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showLayout && <Footer />}
      <Toaster position="top-center" richColors />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;