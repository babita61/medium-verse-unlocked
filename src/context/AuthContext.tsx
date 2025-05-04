
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAdmin: boolean;
  isVerified: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine user roles based on profile
  const isAdmin = profile?.role === 'admin';
  const isVerified = isAdmin || profile?.role === 'verified';

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile with setTimeout to avoid Supabase deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_IN') {
          toast.success("Successfully signed in!");
        } else if (event === 'SIGNED_OUT') {
          toast.success("Successfully signed out!");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Please check your email for verification");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || `Failed to sign in with ${provider}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAdmin,
        isVerified,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
