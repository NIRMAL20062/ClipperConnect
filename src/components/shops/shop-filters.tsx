
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Sparkles } from "lucide-react"; // Changed icon
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ShopFiltersProps {
  onFilterChange: (filters: { naturalQuery: string } | any, isNaturalQuery: boolean) => void; 
  isProcessingAI?: boolean;
}

export function ShopFilters({ onFilterChange, isProcessingAI }: ShopFiltersProps) {
  const [naturalQuery, setNaturalQuery] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (naturalQuery.trim()) {
      onFilterChange({ naturalQuery: naturalQuery.trim() }, true);
    } else {
      // If natural query is empty, could revert to showing all or a default set
      // For now, let's just signal an empty filter if desired.
      // Or, you might want to disable the button if input is empty.
      onFilterChange({}, false); // Or pass some default filters
    }
  };

  return (
    <Card className="mb-8 p-4 md:p-6 shadow-md">
      <CardHeader className="p-0 pb-4 mb-4 border-b">
        <CardTitle className="text-2xl flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary"/> Smart Search
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <Label htmlFor="naturalQuery" className="text-sm font-medium">
              Tell us what you&apos;re looking for...
            </Label>
            <Input 
              id="naturalQuery" 
              name="naturalQuery" 
              placeholder="e.g., 'cheap haircut in downtown today after 5 PM'" 
              className="mt-1 text-base py-3" 
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              disabled={isProcessingAI}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Try searching by service, location, price, time, or features like "kid-friendly".
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isProcessingAI || !naturalQuery.trim()}
            >
              {isProcessingAI ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Processing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Search with AI
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
