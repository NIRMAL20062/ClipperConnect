
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Sparkles, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

interface ShopFiltersProps {
  onFilterChange: (query: string, type: 'ai' | 'manual') => void;
  isProcessingAI?: boolean;
  isProcessingManual?: boolean; // Added for manual search loading state
}

export function ShopFilters({ onFilterChange, isProcessingAI, isProcessingManual }: ShopFiltersProps) {
  const [naturalQuery, setNaturalQuery] = useState("");
  const [manualQuery, setManualQuery] = useState("");

  const handleAISearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (naturalQuery.trim()) {
      onFilterChange(naturalQuery.trim(), 'ai');
    } else {
      onFilterChange("", 'ai'); // Clear AI filters if query is empty
    }
  };

  const handleManualSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Allow submitting empty manual query to reset manual filters
    onFilterChange(manualQuery.trim(), 'manual');
  };

  return (
    <Card className="mb-8 p-4 md:p-6 shadow-md">
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Smart Search Section */}
        <div>
          <CardHeader className="p-0 pb-3 mb-3 border-b">
            <CardTitle className="text-xl flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" /> AI Smart Search
            </CardTitle>
            <CardDescription className="text-xs">Describe what you're looking for (e.g., "cheap haircut downtown today").</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleAISearchSubmit} className="space-y-3">
              <div>
                <Label htmlFor="naturalQuery" className="sr-only">
                  AI Search Query
                </Label>
                <Input
                  id="naturalQuery"
                  name="naturalQuery"
                  placeholder="e.g., 'affordable fade near Main St'"
                  className="text-base py-3"
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                  disabled={isProcessingAI || isProcessingManual}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isProcessingAI || isProcessingManual || !naturalQuery.trim()}
              >
                {isProcessingAI ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Processing AI...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Search with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </div>

        {/* Manual Keyword Search Section */}
        <div>
          <CardHeader className="p-0 pb-3 mb-3 border-b">
            <CardTitle className="text-xl flex items-center">
              <Filter className="mr-2 h-5 w-5 text-accent" /> Manual Filters
            </CardTitle>
             <CardDescription className="text-xs">Search by keywords like shop name or service type.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleManualSearchSubmit} className="space-y-3">
              <div>
                <Label htmlFor="manualQuery" className="sr-only">
                  Manual Keyword Search
                </Label>
                <Input
                  id="manualQuery"
                  name="manualQuery"
                  placeholder="e.g., Gentleman's Choice, beard trim"
                  className="text-base py-3"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  disabled={isProcessingAI || isProcessingManual}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent/10"
                disabled={isProcessingAI || isProcessingManual}
              >
                {isProcessingManual ? (
                  <>
                    <Filter className="mr-2 h-4 w-4 animate-pulse" /> Filtering...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" /> Apply Filters
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
