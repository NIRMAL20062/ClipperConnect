
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type UserProfile } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Logo } from "@/components/common/logo";
import { Mail, User as UserIcon, Briefcase, KeyRound, LogIn, UserPlus, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const {
    user,
    signInWithGoogle,
    signUpWithEmailAndPasswordApp,
    signInWithEmailAndPasswordApp,
    sendPasswordResetEmailApp, // Added new function
    loading
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("email"); // Default to email tab
  const [selectedRole, setSelectedRole] = useState<UserProfile['role']>('user');

  useEffect(() => {
    if (user) {
      const redirectPath = searchParams.get("redirect");
      router.push(redirectPath || "/");
    }
  }, [user, router, searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(selectedRole);
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleEmailPasswordSubmit = async (action: 'signin' | 'signup') => {
    if (!email || (action === 'signup' && !password) || (action === 'signin' && !password)) {
      toast({ title: "Missing Fields", description: "Please enter email and password.", variant: "destructive" });
      return;
    }
    try {
      if (action === 'signup') {
        await signUpWithEmailAndPasswordApp(email, password, selectedRole);
        toast({ title: "Sign Up Successful!", description: "You're now logged in." });
      } else { // signin
        await signInWithEmailAndPasswordApp(email, password);
        toast({ title: "Sign In Successful!", description: "Welcome back!" });
      }
    } catch (error: any) {
      toast({
        title: `${action === 'signup' ? 'Sign Up' : 'Sign In'} Failed`,
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address to reset your password.", variant: "destructive" });
      return;
    }
    try {
      await sendPasswordResetEmailApp(email);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).",
      });
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An error occurred. Please try again.",
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
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label className="text-base font-medium">I am a:</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value: UserProfile['role']) => setSelectedRole(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="role-user" />
                <Label htmlFor="role-user" className="font-normal flex items-center gap-1 cursor-pointer"><UserIcon className="h-4 w-4"/>Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shopkeeper" id="role-shopkeeper" />
                <Label htmlFor="role-shopkeeper" className="font-normal flex items-center gap-1 cursor-pointer"><Briefcase className="h-4 w-4"/>Shop Owner</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Select your role if signing up. For sign-in, your existing role will be used.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email & Password</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="pt-6 space-y-4">
              <div>
                <Label htmlFor="email"><Mail className="inline mr-1 h-4 w-4 text-muted-foreground" />Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
              </div>
              <div>
                <Label htmlFor="password"><KeyRound className="inline mr-1 h-4 w-4 text-muted-foreground" />Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
              </div>
              <div className="text-sm">
                <Button type="button" variant="link" onClick={handleForgotPassword} className="p-0 h-auto font-normal text-primary hover:text-primary/80">
                  <HelpCircle className="inline mr-1 h-4 w-4" /> Forgot Password?
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button onClick={() => handleEmailPasswordSubmit('signin')} className="w-full" variant="outline" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4"/>Sign In
                </Button>
                <Button onClick={() => handleEmailPasswordSubmit('signup')} className="w-full" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4"/>Sign Up
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="google" className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or sign up as a <span className="font-semibold text-foreground">{selectedRole === 'user' ? 'Customer' : 'Shop Owner'}</span> using your Google account.
              </p>
              <Button
                onClick={handleGoogleSignIn}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                <svg role="img" viewBox="0 0 24 24" className="mr-2 h-5 w-5"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.02c-.9.82-2.34 1.66-4.04 1.66c-3.3 0-6.02-2.74-6.02-6.09s2.72-6.09 6.02-6.09c1.82 0 3.04.73 3.95 1.61l2.46-2.37C18.09 2.99 15.74 2 12.48 2C8.34 2 5 5.33 5 9.52s3.34 7.52 7.48 7.52c2.84 0 4.99-1.02 6.57-2.61c1.72-1.69 2.27-4.03 2.27-5.9v-.22H12.48z"></path></svg>
                {loading ? "Processing..." : "Continue with Google"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            By continuing, you agree to our <Button variant="link" className="p-0 h-auto">Terms of Service</Button> and <Button variant="link" className="p-0 h-auto">Privacy Policy</Button>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
