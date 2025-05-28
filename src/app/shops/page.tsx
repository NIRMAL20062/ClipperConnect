
"use client";

import { useState, useEffect, useCallback } from "react";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopFilters } from "@/components/shops/shop-filters";
import type { Barbershop, ParsedShopFilters } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card"; // Ensure Card is imported
import { Frown, Lightbulb } from "lucide-react";
import { mockShopsArray } from "@/lib/mock-data";
import { searchShopsByNaturalLanguage, type NaturalLanguageSearchOutput } from "@/ai/flows/natural-language-shop-search-flow";
import { useToast } from "@/hooks/use-toast";

export default function ShopsPage() {
  const [allShops, setAllShops] = useState<Barbershop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching all shops initially
    const timer = setTimeout(() => {
      setAllShops(mockShopsArray);
      setFilteredShops(mockShopsArray); // Initially show all shops
      setIsLoading(false);
    }, 500); // Reduced initial load time
    return () => clearTimeout(timer);
  }, []);

  const applyFilters = useCallback((shopsToFilter: Barbershop[], aiFilters: ParsedShopFilters): Barbershop[] => {
    let tempFilteredShops = [...shopsToFilter];

    // Service Keywords (simple "AND" match for all keywords for now)
    if (aiFilters.serviceKeywords && aiFilters.serviceKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        aiFilters.serviceKeywords!.every(keyword =>
          shop.services.some(service => service.name.toLowerCase().includes(keyword.toLowerCase()) || (service.description && service.description.toLowerCase().includes(keyword.toLowerCase()))) ||
          (shop.description && shop.description.toLowerCase().includes(keyword.toLowerCase()))
        )
      );
    }

    // Location Keywords (simple "AND" match)
    if (aiFilters.locationKeywords && aiFilters.locationKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        aiFilters.locationKeywords!.every(keyword =>
          shop.location.address.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    // Price Max
    if (aiFilters.price?.max) {
      // This needs a way to map shop.priceRange ('$', '$$', '$$$') to numerical values or for AI to understand these symbols.
      // Simple mock: '$' <= 30, '$$' <= 60, '$$$' > 60. AI more likely to return numbers.
      // For now, if AI gives a max price, we'll assume services' actual prices are checked.
      // This part would be more complex with real price range data.
      // Example: only show shops that have at least one service under the max price.
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price <= aiFilters.price!.max!)
      );
    }
     // Price Min
    if (aiFilters.price?.min) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price >= aiFilters.price!.min!)
      );
    }
    // Price Descriptor (cheap/expensive) - very subjective, requires more sophisticated mapping
    if (aiFilters.price?.descriptor) {
        if (aiFilters.price.descriptor === 'cheap' || aiFilters.price.descriptor === 'under') {
            tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$' || shop.services.some(s => s.price < 30));
        } else if (aiFilters.price.descriptor === 'expensive' || aiFilters.price.descriptor === 'over') {
             tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$$$' || shop.services.some(s => s.price > 70));
        }
    }


    // Rating Min
    if (aiFilters.rating?.min) {
      tempFilteredShops = tempFilteredShops.filter(shop => shop.rating && shop.rating >= aiFilters.rating!.min!);
    }
    
    // Date/Time and OpenNow - Complex without real-time availability data.
    // For this prototype, these are harder to implement meaningfully against mock data.
    // A real app would query based on shop opening hours and potentially live availability.
    // If `aiFilters.openNow` is true, one might filter by current day's availability and current time.

    return tempFilteredShops;
  }, []);


  const handleFilterChange = async (filters: { naturalQuery: string } | any, isNaturalQuery: boolean) => {
    setIsLoading(true);
    setAiSearchSummary(null);

    if (isNaturalQuery && filters.naturalQuery) {
      setIsAISearching(true);
      try {
        const aiResult: NaturalLanguageSearchOutput = await searchShopsByNaturalLanguage({ query: filters.naturalQuery });
        
        if (aiResult.clarificationNeeded) {
          toast({ title: "Clarification Needed", description: aiResult.clarificationNeeded, variant: "default" });
          setFilteredShops(allShops); // Show all shops or previous results if AI needs more info
          setAiSearchSummary(`AI needs more information: ${aiResult.clarificationNeeded}`);
        } else {
          const effectivelyFilteredShops = applyFilters(allShops, aiResult.parsedFilters);
          setFilteredShops(effectivelyFilteredShops);
          setAiSearchSummary(aiResult.searchSummary || "AI processed your search.");
          toast({ title: "AI Search Complete", description: aiResult.searchSummary || `Found ${effectivelyFilteredShops.length} shops matching your query.`, duration: 5000 });
        }
      } catch (error) {
        console.error("AI Search Error:", error);
        toast({ title: "AI Search Failed", description: "Could not process your search with AI. Please try a simpler query or check console.", variant: "destructive" });
        setFilteredShops(allShops); // Fallback to showing all shops
      } finally {
        setIsAISearching(false);
      }
    } else {
      // Handle traditional/empty filters if necessary, or just show all if query is cleared
      setFilteredShops(allShops); 
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Find Your Next Style</h1>
      <ShopFilters onFilterChange={handleFilterChange} isProcessingAI={isAISearching} />

      {aiSearchSummary && (
        <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-semibold">AI Search Assistant</AlertTitle>
          <AlertDescription className="text-primary/90">
            {aiSearchSummary}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredShops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <Alert variant="default" className="bg-card">
          <Frown className="h-5 w-5 text-muted-foreground" />
          <AlertTitle>No Shops Found</AlertTitle>
          <AlertDescription>
            We couldn&apos;t find any barbershops matching your AI-powered search. Try rephrasing or simplifying your query.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
