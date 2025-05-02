
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Hero = () => {
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ["hero-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = profile?.role === 'admin';

  return (
    <section className="py-16 md:py-24">
      <div className="container-blog">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6 animate-fade-in">
            Welcome to <span className="text-primary">Verse</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-fade-in">
            A community of writers, thinkers, and storytellers sharing ideas that matter.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            {user ? (
              isAdmin ? (
                <Link to="/admin/posts/create">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Writing
                  </Button>
                </Link>
              ) : (
                <Link to="/profile">
                  <Button size="lg" className="w-full sm:w-auto">
                    My Profile
                  </Button>
                </Link>
              )
            ) : (
              <Link to="/auth/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Writing
                </Button>
              </Link>
            )}
            <Link to="/categories">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Categories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
