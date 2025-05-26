
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, History, PlusCircle, Edit, AlertTriangle } from "lucide-react";
import type { Booking } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock data
const mockBookings: Booking[] = [
  {
    id: "booking1",
    userId: "user1",
    shopId: "1",
    serviceId: "s1",
    serviceName: "Classic Haircut",
    shopName: "Gentleman's Choice Cuts",
    startTime: new Date(new Date().setDate(new Date().getDate() + 2)), // Upcoming
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).getTime() + 45 * 60000),
    status: "confirmed",
    totalPrice: 30,
    createdAt: new Date(),
  },
  {
    id: "booking2",
    userId: "user1",
    shopId: "2",
    serviceId: "s3",
    serviceName: "Designer Cut",
    shopName: "The Modern Mane",
    startTime: new Date(new Date().setDate(new Date().getDate() - 7)), // Past
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 7)).getTime() + 60 * 60000),
    status: "completed",
    totalPrice: 50,
    createdAt: new Date(),
  },
  {
    id: "booking3",
    userId: "user1",
    shopId: "1",
    serviceId: "s2",
    serviceName: "Beard Trim & Shape",
    shopName: "Gentleman's Choice Cuts",
    startTime: new Date(new Date().setDate(new Date().getDate() + 5)), // Upcoming
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 5)).getTime() + 25 * 60000),
    status: "confirmed",
    totalPrice: 20,
    createdAt: new Date(),
  },
   {
    id: "booking4",
    userId: "user1",
    shopId: "1",
    serviceId: "s11",
    serviceName: "Hot Towel Shave",
    shopName: "Gentleman's Choice Cuts",
    startTime: new Date(new Date().setDate(new Date().getDate() - 14)), // Past
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 14)).getTime() + 40 * 60000),
    status: "completed",
    totalPrice: 35,
    createdAt: new Date(),
  },
];


export default function UserDashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch user bookings from Firestore
      // For now, using mock data
      setIsLoadingBookings(true);
      // Filter mock bookings for the current user (mocking this part)
      const userBookings = mockBookings.map(b => ({...b, shopName: b.shopName || "Sample Shop"}));
      
      // Sort bookings: upcoming first, then by date
      userBookings.sort((a, b) => {
        const now = new Date();
        const aIsUpcoming = a.startTime > now;
        const bIsUpcoming = b.startTime > now;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        return b.startTime.getTime() - a.startTime.getTime(); // Sort by date, newest first for past, earliest first for upcoming
      });

      setBookings(userBookings);
      setIsLoadingBookings(false);
    }
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    // Mock cancellation
    // In a real app, update Firestore document status to 'cancelled_by_user'
    // and potentially notify the shop.
    
    // Check if booking can be cancelled (e.g. not too close to appointment time)
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (bookingToCancel && bookingToCancel.startTime < new Date()) {
        toast({ title: "Cannot Cancel", description: "Past appointments cannot be cancelled.", variant: "destructive" });
        return;
    }
    // Example: Cannot cancel within 24 hours
    if (bookingToCancel && (bookingToCancel.startTime.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000) {
        toast({ title: "Cancellation Period Expired", description: "Appointments cannot be cancelled less than 24 hours in advance.", variant: "destructive" });
        return;
    }


    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled_by_user' } : b));
    toast({ title: "Booking Cancelled", description: `Booking ID ${bookingId} has been cancelled. (Mocked)` });
    // Show rebooking options (e.g., link to shop page or booking page)
  };


  if (loading || isLoadingBookings) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (!user) {
    // This should ideally be handled by a protected route wrapper or redirect in a higher component
    return <div className="text-center py-10">Please log in to view your dashboard.</div>;
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && b.startTime > new Date());
  const pastBookings = bookings.filter(b => b.status !== 'confirmed' || b.startTime <= new Date());

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.displayName || "User"}!</h1>
            <p className="text-muted-foreground">Manage your appointments and view your booking history.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/shops">
            <PlusCircle className="mr-2 h-4 w-4" /> Book New Appointment
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming"><CalendarCheck className="mr-2 h-4 w-4 inline-block"/>Upcoming Appointments</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4 inline-block"/>Booking History</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <BookingList bookings={upcomingBookings} onCancel={handleCancelBooking} isUpcoming={true} />
        </TabsContent>
        <TabsContent value="history">
          <BookingList bookings={pastBookings} onCancel={handleCancelBooking} isUpcoming={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BookingListProps {
  bookings: Booking[];
  onCancel: (bookingId: string) => void;
  isUpcoming: boolean;
}

function BookingList({ bookings, onCancel, isUpcoming }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No {isUpcoming ? "upcoming appointments" : "bookings in history"}.</p>
          {isUpcoming && 
            <Button variant="link" asChild className="mt-2">
                <Link href="/shops">Book an appointment now!</Link>
            </Button>
          }
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {bookings.map(booking => (
        <Card key={booking.id} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row justify-between items-start pb-2">
            <div>
              <CardTitle className="text-xl">{booking.serviceName}</CardTitle>
              <CardDescription>at {booking.shopName || "Unknown Shop"}</CardDescription>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium
              ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                booking.status.includes('cancelled') ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'}`}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </CardHeader>
          <CardContent>
            <p><strong>Date:</strong> {format(booking.startTime, "EEEE, MMMM d, yyyy")}</p>
            <p><strong>Time:</strong> {format(booking.startTime, "p")} - {format(booking.endTime, "p")}</p>
            <p><strong>Price:</strong> ${booking.totalPrice.toFixed(2)}</p>
          </CardContent>
          {isUpcoming && booking.status === 'confirmed' && (
            <CardFooter className="flex justify-end gap-2">
              {/* <Button variant="outline" size="sm" asChild>
                <Link href={`/book/${booking.shopId}?edit=${booking.id}`}>
                  <Edit className="mr-2 h-3 w-3" /> Reschedule (Mock)
                </Link>
              </Button> */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <AlertTriangle className="mr-2 h-3 w-3" /> Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your appointment for {booking.serviceName} on {format(booking.startTime, "PPP 'at' p")} will be cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancel(booking.id)} className="bg-destructive hover:bg-destructive/90">
                      Yes, Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
          {booking.status.includes('cancelled') && (
            <CardFooter>
                 <p className="text-sm text-muted-foreground italic">This booking was cancelled. Need to rebook?</p>
                 <Button variant="link" asChild className="ml-2">
                    <Link href={`/shops/${booking.shopId}`}>Visit {booking.shopName || "Shop"}</Link>
                 </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
