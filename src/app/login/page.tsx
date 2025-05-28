
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type UserProfile } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/common/logo";
import { Mail, User as UserIcon, Briefcase, KeyRound, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, signInWithGoogle, signUpWithEmailAndPasswordApp, signInWithEmailAndPasswordApp, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("google");

  useEffect(() => {
    if (user) {
      const redirectPath = searchParams.get("redirect");
      router.push(redirectPath || "/");
    }
  }, [user, router, searchParams]);

  const handleGoogleSignIn = async (role: UserProfile['role']) => {
    try {
      await signInWithGoogle(role);
      // Redirection is handled by useEffect
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleEmailPasswordAuth = async (action: 'signin' | 'signup', role: UserProfile['role']) => {
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    try {
      if (action === 'signup') {
        await signUpWithEmailAndPasswordApp(email, password, role);
        toast({ title: "Sign Up Successful!", description: "You're now logged in." });
      } else {
        await signInWithEmailAndPasswordApp(email, password);
        // Existing users' roles are fetched, role parameter here is more for UI consistency if needed
        toast({ title: "Sign In Successful!", description: "Welcome back!" });
      }
      // Redirection is handled by useEffect
    } catch (error: any) {
      toast({
        title: `${action === 'signup' ? 'Sign Up' : 'Sign In'} Failed`,
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };


  if (loading && !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
         <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
      </div>
    );
  }
  
  if (user) {
     return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
         <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo iconClassName="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to ClipperConnect</CardTitle>
          <CardDescription>Choose your role and sign in or sign up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google">Sign in with Google</TabsTrigger>
              <TabsTrigger value="email">Email & Password</TabsTrigger>
              {/* Phone Tab can be added later */}
            </TabsList>
            
            <TabsContent value="google" className="pt-6 space-y-3">
              <Button 
                onClick={() => handleGoogleSignIn('user')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                <UserIcon className="mr-2 h-5 w-5" /> 
                {loading ? "Processing..." : "Continue as Customer with Google"}
              </Button>
              <Button 
                onClick={() => handleGoogleSignIn('shopkeeper')}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <Briefcase className="mr-2 h-5 w-5" /> 
                {loading ? "Processing..." : "Continue as Shop Owner with Google"}
              </Button>
            </TabsContent>

            <TabsContent value="email" className="pt-6 space-y-4">
              <div>
                <Label htmlFor="email"><Mail className="inline mr-1 h-4 w-4" />Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
              </div>
              <div>
                <Label htmlFor="password"><KeyRound className="inline mr-1 h-4 w-4" />Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
              </div>
              <CardDescription className="text-xs text-center">Select your role below to sign in or sign up.</CardDescription>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleEmailPasswordAuth('signin', 'user')} className="w-full" variant="outline" disabled={loading}><LogIn className="mr-2 h-4 w-4"/>Sign In as Customer</Button>
                <Button onClick={() => handleEmailPasswordAuth('signin', 'shopkeeper')} className="w-full" variant="outline" disabled={loading}><LogIn className="mr-2 h-4 w-4"/>Sign In as Shop Owner</Button>
              </div>
               <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleEmailPasswordAuth('signup', 'user')} className="w-full" disabled={loading}><UserIcon className="mr-2 h-4 w-4"/>Sign Up as Customer</Button>
                <Button onClick={() => handleEmailPasswordAuth('signup', 'shopkeeper')} className="w-full" disabled={loading}><Briefcase className="mr-2 h-4 w-4"/>Sign Up as Shop Owner</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
