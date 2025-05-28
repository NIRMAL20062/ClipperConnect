
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, CheckCircle, User, MessageSquare, PackageSearch, ListChecks } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { mockServiceRequests } from "@/lib/mock-data"; // Using centralized mock data

export default function OpenServiceRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      setIsLoadingRequests(true);
      // MOCK: Simulate fetching open service requests.
      // In a real app, this would be a Firestore query with real-time updates.
      // For now, we use a copy of mockServiceRequests and allow "accepting" them.
      const initialRequests = mockServiceRequests.map(req => ({ ...req, status: 'pending' as const }));
      setRequests(initialRequests);
      setIsLoadingRequests(false);
    }
  }, [user]);

  const handleAcceptRequest = (requestId: string) => {
    // MOCK: Simulate accepting a request
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' as const, acceptedByShopId: user?.uid, acceptedByShopName: "Your Shop (Mock)" } : req
      )
    );
    toast({
      title: "Request Accepted (Mock)",
      description: `You have accepted request ${requestId}. The customer would be notified.`,
      className: "bg-green-600 text-white",
    });
    // In a real app:
    // 1. Update Firestore document for this request (status, acceptedByShopId, etc.)
    // 2. Send a notification to the customer (e.g., via FCM or an in-app notification system)
    // 3. Potentially create a pending/confirmed booking based on this acceptance.
  };

  if (authLoading || isLoadingRequests) {
    return <div className="text-center py-10 text-lg">Loading open service requests...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10 text-lg">Access denied. This page is for shopkeepers.</div>;
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ListChecks className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Open Service Requests</h1>
            <p className="text-muted-foreground">View and respond to general service requests broadcasted by customers.</p>
        </div>
      </div>
      
      {pendingRequests.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground flex flex-col items-center">
            <PackageSearch className="h-20 w-20 mb-6 text-gray-400"/>
            <p className="text-xl font-medium mb-2">No Open Requests Currently</p>
            <p className="text-sm">When customers broadcast service requests, they will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map(request => (
            <Card key={request.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={request.userPhotoUrl} alt={request.userName} />
                        <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{request.userName}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Requested {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <CardDescription className="font-semibold text-base text-foreground">{request.serviceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                  <span>Date: {format(request.requestedDate, "PPP")}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span>Time: {request.preferredTime.charAt(0).toUpperCase() + request.preferredTime.slice(1)}</span>
                </div>
                {request.notes && (
                  <div className="flex items-start pt-1">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground italic text-xs">Notes: {request.notes}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={request.status !== 'pending'}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> 
                  {request.status === 'pending' ? "Accept Request (Mock)" : "Request Accepted"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
