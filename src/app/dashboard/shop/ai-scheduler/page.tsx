
"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Sparkles, Lightbulb, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AIScheduleInput, AIOptimalTimeSlotsInput } from "@/lib/types";
import { optimizeBarbershopEfficiency, suggestOptimalTimeSlots, type OptimizeBarbershopEfficiencyOutput, type SuggestOptimalTimeSlotsOutput } from "@/ai/flows"; // Assuming flows are exported correctly
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function AISchedulerPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State for Optimize Barbershop Efficiency
  const [efficiencyInput, setEfficiencyInput] = useState<AIScheduleInput>({
    historicalBookingData: "",
    availableTimeSlots: "",
    currentBookings: "",
  });
  const [efficiencyResult, setEfficiencyResult] = useState<OptimizeBarbershopEfficiencyOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // State for Suggest Optimal Time Slots
  const [suggestInput, setSuggestInput] = useState<AIOptimalTimeSlotsInput>({
    barbershopId: "", // Should be auto-filled if shop is linked to user
    serviceType: "",
    date: format(new Date(), "yyyy-MM-dd"),
    preferredTime: undefined,
  });
  const [suggestResult, setSuggestResult] = useState<SuggestOptimalTimeSlotsOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleEfficiencyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setEfficiencyInput({ ...efficiencyInput, [e.target.name]: e.target.value });
  };

  const handleSuggestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuggestInput({ ...suggestInput, [e.target.name]: e.target.value });
  };
  const handleSuggestSelectChange = (name: keyof AIOptimalTimeSlotsInput, value: string) => {
    setSuggestInput({ ...suggestInput, [name]: value });
  };


  const handleOptimizeEfficiency = async (e: FormEvent) => {
    e.preventDefault();
    setIsOptimizing(true);
    setEfficiencyResult(null);
    try {
      // Basic validation
      if (!efficiencyInput.historicalBookingData || !efficiencyInput.availableTimeSlots || !efficiencyInput.currentBookings) {
        toast({ title: "Missing Input", description: "Please provide all required data for efficiency optimization.", variant: "destructive" });
        setIsOptimizing(false);
        return;
      }
      const result = await optimizeBarbershopEfficiency(efficiencyInput);
      setEfficiencyResult(result);
      toast({ title: "Optimization Complete", description: "Recommendations generated." });
    } catch (error) {
      console.error("Error optimizing efficiency:", error);
      toast({ title: "Optimization Failed", description: (error as Error).message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSuggestTimeSlots = async (e: FormEvent) => {
    e.preventDefault();
    setIsSuggesting(true);
    setSuggestResult(null);
    try {
      // Basic validation
      if (!suggestInput.barbershopId || !suggestInput.serviceType || !suggestInput.date) {
        toast({ title: "Missing Input", description: "Please provide Barbershop ID, Service Type, and Date.", variant: "destructive" });
        setIsSuggesting(false);
        return;
      }
      const result = await suggestOptimalTimeSlots(suggestInput);
      setSuggestResult(result);
      toast({ title: "Suggestions Ready", description: "Optimal time slots have been suggested." });
    } catch (error) {
      console.error("Error suggesting time slots:", error);
      toast({ title: "Suggestion Failed", description: (error as Error).message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-10">Loading AI Scheduler...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10">Access denied. This tool is for shopkeepers.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Bot className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Scheduling Assistant</h1>
            <p className="text-muted-foreground">Leverage AI to optimize your barbershop's schedule and efficiency.</p>
        </div>
      </div>

      <Tabs defaultValue="optimizeEfficiency" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="optimizeEfficiency"><Sparkles className="mr-2 h-4 w-4 inline-block" />Optimize Efficiency</TabsTrigger>
          <TabsTrigger value="suggestSlots"><Lightbulb className="mr-2 h-4 w-4 inline-block" />Suggest Optimal Slots</TabsTrigger>
        </TabsList>

        {/* Optimize Barbershop Efficiency Tab */}
        <TabsContent value="optimizeEfficiency" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimize Barbershop Efficiency</CardTitle>
              <CardDescription>Provide historical data, available slots, and current bookings to get AI-powered recommendations for optimizing your schedule.</CardDescription>
            </CardHeader>
            <form onSubmit={handleOptimizeEfficiency}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="historicalBookingData">Historical Booking Data (JSON format)</Label>
                  <Textarea id="historicalBookingData" name="historicalBookingData" value={efficiencyInput.historicalBookingData} onChange={handleEfficiencyInputChange} placeholder='e.g., [{"date":"2023-01-01", "time":"10:00", "service":"Haircut", "barber":"John"}]' rows={5} />
                  <p className="text-xs text-muted-foreground mt-1">Paste a JSON array of past booking objects.</p>
                </div>
                <div>
                  <Label htmlFor="availableTimeSlots">Available Time Slots (JSON format)</Label>
                  <Textarea id="availableTimeSlots" name="availableTimeSlots" value={efficiencyInput.availableTimeSlots} onChange={handleEfficiencyInputChange} placeholder='e.g., [{"date":"2023-02-01", "startTime":"09:00", "endTime":"17:00"}]' rows={5} />
                  <p className="text-xs text-muted-foreground mt-1">Paste a JSON array of available slot objects.</p>
                </div>
                <div>
                  <Label htmlFor="currentBookings">Current Bookings (JSON format)</Label>
                  <Textarea id="currentBookings" name="currentBookings" value={efficiencyInput.currentBookings} onChange={handleEfficiencyInputChange} placeholder='e.g., [{"date":"2023-02-01", "time":"14:00", "service":"Beard Trim", "barber":"Jane"}]' rows={5} />
                   <p className="text-xs text-muted-foreground mt-1">Paste a JSON array of current booking objects.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isOptimizing}>
                  {isOptimizing ? "Optimizing..." : <><Sparkles className="mr-2 h-4 w-4"/>Get Recommendations</>}
                </Button>
              </CardFooter>
            </form>
            {efficiencyResult && (
              <Card className="mt-6 bg-muted/50">
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Recommended Time Slots:</h4>
                    <pre className="mt-1 p-3 bg-background rounded-md text-sm overflow-x-auto">{efficiencyResult.recommendedTimeSlots}</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold">Reasoning:</h4>
                    <p className="mt-1 text-sm">{efficiencyResult.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Card>
        </TabsContent>

        {/* Suggest Optimal Time Slots Tab */}
        <TabsContent value="suggestSlots" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Suggest Optimal Time Slots</CardTitle>
              <CardDescription>Get AI suggestions for the best time slots for a new appointment based on service type and date.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSuggestTimeSlots}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="barbershopId">Barbershop ID</Label>
                  <Input id="barbershopId" name="barbershopId" value={suggestInput.barbershopId} onChange={handleSuggestInputChange} placeholder="Your barbershop's unique ID" />
                  <p className="text-xs text-muted-foreground mt-1">This would typically be your shop's ID from our system.</p>
                </div>
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input id="serviceType" name="serviceType" value={suggestInput.serviceType} onChange={handleSuggestInputChange} placeholder="e.g., Haircut, Beard Trim" />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={suggestInput.date} onChange={handleSuggestInputChange} />
                </div>
                <div>
                  <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                   <Select name="preferredTime" onValueChange={(value) => handleSuggestSelectChange('preferredTime', value)} value={suggestInput.preferredTime}>
                        <SelectTrigger id="preferredTime">
                            <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="any">Any Time</SelectItem>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSuggesting}>
                  {isSuggesting ? "Suggesting..." : <><Lightbulb className="mr-2 h-4 w-4"/>Suggest Slots</>}
                </Button>
              </CardFooter>
            </form>
            {suggestResult && (
              <Card className="mt-6 bg-muted/50">
                <CardHeader>
                  <CardTitle>Suggested Time Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Optimal Slots:</h4>
                    {suggestResult.optimalTimeSlots.length > 0 ? (
                        <ul className="list-disc list-inside mt-1">
                        {suggestResult.optimalTimeSlots.map((slot, index) => (
                            <li key={index} className="text-sm">{slot}</li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No specific optimal slots found based on current data.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">Reasoning:</h4>
                    <p className="mt-1 text-sm">{suggestResult.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Card>
        </TabsContent>
      </Tabs>
       <Card className="mt-8 border-amber-500 bg-amber-50">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <CardTitle className="text-amber-700">Important Note on AI Tools</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700 text-sm">
          <p>The AI scheduling tools provide suggestions based on the data you input. The quality of recommendations depends heavily on the accuracy and completeness of this data.</p>
          <p className="mt-2">For the "Optimize Efficiency" tool, ensure your JSON data strictly follows the expected format of arrays of objects with specific keys (e.g., <code>date</code>, <code>time</code>, <code>service</code>, <code>barber</code> for bookings; <code>date</code>, <code>startTime</code>, <code>endTime</code> for available slots).</p>
          <p className="mt-2">These tools are for guidance and should be used in conjunction with your professional judgment.</p>
        </CardContent>
      </Card>
    </div>
  );
}

