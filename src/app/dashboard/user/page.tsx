
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, History, PlusCircle, MapPin, CalendarPlus, AlertTriangle, ExternalLink, Sparkles, ShoppingBag, ThumbsUp } from "lucide-react";
import type { Booking, RecommendedShopInfo } from "@/lib/types";
import Link from "next/link";
import { format, formatISO, parse } from "date-fns";
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
import { mockUserBookings, mockShopsArray } from "@/lib/mock-data";
import { recommendShopsForUser, type RecommendShopsOutput } from "@/ai/flows/recommend-shops-flow";

function formatDisplayTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return "N/A";
  try {
    const date = parse(timeStr, "HH:mm", new Date());
    return format(date, "p"); // e.g., 4:30 PM
  } catch (error) {
    console.warn("Error formatting display time:", timeStr, error);
    return timeStr;
  }
}

export default function UserDashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  const [recommendations, setRecommendations] = useState<RecommendShopsOutput | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [serviceInterestForRecs, setServiceInterestForRecs] = useState("");


  useEffect(() => {
    if (user) {
      setIsLoadingBookings(true);
      const userBookingsWithShopDetails = mockUserBookings
        .filter(b => b.userId === (user.uid || "user1")) 
        .map(booking => {
          const shopDetails = mockShopsArray.find(shop => shop.id === booking.shopId);
          return {
            ...booking,
            shopLocation: shopDetails?.location,
            shopGoogleMapsLink: shopDetails?.location?.googleMapsLink,
          };
        });
      
      userBookingsWithShopDetails.sort((a, b) => {
        const now = new Date();
        const aIsUpcoming = a.startTime > now && (a.status === 'confirmed' || a.status === 'pending');
        const bIsUpcoming = b.startTime > now && (b.status === 'confirmed' || b.status === 'pending');
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        if (aIsUpcoming && bIsUpcoming) return a.startTime.getTime() - b.startTime.getTime();
        return b.startTime.getTime() - a.startTime.getTime(); 
      });

      setBookings(userBookingsWithShopDetails);
      setIsLoadingBookings(false);
    }
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled_by_user', cancellationReason: "Cancelled by user" } : b));
    
    const indexInMock = mockUserBookings.findIndex(b => b.id === bookingId);
    if (indexInMock !== -1) {
      mockUserBookings[indexInMock].status = 'cancelled_by_user';
      mockUserBookings[indexInMock].cancellationReason = "Cancelled by user";
    }

    toast({ title: "Booking Cancelled", description: `Booking ID ${bookingId} has been cancelled. (Mocked)` });
  };

  const fetchRecommendations = async () => {
    if (!user) return;
    setIsLoadingRecommendations(true);
    setRecommendations(null);
    try {
      const result = await recommendShopsForUser({ userId: user.uid, serviceInterest: serviceInterestForRecs || undefined });
      setRecommendations(result);
      toast({ title: "Recommendations Ready!", description: "Here are some shops you might like." });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({ title: "Recommendation Failed", description: (error as Error).message || "Could not fetch recommendations.", variant: "destructive" });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };


  if (loading || isLoadingBookings) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="text-center py-10">Please log in to view your dashboard.</div>;
  }

  const upcomingBookings = bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.startTime > new Date());
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status.includes('cancel') || ((b.status === 'confirmed' || b.status === 'pending') && b.startTime <= new Date()));


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

      {/* AI Recommendations Section */}
      <Card className="shadow-lg border-accent">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><Sparkles className="mr-2 h-6 w-6 text-accent" /> Personalized Recommendations</CardTitle>
          <CardDescription>Discover new barbershops tailored to your preferences. Enter a service you're interested in (optional).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Removed Input for serviceInterestForRecs, as it's not being used effectively by the simplified mock prompt */}
          <Button onClick={fetchRecommendations} disabled={isLoadingRecommendations} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoadingRecommendations ? "Thinking..." : <><ThumbsUp className="mr-2 h-4 w-4" /> Get My Shop Recommendations</>}
          </Button>
          {recommendations && recommendations.recommendations.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="font-semibold text-lg">{recommendations.overallReasoning}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.recommendations.map(rec => (
                  <Card key={rec.shopId} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{rec.shopName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground italic mb-2">{rec.reason}</p>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" size="sm" asChild>
                        <Link href={`/shops/${rec.shopId}`}>
                            <ShoppingBag className="mr-2 h-4 w-4"/> View Shop
                        </Link>
                       </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {recommendations && recommendations.recommendations.length === 0 && !isLoadingRecommendations && (
            <p className="text-muted-foreground mt-4">No specific recommendations found at this time. Try exploring all shops!</p>
          )}
        </CardContent>
      </Card>


      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming"><CalendarCheck className="mr-2 h-4 w-4 inline-block"/>Upcoming Appointments ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4 inline-block"/>Booking History ({pastBookings.length})</TabsTrigger>
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

  const generateGoogleCalendarLink = (booking: Booking) => {
    const title = encodeURIComponent(`${booking.serviceName} at ${booking.shopName}`);
    const startTimeISO = formatISO(booking.startTime).replace(/-/g, '').replace(/:/g, '').slice(0, -5) + 'Z';
    const endTimeISO = formatISO(booking.endTime).replace(/-/g, '').replace(/:/g, '').slice(0, -5) + 'Z';
    const dates = `${startTimeISO}/${endTimeISO}`;
    const details = encodeURIComponent(`Appointment for ${booking.serviceName}.\nShop: ${booking.shopName}\nAddress: ${booking.shopLocation?.address || 'N/A'}`);
    const location = encodeURIComponent(booking.shopLocation?.address || booking.shopName || '');

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <div className="space-y-4 mt-4">
      {bookings.map(booking => {
        const shopLocation = booking.shopLocation;
        const mapsLink = booking.shopGoogleMapsLink || (shopLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopLocation.address)}` : "#");
        
        return (
          <Card key={booking.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row justify-between items-start pb-3">
              <div>
                <CardTitle className="text-xl">{booking.serviceName}</CardTitle>
                <CardDescription>at {booking.shopName || "Unknown Shop"}</CardDescription>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-medium
                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  booking.status.includes('cancel') ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'}`}>
                {booking.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p><strong>Date:</strong> {format(booking.startTime, "EEEE, MMMM d, yyyy")}</p>
              <p><strong>Time:</strong> {formatDisplayTime(format(booking.startTime, "HH:mm"))} - {formatDisplayTime(format(booking.endTime, "HH:mm"))}</p>
              <p><strong>Price:</strong> ${booking.totalPrice.toFixed(2)}</p>
              {shopLocation && (
                <div className="flex items-start text-sm text-muted-foreground pt-1">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{shopLocation.address}</span>
                </div>
              )}
               {booking.cancellationReason &&(
                 <p className="text-xs text-muted-foreground italic pt-1">Reason: {booking.cancellationReason}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 pt-3">
              {shopLocation && (
                 <Button variant="outline" size="sm" asChild>
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3 w-3" /> Get Directions
                    </a>
                 </Button>
              )}
              {isUpcoming && (booking.status === 'confirmed' || booking.status === 'pending') &&
                (
                <>
                 <Button variant="outline" size="sm" asChild>
                    <a href={generateGoogleCalendarLink(booking)} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="mr-2 h-3 w-3" /> Add to Calendar
                    </a>
                 </Button>
                 { booking.status === 'confirmed' && (
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
                  )}
                </>
              )}
              {booking.status.includes('cancelled_by_user') && (
                 <div className="w-full text-sm text-muted-foreground italic flex items-center">
                     This booking was cancelled by you.
                     <Button variant="link" asChild className="ml-1 p-0 h-auto">
                        <Link href={`/shops/${booking.shopId}`}>Rebook at {booking.shopName || "Shop"}</Link>
                     </Button>
                 </div>
              )}
               {booking.status.includes('cancelled_by_shop') && (
                 <div className="w-full text-sm text-destructive italic flex items-center">
                     This booking was cancelled by the shop.
                     <Button variant="link" asChild className="ml-1 p-0 h-auto">
                        <Link href="/shops">Find another shop</Link>
                     </Button>
                 </div>
              )}
               {!isUpcoming && (booking.status === 'completed') && (
                 <Button variant="outline" size="sm" asChild>
                    <Link href={`/shops/${booking.shopId}?service=${booking.serviceId}`}>
                        <History className="mr-2 h-3 w-3" /> Book Again
                    </Link>
                 </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  );
}
    

    
