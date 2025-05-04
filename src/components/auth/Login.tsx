
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
import { toast } from "@/components/ui/sonner";
import { Github, Twitter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Provider } from "@supabase/supabase-js";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState<Provider | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(values.email, values.password);
      navigate("/");
    } catch (error) {
      // Error is handled in signIn
      console.error("Login error:", error);
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
        <h1 className="text-2xl font-serif font-bold dark:text-white">Welcome Back</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Sign in to your account</p>
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
          {oAuthLoading === "google" ? "Signing in..." : "Sign in with Google"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleOAuthSignIn("github")}
          disabled={!!oAuthLoading}
        >
          <Github size={18} />
          {oAuthLoading === "github" ? "Signing in..." : "Sign in with GitHub"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleOAuthSignIn("twitter")}
          disabled={!!oAuthLoading}
        >
          <Twitter size={18} />
          {oAuthLoading === "twitter" ? "Signing in..." : "Sign in with Twitter"}
        </Button>
      </div>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-gray-500 text-sm">
          Or continue with
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    autoComplete="current-password"
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
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link to="/auth/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Login;
