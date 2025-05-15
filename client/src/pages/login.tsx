import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyUserSelector } from "@/components/family-user-selector";
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

const magicLinkSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const magicLinkConsumeSchema = z.object({
  token: z.string().min(10, { message: "Invalid magic link token" }),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  confirmPassword: z.string().min(4),
  role: z.enum(["parent", "child"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Login() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/login-consume');
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState("family");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [tokenConsuming, setTokenConsuming] = useState(false);
  const [consumeError, setConsumeError] = useState("");
  
  // Check for token in query params
  useEffect(() => {
    // Handle existing token query param (universal login path)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    // Special handling for the login-consume path
    const isLoginConsume = window.location.pathname === '/login-consume';
    
    if (token) {
      // Set active tab to magic link if we're processing a token
      setActiveTab('magic');
      consumeMagicLink(token);
      
      // If we're on the special consume path, clean the URL after consuming
      if (isLoginConsume) {
        // Replace URL without token to avoid reusing expired links
        window.history.replaceState(null, '', '/login');
      }
    } else if (isLoginConsume) {
      // Handle case where login-consume is used without a token
      setActiveTab('magic');
      toast({
        title: "Invalid Login Link",
        description: "The login link is missing or expired. Please request a new one.",
        variant: "destructive",
      });
      // Redirect to regular login
      window.history.replaceState(null, '', '/login');
    }
  }, [toast, setActiveTab, consumeMagicLink]);
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "parent",
    },
  });
  
  // Magic link login form
  const magicLinkForm = useForm<z.infer<typeof magicLinkSchema>>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Helper function for API requests
  const doFetch = async (url: string, method: string, data: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }
    
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  };
  
  const handleRequestMagicLink = async (data: z.infer<typeof magicLinkSchema>) => {
    setIsLoading(true);
    try {
      await doFetch("/api/auth/request-login", "POST", data);
      
      // Always show success, even if email doesn't exist (prevents enumeration)
      setEmailSent(true);
      
      toast({
        title: "Magic link sent",
        description: "Check your email for a login link",
      });
    } catch (error) {
      // Even for errors we show success to prevent user enumeration
      setEmailSent(true);
      console.error("Error requesting magic link:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const consumeMagicLink = async (token: string) => {
    setTokenConsuming(true);
    setConsumeError("");
    
    try {
      const result = await doFetch("/api/auth/consume-login", "POST", { token });
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      login(result.jwt, result.user);
      setLocation("/");
    } catch (error) {
      setConsumeError("Invalid or expired login link. Please request a new one.");
      toast({
        title: "Login failed",
        description: "Invalid or expired login link",
        variant: "destructive",
      });
    } finally {
      setTokenConsuming(false);
    }
  };
  
  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const result = await doFetch("/api/auth/login", "POST", data);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      login(result.token, result.user);
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...registerData } = data;
      
      const result = await doFetch("/api/auth/register", "POST", registerData);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      login(result.token, result.user);
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full md:max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M8 2h8" />
                <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />
                <path d="M7 14a2 2 0 0 0 2-2" />
                <path d="M15 12a2 2 0 0 1 2 2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">TicketTracker</h1>
          </div>
        </div>

        <Tabs defaultValue="magic" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mx-6 mb-6">
            <TabsTrigger value="magic">Magic Link</TabsTrigger>
            <TabsTrigger value="family">Quick Login</TabsTrigger>
            <TabsTrigger value="login">Username</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="family">
            <FamilyUserSelector />
          </TabsContent>
          
          <TabsContent value="magic">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Magic Link Login</CardTitle>
                <CardDescription className="text-center">
                  Get a secure login link sent to your email
                </CardDescription>
              </CardHeader>
              
              {emailSent ? (
                <div className="p-6">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Email Sent</h3>
                        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                          A magic link has been sent to your email. Click the link in your email to sign in.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setEmailSent(false)}
                  >
                    Send Another Link
                  </Button>
                </div>
              ) : (
                <Form {...magicLinkForm}>
                  <form onSubmit={magicLinkForm.handleSubmit(handleRequestMagicLink)}>
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={magicLinkForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="parent@example.com" 
                                type="email" 
                                autoComplete="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    
                    <CardFooter>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending Link...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Magic Link
                          </span>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              )}
              
              {consumeError && (
                <div className="px-6 pb-6">
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>
                      {consumeError}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {tokenConsuming && (
                <div className="p-6 flex justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Verifying your login link...</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Login</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                          Logging in...
                        </span>
                      ) : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Register</CardTitle>
                <CardDescription className="text-center">
                  Create a new account
                </CardDescription>
              </CardHeader>
              
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                value="parent"
                                checked={field.value === "parent"}
                                onChange={() => field.onChange("parent")}
                              />
                              <span>Parent</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                value="child"
                                checked={field.value === "child"}
                                onChange={() => field.onChange("child")}
                              />
                              <span>Child</span>
                            </label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                          Creating Account...
                        </span>
                      ) : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
