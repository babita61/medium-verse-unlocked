
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6 animate-fade-in">
                Welcome to <span className="text-primary">Babita Writes</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-fade-in">
                A space where daily life experiences transform into stories worth sharing.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-start gap-4 animate-fade-in">
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
                      Start Reading
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
          
          <div className="md:col-span-5">
            <Card className="bg-gray-50 border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary">
                    <img 
                      src="https://t3.ftcdn.net/jpg/05/54/52/34/360_F_554523496_K9wIKslSbPU1d8WCQwPsTWo5cGDNRKMp.jpg" 
                      alt="Babita" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Hi, I'm Babita!</h3>
                    <p className="mt-2 text-gray-700">
                      I'm passionate about sharing my daily life experiences through blogging. 
                      From travel adventures and cooking experiments to personal growth and mindfulness, 
                      I document the beautiful moments and lessons that shape my journey.
                    </p>
                    <p className="mt-2 text-gray-700">
                      Join me as I navigate life's ups and downs with honesty, humor, and a touch of creativity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
