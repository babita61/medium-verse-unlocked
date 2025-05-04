
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the code from the URL
      const code = searchParams.get('code');
      // Get the next redirect destination, or default to home
      const next = searchParams.get('next') || '/';
      
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            toast.error('Authentication failed. Please try again.');
            navigate('/auth/login');
          } else {
            toast.success('Successfully signed in!');
            navigate(next);
          }
        } catch (err) {
          console.error('Error during auth callback:', err);
          toast.error('Authentication failed. Please try again.');
          navigate('/auth/login');
        }
      } else {
        // No code in URL, redirect to login
        navigate('/auth/login');
      }
    };
    
    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-medium mb-2">Completing authentication...</h2>
        <p className="text-gray-500 dark:text-gray-400">Please wait while we sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
