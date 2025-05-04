
import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Handle auth callbacks (like from OAuth providers)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/';
      
      if (code) {
        try {
          // Let Supabase handle the code exchange
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            toast.error('Authentication failed. Please try again.');
          } else {
            // Redirect to home or the next page
            navigate(next);
          }
        } catch (err) {
          console.error('Error during auth callback:', err);
        }
      }
    };
    
    handleAuthCallback();
  }, [searchParams, navigate]);

  // Redirect to homepage if user is already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is already logged in, they shouldn't see the auth page
  if (user) {
    return null; // This will be caught by the useEffect above and redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/callback" element={
              <div className="text-center p-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Completing sign in...</p>
              </div>
            } />
            <Route path="*" element={<Navigate to="/auth/login" />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
