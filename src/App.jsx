import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Components
import AdminGuard from './components/AdminGuard';
import GuestGuard from './components/GuestGuard';
import ScrollToTop from './components/ScrollToTop';

// Public pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Sustainability from './pages/Sustainability';
import CompleteProfile from './pages/CompleteProfile';
import EditProfile from './pages/EditProfile';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminSettings from './pages/AdminSettings';

import useAuthStore from './store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const RootAuthHandler = ({ children }) => {
  const { user, fetchProfile, socialLogin, token } = useAuthStore();
  const [syncing, setSyncing] = React.useState(false);
  const navigate = useNavigate();
  const syncProcessedRef = React.useRef(false);

  // Sync function to be used in multiple places
  const syncWithBackend = React.useCallback(async (session) => {
    if (!session?.user || syncProcessedRef.current) return;
    
    // Prevent double sync if already have backend user
    if (useAuthStore.getState().user) return;

    syncProcessedRef.current = true;
    setSyncing(true);
    console.log('Starting backend sync for social login...');
    
    try {
      const { user: sUser } = session;
      const role = await socialLogin({
        email: sUser.email,
        full_name: sUser.user_metadata?.full_name || sUser.email.split('@')[0],
        social_id: sUser.id,
        avatar_url: sUser.user_metadata?.avatar_url || sUser.user_metadata?.picture
      });
      
      console.log('Backend sync successful, role:', role);
      const currentUser = useAuthStore.getState().user;
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
      
      if (currentUser && (!currentUser.phone || !currentUser.address)) {
        navigate('/complete-profile');
      } else if (isAuthPage) {
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Backend social login sync failed:', err);
      syncProcessedRef.current = false; // Allow retry on failure
    } finally {
      setSyncing(false);
    }
  }, [socialLogin, navigate]);

  // 1. Initial fetch for existing backend token
  React.useEffect(() => {
    if (token && !user && !syncing) {
      fetchProfile();
    }
  }, [token, user, syncing, fetchProfile]);

  // 2. Handle Supabase Social Login Sync (Listener + Initial Check)
  React.useEffect(() => {
    let subscription = null;

    const initAuth = async () => {
      try {
        const { supabase } = await import('./supabase');
        
        // Check current session immediately
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Found existing Supabase session on mount');
          syncWithBackend(session);
        }

        // Listen for future changes
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Supabase Auth Event:', event, !!session);
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            syncWithBackend(session);
          } else if (event === 'SIGNED_OUT') {
            syncProcessedRef.current = false;
          }
        });
        subscription = authData.subscription;
      } catch (err) {
        console.error('Supabase setup failed:', err);
      }
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [syncWithBackend]);

  if (syncing && !token) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing your account...</p>
      </div>
    </div>
  );

  return children;
};

function App() {
  return (
    <Router>
      <RootAuthHandler>
        <ScrollToTop />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
        {/* ── Admin routes (AdminLayout, no Navbar/Cart) ── */}
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/products" element={<AdminProducts />} />
                  <Route path="/categories" element={<AdminCategories />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="/settings" element={<AdminSettings />} />
                </Routes>
              </AdminLayout>
            </AdminGuard>
          }
        />

        {/* ── Public / Buyer routes (MainLayout + Navbar/Footer) ── */}
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetails />} />
                <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
                <Route path="/signup" element={<GuestGuard><Signup /></GuestGuard>} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/sustainability" element={<Sustainability />} />
              </Routes>
            </MainLayout>
          }
        />
        </Routes>
      </RootAuthHandler>
    </Router>
  );
}

export default App;
