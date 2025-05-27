
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Scissors, Search, CalendarDays, LayoutDashboard, Settings, BookOpenText, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container px-4 md:px-6 text-center">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4 text-left">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  ClipperConnect: Your Style, Scheduled.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Discover top barbershops, book appointments seamlessly, and manage your style with ease.
                  For users and shopkeepers alike.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                {user && user.role === 'shopkeeper' ? (
                  <>
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/dashboard/shop/manage">
                        <Settings className="mr-2 h-5 w-5" /> Manage Your Shop
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/dashboard/shop/bookings">
                        <BookOpenText className="mr-2 h-5 w-5" /> View Bookings
                      </Link>
                    </Button>
                     <Button asChild variant="secondary" size="lg">
                      <Link href="/dashboard/shop/ai-scheduler">
                        <Bot className="mr-2 h-5 w-5" /> AI Scheduler
                      </Link>
                    </Button>
                  </>
                ) : user ? ( // Logged-in customer
                  <>
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/shops">
                        Find a Barbershop <Search className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/dashboard">
                        Go to Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                ) : ( // Not logged in
                  <>
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/shops">
                        Find a Barbershop <Search className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/login">
                        Login / Sign Up <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Image
              src="https://t3.ftcdn.net/jpg/11/20/21/70/240_F_1120217022_EIphwSclvOAbNXOrB8L6kJHCMQfzIHbd.jpg"
              data-ai-hint="barbershop modern"
              width="600"
              height="400"
              alt="Stylish modern barbershop interior or haircut scene"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for a Sharp Look</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ClipperConnect offers a comprehensive suite of tools for both customers seeking grooming services and barbershop owners managing their business.
            </p>
          </div>
          <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
            <FeatureCard
              icon={<Search className="h-8 w-8 text-primary" />}
              title="Easy Shop Discovery"
              description="Browse barbershops by location, ratings, services, and real-time availability."
            />
            <FeatureCard
              icon={<CalendarDays className="h-8 w-8 text-primary" />}
              title="Seamless Booking"
              description="Book your preferred services with custom slots or instant booking options."
            />
            <FeatureCard
              icon={<Scissors className="h-8 w-8 text-primary" />}
              title="Shop Management Tools"
              description="For shopkeepers: manage details, services, pricing, availability, and bookings effortlessly."
            />
             <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 8V4H8"/><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h2"/><path d="M10 12h2"/></svg>
              }
              title="AI Scheduling Assistant"
              description="Optimize your shop's efficiency with AI-powered time slot recommendations."
            />
             <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              }
              title="Personalized Profiles"
              description="Manage your profile, preferred barbers, and addresses for a tailored experience."
            />
            <FeatureCard
              icon={
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              }
              title="Secure UPI Payments"
              description="Pay for your bookings securely using Razorpay UPI integration (mocked)."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
