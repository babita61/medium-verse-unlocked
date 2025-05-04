
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Provider } from "@supabase/supabase-js";
import { Github, Twitter } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState<Provider | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatar) return null;
    
    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar, { upsert: true });
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      // Register the user
      await signUp(values.email, values.password, {
        full_name: values.fullName,
      });
      
      // Note: The avatar upload will happen in a future step after email verification
      // Since we need the user ID which is only available after verification
      
      toast.success("Please check your email to verify your account");
      navigate("/auth/login");
    } catch (error) {
      // Error is handled in signUp
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: Provider) => {
    try {
      setOAuthLoading(provider);
      await signInWithOAuth(provider);
      // No need to navigate, the OAuth flow will redirect back to the app
    } catch (error) {
      console.error(`Sign in with ${provider} error:`, error);
    } finally {
      setOAuthLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-serif font-bold dark:text-white">Create an Account</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Join our community</p>
      </div>

      <div className="space-y-4 mb-4">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleOAuthSignIn("google")}
          disabled={!!oAuthLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
          </svg>
          {oAuthLoading === "google" ? "Signing in..." : "Sign up with Google"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleOAuthSignIn("github")}
          disabled={!!oAuthLoading}
        >
          <Github size={18} />
          {oAuthLoading === "github" ? "Signing in..." : "Sign up with GitHub"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleOAuthSignIn("twitter")}
          disabled={!!oAuthLoading}
        >
          <Twitter size={18} />
          {oAuthLoading === "twitter" ? "Signing in..." : "Sign up with Twitter"}
        </Button>
      </div>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 text-sm">
          Or continue with
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400 dark:text-gray-500">
                    {form.getValues("fullName").charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                +
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-200">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    autoComplete="name"
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-200">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="youremail@example.com" 
                    type="email" 
                    autoComplete="email"
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-200">Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    autoComplete="new-password"
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-200">Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    autoComplete="new-password"
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Register;
