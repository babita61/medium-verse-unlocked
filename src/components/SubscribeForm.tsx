
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { BookMarked } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}

interface SubscribeFormProps {
  categories: CategoryOption[];
}

const SubscribeForm = ({ categories }: SubscribeFormProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill email when user is logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Helper function to toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const subscriptionEmail = user?.email || email;
      
      if (!subscriptionEmail) {
        toast.error("Please provide an email address");
        return;
      }

      if (selectedCategories.length === 0) {
        toast.error("Please select at least one category to subscribe to");
        return;
      }

      // Call the Supabase function to handle subscription
      const { data, error } = await supabase.functions.invoke("handle-subscription", {
        body: {
          email: subscriptionEmail,
          userId: user?.id || null,
          categoryIds: selectedCategories
        }
      });

      if (error) throw error;

      if (data.updated) {
        toast.success("Your subscription preferences have been updated!");
      } else {
        toast.success("You've successfully subscribed!");
        
        if (!user) {
          setEmail("");
        }
        setSelectedCategories([]);
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 mb-4">
        <BookMarked className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Subscribe to Updates</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        {!user && (
          <div className="mb-4">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!user}
              className="w-full"
            />
          </div>
        )}
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Select categories you're interested in:</p>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  className="mr-2"
                />
                <label 
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || (!user && !email) || selectedCategories.length === 0}
          className="w-full"
        >
          {isLoading ? "Processing..." : user ? "Update Subscription" : "Subscribe"}
        </Button>
      </form>
    </div>
  );
};

export default SubscribeForm;
