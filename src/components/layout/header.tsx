
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { Home, LogIn, LogOut, User, Briefcase, Scissors, Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const mainNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/shops", label: "Find Shops", icon: Search },
  ];

  const userNavLinks = user ? [
    { href: "/profile", label: "Profile", icon: User },
    { href: user.role === 'shopkeeper' ? "/dashboard/shop" : "/dashboard/user", label: "Dashboard", icon: Briefcase },
  ] : [];

  const NavLinkItem = ({ href, label, icon: Icon, onClick }: { href: string; label:string; icon: React.ElementType; onClick?: () => void }) => (
    <Button variant="ghost" asChild onClick={onClick}>
      <Link href={href} className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
  
  const MobileNavLinkItem = ({ href, label, icon: Icon, onClick }: { href: string; label:string; icon: React.ElementType; onClick?: () => void }) => (
     <Link href={href} onClick={onClick} className="flex items-center p-3 rounded-md hover:bg-accent">
        <Icon className="h-5 w-5 mr-3" />
        {label}
      </Link>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo href="/" />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {mainNavLinks.map(link => <NavLinkItem key={link.href} {...link} />)}
          {user && userNavLinks.map(link => <NavLinkItem key={link.href} {...link} />)}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <Button variant="outline" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavLinks.map(link => (
                   <DropdownMenuItem key={link.href} asChild>
                     <Link href={link.href} className="flex items-center">
                       <link.icon className="mr-2 h-4 w-4" />
                       {link.label}
                     </Link>
                   </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" onClick={() => router.push("/login")}>
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          )}
          
          {/* Mobile Navigation Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <div className="p-6">
                <Logo href="/" onClick={() => setMobileMenuOpen(false)} />
              </div>
              <nav className="flex flex-col gap-2 p-4">
                {mainNavLinks.map(link => <MobileNavLinkItem key={link.href} {...link} onClick={() => setMobileMenuOpen(false)} />)}
                {user && userNavLinks.map(link => <MobileNavLinkItem key={link.href} {...link} onClick={() => setMobileMenuOpen(false)} />)}
                <div className="pt-4 mt-4 border-t">
                {user ? (
                    <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  ) : (
                    <Button variant="default" className="w-full" onClick={() => { router.push("/login"); setMobileMenuOpen(false); }}>
                      <LogIn className="mr-2 h-4 w-4" /> Login / Sign Up
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
