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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: "Please enter the 6-digit code" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const Login = () => {
  const { signIn, signInWithOAuth, signInWithPhone, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState<Provider | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const emailForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmitEmail = async (values: LoginFormValues) => {
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

  const onSubmitPhone = async (values: PhoneFormValues) => {
    try {
      setIsLoading(true);
      const formattedPhone = formatPhoneNumber(values.phone);
      setPhoneNumber(formattedPhone);
      await signInWithPhone(formattedPhone);
      setShowOtp(true);
    } catch (error) {
      console.error("Phone login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOtp = async (values: OtpFormValues) => {
    try {
      setIsLoading(true);
      await verifyOtp(phoneNumber, values.otp);
      navigate("/");
    } catch (error) {
      console.error("OTP verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Check if phone number already has country code
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Otherwise add +1 (US) code by default
    // In a real app, you may want to let users select their country code
    return `+1${phone.replace(/\D/g, '')}`;
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
      
      <Tabs defaultValue="email" value={authMethod} onValueChange={(value) => setAuthMethod(value as "email" | "phone")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
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
                control={emailForm.control}
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
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="phone">
          {!showOtp ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-200">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 (123) 456-7890" 
                          type="tel" 
                          autoComplete="tel"
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
                  {isLoading ? "Sending code..." : "Send verification code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-200">Verification Code</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowOtp(false)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
