
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { Mail } from "lucide-react"; // Using Mail icon as a generic representation for Gmail

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect based on role or to a general dashboard
      if (user.role === 'shopkeeper') {
        router.push("/dashboard/shop");
      } else {
        router.push("/dashboard/user");
      }
    }
  }, [user, router]);

  if (loading || user) { // Show loading or let useEffect redirect
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
         <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
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
          <CardDescription>Sign in to find your perfect cut or manage your shop.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={signInWithGoogle} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            <Mail className="mr-2 h-5 w-5" /> 
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
