
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpenText, Settings, Bot, CalendarDays, Users, DollarSign } from "lucide-react";
import Link from "next/link";

// Mock data for daily insights
const mockInsights = {
  totalBookings: 15,
  totalRevenue: 450.00,
  averageRating: 4.7,
  cancellationRate: 0.10, // 10%
};

export default function ShopkeeperDashboardPage() {
  const { user, loading } = useAuth();

  // TODO: Fetch shop-specific data and insights from Firestore

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    // This should ideally be handled by a protected route wrapper
    return <div className="text-center py-10">Access denied. You must be a shopkeeper.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopkeeper Dashboard</h1>
        <p className="text-muted-foreground">Manage your barbershop, bookings, and view insights.</p>
      </div>

      {/* Quick Stats Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Today&apos;s Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard title="Total Bookings" value={mockInsights.totalBookings.toString()} icon={<CalendarDays className="h-6 w-6 text-primary" />} />
          <InsightCard title="Total Revenue" value={`$${mockInsights.totalRevenue.toFixed(2)}`} icon={<DollarSign className="h-6 w-6 text-green-500" />} />
          <InsightCard title="Average Rating" value={`${mockInsights.averageRating}/5`} icon={<Users className="h-6 w-6 text-yellow-500" />} />
          <InsightCard title="Cancellations" value={`${(mockInsights.cancellationRate * 100).toFixed(0)}%`} icon={<BarChart3 className="h-6 w-6 text-red-500" />} />
        </div>
      </section>

      {/* Management Links Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Manage Your Shop</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            href="/dashboard/shop/manage"
            title="Shop Details & Services"
            description="Update your shop's information, services, prices, and availability."
            icon={<Settings className="h-8 w-8 text-accent" />}
          />
          <ActionCard
            href="/dashboard/shop/bookings"
            title="Manage Bookings"
            description="View, accept, reject, or cancel incoming appointments."
            icon={<BookOpenText className="h-8 w-8 text-accent" />}
          />
          <ActionCard
            href="/dashboard/shop/ai-scheduler"
            title="AI Scheduling Assistant"
            description="Optimize your schedule and get booking suggestions using AI."
            icon={<Bot className="h-8 w-8 text-accent" />}
          />
        </div>
      </section>
    </div>
  );
}

interface ActionCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function ActionCard({ href, title, description, icon }: ActionCardProps) {
  return (
    <Link href={href} passHref>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          {icon}
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}


interface InsightCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function InsightCard({ title, value, icon }: InsightCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
        </Card>
    );
}
