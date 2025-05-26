
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, CalendarDays, User, MoreHorizontal, AlertTriangle } from "lucide-react";
import type { Booking } from "@/lib/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mock data - replace with actual Firestore fetching
const mockShopBookings: Booking[] = [
  {
    id: "booking101",
    userId: "userA",
    userName: "Alice Smith", // Denormalized for display
    shopId: "1", // Assuming this is the current shopkeeper's shop
    serviceId: "s1",
    serviceName: "Classic Haircut",
    startTime: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() + 45 * 60000),
    status: "pending",
    totalPrice: 30,
    createdAt: new Date(),
  },
  {
    id: "booking102",
    userId: "userB",
    userName: "Bob Johnson",
    shopId: "1",
    serviceId: "s2",
    serviceName: "Beard Trim & Shape",
    startTime: new Date(new Date().setDate(new Date().getDate() + 2)),
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).getTime() + 25 * 60000),
    status: "confirmed",
    totalPrice: 20,
    createdAt: new Date(),
  },
  {
    id: "booking103",
    userId: "userC",
    userName: "Carol White",
    shopId: "1",
    serviceId: "s1",
    serviceName: "Classic Haircut",
    startTime: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).getTime() + 45 * 60000),
    status: "completed",
    totalPrice: 30,
    createdAt: new Date(),
  },
    {
    id: "booking104",
    userId: "userD",
    userName: "David Green",
    shopId: "1",
    serviceId: "s11",
    serviceName: "Hot Towel Shave",
    startTime: new Date(new Date().setDate(new Date().getDate() + 3)),
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).getTime() + 40 * 60000),
    status: "pending",
    totalPrice: 35,
    createdAt: new Date(),
  },
];

export default function ManageBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
   const [dialogState, setDialogState] = useState<{ open: boolean; bookingId: string | null; action: 'confirm' | 'cancel' | null }>({ open: false, bookingId: null, action: null });


  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      // Fetch bookings for this shop from Firestore
      // MOCK:
      setIsLoadingBookings(true);
      // Add userName to mock data
      const shopBookings = mockShopBookings.map(b => ({ ...b, userName: b.userName || `User ${b.userId.substring(0,4)}` }));
      // Sort by start time
      shopBookings.sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
      setBookings(shopBookings);
      setIsLoadingBookings(false);
    }
  }, [user]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status'], reason?: string) => {
    // Mock update
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: newStatus, cancellationReason: reason } : b
    ));
    toast({ title: "Booking Updated", description: `Booking ${bookingId} status set to ${newStatus}. (Mocked)` });
    setDialogState({ open: false, bookingId: null, action: null });
  };
  
  const openDialog = (bookingId: string, action: 'confirm' | 'cancel') => {
    setDialogState({ open: true, bookingId, action });
  };


  if (authLoading || isLoadingBookings) {
    return <div className="text-center py-10">Loading bookings...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10">Access denied.</div>;
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "confirmed") return b.status === "confirmed" && b.startTime > new Date(); // Upcoming confirmed
    if (activeTab === "history") return b.status === "completed" || b.status.includes("cancel") || (b.status === "confirmed" && b.startTime <= new Date());
    return true;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
      
      <Tabs defaultValue="pending" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="mr-2 h-4 w-4 inline-block"/>Pending</TabsTrigger>
          <TabsTrigger value="confirmed"><CalendarDays className="mr-2 h-4 w-4 inline-block"/>Confirmed & Upcoming</TabsTrigger>
          <TabsTrigger value="history"><User className="mr-2 h-4 w-4 inline-block"/>History & Cancelled</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <CardContent className="pt-6">
            {filteredBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings in this category.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.userName || "N/A"}</TableCell>
                      <TableCell>{booking.serviceName}</TableCell>
                      <TableCell>
                        {format(booking.startTime, "MMM d, yyyy 'at' p")}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status.includes('cancel') ? 'bg-red-100 text-red-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'}`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${booking.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {booking.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDialog(booking.id, 'confirm')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog(booking.id, 'cancel')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                         {booking.status === "confirmed" && booking.startTime > new Date() && (
                           <Button variant="outline" size="sm" onClick={() => openDialog(booking.id, 'cancel')}>
                             <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancel Booking
                           </Button>
                         )}
                         {(booking.status === "completed" || booking.status.includes("cancel") || (booking.status === "confirmed" && booking.startTime <= new Date())) && (
                            <span className="text-xs text-muted-foreground italic">No actions</span>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
      
      <AlertDialog open={dialogState.open} onOpenChange={(open) => !open && setDialogState({ open: false, bookingId: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6 text-yellow-500"/>
                Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === 'confirm' && `Are you sure you want to confirm booking ID ${dialogState.bookingId}?`}
              {dialogState.action === 'cancel' && `Are you sure you want to ${bookings.find(b => b.id === dialogState.bookingId)?.status === 'pending' ? 'reject' : 'cancel'} booking ID ${dialogState.bookingId}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogState({ open: false, bookingId: null, action: null })}>Dismiss</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (dialogState.bookingId && dialogState.action) {
                  handleUpdateBookingStatus(dialogState.bookingId, dialogState.action === 'confirm' ? 'confirmed' : 'cancelled_by_shop');
                }
              }}
              className={dialogState.action === 'cancel' ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Yes, {dialogState.action === 'confirm' ? 'Confirm' : (bookings.find(b => b.id === dialogState.bookingId)?.status === 'pending' ? 'Reject' : 'Cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

