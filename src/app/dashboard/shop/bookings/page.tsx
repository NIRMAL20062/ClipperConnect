
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, CalendarDays, User, MoreHorizontal, AlertTriangle, PackageSearch } from "lucide-react";
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
import { mockShopBookingsForShopkeeper, mockShopkeeperOwnedShopId } from "@/lib/mock-data"; // Use centralized mock data

export default function ManageBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [dialogState, setDialogState] = useState<{ open: boolean; bookingId: string | null; action: 'confirm' | 'cancel' | null }>({ open: false, bookingId: null, action: null });

  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      setIsLoadingBookings(true);
      // MOCK: Filter bookings for the shop owned by this shopkeeper
      // In a real app, this would be a Firestore query: where("shopId", "==", user.ownedShopId)
      const shopBookings = mockShopBookingsForShopkeeper.filter(b => b.shopId === mockShopkeeperOwnedShopId);
      shopBookings.sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
      setBookings(shopBookings);
      setIsLoadingBookings(false);
    }
  }, [user]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status'], reason?: string) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: newStatus, cancellationReason: newStatus.includes('cancel') ? reason || "Cancelled by shop" : undefined } : b
    ));
    toast({ title: "Booking Updated", description: `Booking ${bookingId} status set to ${newStatus}. (Mocked)` });
    setDialogState({ open: false, bookingId: null, action: null });
  };
  
  const openDialog = (bookingId: string, action: 'confirm' | 'cancel') => {
    setDialogState({ open: true, bookingId, action });
  };


  if (authLoading || isLoadingBookings) {
    return <div className="text-center py-10 text-lg">Loading bookings...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10 text-lg">Access denied. This page is for shopkeepers.</div>;
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "confirmed") return b.status === "confirmed" && b.startTime > new Date(); 
    if (activeTab === "history") return b.status === "completed" || b.status.includes("cancel") || (b.status === "confirmed" && b.startTime <= new Date());
    return true;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
      
      <Tabs defaultValue="pending" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="mr-2 h-4 w-4 inline-block"/>Pending ({bookings.filter(b=>b.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="confirmed"><CalendarDays className="mr-2 h-4 w-4 inline-block"/>Confirmed & Upcoming ({bookings.filter(b=>b.status === 'confirmed' && b.startTime > new Date()).length})</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4 inline-block"/>History & Cancelled</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4 shadow-md">
          <CardContent className="pt-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                <PackageSearch className="h-16 w-16 mb-4 text-gray-400"/>
                <p className="text-xl font-medium">No bookings in this category.</p>
                <p className="text-sm">When new bookings arrive or statuses change, they will appear here.</p>
              </div>
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
                    <TableRow key={booking.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{booking.userName || "N/A"}</TableCell>
                      <TableCell>{booking.serviceName}</TableCell>
                      <TableCell>
                        {format(booking.startTime, "MMM d, yyyy 'at' p")}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status.includes('cancel') ? 'bg-red-100 text-red-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'}`}>
                          {booking.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${booking.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {booking.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Booking Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDialog(booking.id, 'confirm')} className="cursor-pointer">
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog(booking.id, 'cancel')} className="text-red-600 focus:text-red-600 cursor-pointer">
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                         {booking.status === "confirmed" && booking.startTime > new Date() && (
                           <Button variant="outline" size="sm" onClick={() => openDialog(booking.id, 'cancel')} className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700">
                             <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
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
              {dialogState.action === 'confirm' && `Are you sure you want to confirm booking ID ${dialogState.bookingId}? The client will be notified.`}
              {dialogState.action === 'cancel' && `Are you sure you want to ${bookings.find(b => b.id === dialogState.bookingId)?.status === 'pending' ? 'reject' : 'cancel'} booking ID ${dialogState.bookingId}? This action cannot be undone and the client will be notified.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogState({ open: false, bookingId: null, action: null })}>Dismiss</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (dialogState.bookingId && dialogState.action) {
                  const reason = dialogState.action === 'cancel' ? prompt(`Enter reason for ${bookings.find(b => b.id === dialogState.bookingId)?.status === 'pending' ? 'rejection' : 'cancellation'} (optional):`) : undefined;
                  handleUpdateBookingStatus(dialogState.bookingId, dialogState.action === 'confirm' ? 'confirmed' : 'cancelled_by_shop', reason || undefined);
                }
              }}
              className={dialogState.action === 'cancel' ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            >
              Yes, {dialogState.action === 'confirm' ? 'Confirm' : (bookings.find(b => b.id === dialogState.bookingId)?.status === 'pending' ? 'Reject Booking' : 'Cancel Booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
