
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input"; // Added Input
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { BellRing, CalendarDays, Clock, Edit3 } from "lucide-react";
import { format } from "date-fns";

export default function RequestServicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [serviceDescription, setServiceDescription] = useState("");
  const [requestedDate, setRequestedDate] = useState<Date | undefined>(new Date());
  const [preferredTime, setPreferredTime] = useState<string>(""); // Changed to string for direct time input
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to submit a service request.", variant: "destructive" });
      router.push("/login?redirect=/request-service");
      return;
    }
    if (!serviceDescription || !requestedDate || !preferredTime) {
      toast({ title: "Missing Information", description: "Please describe the service, select a date, and preferred time.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    // In a real application, this data would be sent to a backend (e.g., Firestore)
    // to be broadcasted to shopkeepers.
    console.log("Mock Service Request:", {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userPhotoUrl: user.photoURL || undefined,
      serviceDescription,
      requestedDate: format(requestedDate, "yyyy-MM-dd"),
      preferredTime, // Will be a string like "14:30"
      notes,
      status: 'pending',
      createdAt: new Date(),
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Request Submitted (Mocked)",
      description: "Your service request has been broadcasted. Relevant shopkeepers will be notified and may contact you if they can fulfill your request.",
      className: "bg-green-600 text-white",
    });
    
    // Optionally reset form or redirect
    setServiceDescription("");
    setRequestedDate(new Date());
    setPreferredTime("");
    setNotes("");
    setIsSubmitting(false);
    // router.push('/dashboard/user'); // Or to a page confirming request
  };

  if (authLoading) {
    return <div className="text-center py-10 text-lg font-medium">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <BellRing className="mr-3 h-8 w-8 text-primary" /> Broadcast Service Request
          </CardTitle>
          <CardDescription>
            Can't find a specific slot or shop? Describe what you need, and let available shopkeepers respond to you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="serviceDescription" className="flex items-center mb-1 text-base">
                <Edit3 className="mr-2 h-5 w-5 text-primary" /> Service Needed
              </Label>
              <Textarea
                id="serviceDescription"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="e.g., Men's haircut and beard trim, looking for a skin fade."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="requestedDate" className="flex items-center mb-1 text-base">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" /> Preferred Date
              </Label>
              <Calendar
                mode="single"
                selected={requestedDate}
                onSelect={setRequestedDate}
                className="rounded-md border p-0"
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } 
              />
            </div>

            <div>
              <Label htmlFor="preferredTime" className="flex items-center mb-1 text-base">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Preferred Time
              </Label>
              <Input
                id="preferredTime"
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="text-base py-3"
                required
              />
               <p className="text-xs text-muted-foreground mt-1">
                Enter a specific time (e.g., 04:30 PM). Providing a specific time may limit responses.
              </p>
            </div>

            <div>
              <Label htmlFor="notes" className="flex items-center mb-1 text-base">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Prefer a senior stylist, need to be out by 4 PM."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || !serviceDescription || !requestedDate || !preferredTime} 
              className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
              size="lg"
            >
              {isSubmitting ? "Submitting Request..." : "Broadcast My Request"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
