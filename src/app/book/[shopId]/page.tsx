
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Barbershop, Service, Booking } from "@/lib/types";
import { AlertCircle, CalendarDays, Clock, Scissors, User as UserIcon, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { mockShopsArray, mockUserBookings } from "@/lib/mock-data"; // Use centralized mock data

// Generate mock time slots for a given date
const generateMockTimeSlots = (date: Date | undefined, serviceDuration: number): string[] => {
  if (!date || serviceDuration <=0) return [];
  const slots: string[] = [];
  const dayOfWeek = date.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6

  // Example: closed on Sunday (if shop isn't configured to be open)
  // This should ideally come from shop.availability
  if (dayOfWeek === 0) return []; 

  let startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  // Adjust start time for Saturday
  if (dayOfWeek === 6) startHour = 10;


  let currentTime = new Date(date);
  currentTime.setHours(startHour, 0, 0, 0);

  const endTimeLimit = new Date(date);
  endTimeLimit.setHours(endHour, 0, 0, 0);
  
  while(currentTime < endTimeLimit) {
    const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
    if(slotEnd > endTimeLimit) break; // Ensure slot does not exceed shop hours

    // Skip lunch break e.g. 1 PM to 2 PM
    if (currentTime.getHours() === 13) { // 1 PM
        currentTime.setHours(14,0,0,0); // Resume at 2 PM
        if(currentTime >= endTimeLimit) break;
    }
    
    slots.push(format(currentTime, "HH:mm"));

    // Usually advance by service duration, but for simplicity, let's advance by fixed intervals for more options
    // For actual app, this should be more sophisticated based on barber availability and service duration
    const interval = Math.max(30, Math.ceil(serviceDuration / 30) * 15); // e.g., 30, 15 for shorter services
    currentTime.setMinutes(currentTime.getMinutes() + interval); 
  }
  return slots;
};


export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const shopId = params.shopId as string;
  const preselectedServiceId = searchParams.get("service");

  const [shop, setShop] = useState<Barbershop | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);


  useEffect(() => {
    if (shopId) {
      setIsLoading(true);
      // Fetch shop details
      const foundShop = mockShopsArray.find(s => s.id === shopId);
      setShop(foundShop || null);
      if (foundShop && preselectedServiceId) {
        const service = foundShop.services.find(s => s.id === preselectedServiceId);
        setSelectedService(service || null);
      }
      setIsLoading(false);
    }
  }, [shopId, preselectedServiceId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      const slots = generateMockTimeSlots(selectedDate, selectedService.durationMinutes);
      setAvailableTimeSlots(slots);
      setSelectedTime(undefined); 
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, selectedService]);

  const handleServiceChange = (serviceId: string) => {
    const service = shop?.services.find(s => s.id === serviceId);
    setSelectedService(service || null);
  };

  const handleBooking = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to book an appointment.", variant: "destructive" });
      router.push(`/login?redirect=/book/${shopId}${selectedService ? `?service=${selectedService.id}`: ''}`);
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({ title: "Missing Information", description: "Please select a service, date, and time.", variant: "destructive" });
      return;
    }

    setIsBooking(true);
    
    const newBooking: Booking = {
        id: `mock-${Date.now().toString()}`, // Ensure unique ID for mock data
        userId: user.uid,
        shopId: shop!.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        shopName: shop!.name, 
        startTime: new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`),
        endTime: new Date(new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`).getTime() + selectedService.durationMinutes * 60000),
        status: "confirmed", // Mocking as confirmed directly for simplicity now
        totalPrice: selectedService.price,
        createdAt: new Date(),
        shopLocation: shop!.location, 
        shopGoogleMapsLink: shop!.location.googleMapsLink, 
    };
    
    setTimeout(() => {
      // Add this booking to mockUserBookings in mock-data.ts
      mockUserBookings.push(newBooking);

      toast({ 
        title: "Booking Confirmed!", 
        description: `Your appointment for ${selectedService.name} at ${shop?.name} on ${format(selectedDate, "PPP")} at ${selectedTime} is confirmed. (Mocked)`,
        className: "bg-green-600 text-white",
      });
      setIsBooking(false);
      setBookingSuccess(true);
    }, 1500);
  };

  if (authLoading || isLoading) {
    return <div className="text-center py-10 text-lg font-medium">Loading booking details...</div>;
  }

  if (!shop) {
    return <div className="text-center py-10 text-lg font-medium">Shop not found.</div>;
  }
  
  if (bookingSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-lg mx-auto shadow-xl animate-in fade-in-50 zoom-in-95">
          <CardHeader className="text-center bg-green-600 text-primary-foreground rounded-t-lg py-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4"/>
              <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
              <p className="text-lg">Your appointment for <span className="font-semibold">{selectedService?.name}</span> at <span className="font-semibold">{shop.name}</span> has been successfully booked.</p>
              <p className="text-muted-foreground">Date: <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span></p>
              <p className="text-muted-foreground">Time: <span className="font-medium text-foreground">{selectedTime}</span></p>
              <Button onClick={() => router.push('/dashboard/user')} className="mt-6 w-full bg-primary hover:bg-primary/90">
                  View My Appointments
              </Button>
              <Button variant="outline" onClick={() => router.push('/shops')} className="mt-2 w-full">
                  Book Another Appointment
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = selectedService?.price || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Book an Appointment at {shop.name}</CardTitle>
          <CardDescription>Select your service, preferred date, and time.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="service" className="flex items-center mb-1 text-base"><Scissors className="mr-2 h-5 w-5 text-primary"/> Service</Label>
              <Select value={selectedService?.id} onValueChange={handleServiceChange}>
                <SelectTrigger id="service" className="text-base py-3">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {shop.services.map(service => (
                    <SelectItem key={service.id} value={service.id} className="text-base py-2">
                      {service.name} (${service.price.toFixed(2)}) - {service.durationMinutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <>
                <div>
                  <Label className="flex items-center mb-1 text-base"><CalendarDays className="mr-2 h-5 w-5 text-primary"/> Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border p-0"
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } 
                  />
                </div>

                {selectedDate && availableTimeSlots.length > 0 && (
                  <div>
                    <Label htmlFor="time" className="flex items-center mb-1 text-base"><Clock className="mr-2 h-5 w-5 text-primary"/> Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="time" className="text-base py-3">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map(slot => (
                          <SelectItem key={slot} value={slot} className="text-base py-2">{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                 {selectedDate && availableTimeSlots.length === 0 && selectedService && (
                    <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">No available slots for this service on the selected date. Please try another date or service.</p>
                 )}
              </>
            )}
          </div>

          {selectedService && selectedDate && selectedTime && (
            <Card className="bg-muted/50 p-6 rounded-lg">
              <CardTitle className="text-xl mb-4 border-b pb-2">Booking Summary</CardTitle>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shop:</span>
                  <span className="font-medium">{shop.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(selectedDate, "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{selectedService.durationMinutes} min</span>
                </div>
                <hr className="my-3 border-border"/>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Price:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleBooking} 
            disabled={!selectedService || !selectedDate || !selectedTime || isBooking} 
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
            size="lg"
          >
            {isBooking ? "Processing..." : "Confirm & Pay (Mock UPI)"}
          </Button>
        </CardFooter>
      </Card>
      {!user && !authLoading && (
        <Card className="mt-6 border-destructive bg-destructive/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to book an appointment.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push(`/login?redirect=/book/${shopId}${selectedService ? `?service=${selectedService.id}`: ''}`)} variant="destructive">
              Login or Sign Up
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

