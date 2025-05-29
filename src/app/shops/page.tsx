
"use client";

import { useState, useEffect, useCallback } from "react";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopFilters } from "@/components/shops/shop-filters";
import type { Barbershop, ParsedShopFilters } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Frown, Lightbulb, Info } from "lucide-react";
import { mockShopsArray } from "@/lib/mock-data";
import { searchShopsByNaturalLanguage, type NaturalLanguageSearchOutput } from "@/ai/flows/natural-language-shop-search-flow";
import { useToast } from "@/hooks/use-toast";

export default function ShopsPage() {
  const [allShops, setAllShops] = useState<Barbershop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAISearching, setIsAISearching] = useState(false);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [lastSearchType, setLastSearchType] = useState<'ai' | 'manual' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllShops(mockShopsArray);
      setFilteredShops(mockShopsArray);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const applyAIFilters = useCallback((shopsToFilter: Barbershop[], aiFilters: ParsedShopFilters): Barbershop[] => {
    let tempFilteredShops = [...shopsToFilter];

    if (aiFilters.serviceKeywords && aiFilters.serviceKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        aiFilters.serviceKeywords!.every(keyword =>
          shop.services.some(service => service.name.toLowerCase().includes(keyword.toLowerCase()) || (service.description && service.description.toLowerCase().includes(keyword.toLowerCase()))) ||
          (shop.description && shop.description.toLowerCase().includes(keyword.toLowerCase()))
        )
      );
    }

    if (aiFilters.locationKeywords && aiFilters.locationKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        aiFilters.locationKeywords!.every(keyword =>
          shop.location.address.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }
    
    if (aiFilters.price?.max) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price <= aiFilters.price!.max!)
      );
    }
    if (aiFilters.price?.min) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price >= aiFilters.price!.min!)
      );
    }
    if (aiFilters.price?.descriptor) {
      if (aiFilters.price.descriptor === 'cheap' || aiFilters.price.descriptor === 'under') {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$' || shop.services.some(s => s.price < 30));
      } else if (aiFilters.price.descriptor === 'expensive' || aiFilters.price.descriptor === 'over') {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$$$' || shop.services.some(s => s.price > 70));
      }
    }

    if (aiFilters.rating?.min) {
      tempFilteredShops = tempFilteredShops.filter(shop => shop.rating && shop.rating >= aiFilters.rating!.min!);
    }

    return tempFilteredShops;
  }, []);

  const applyManualFilters = useCallback((shopsToFilter: Barbershop[], manualQuery: string): Barbershop[] => {
    if (!manualQuery) {
      return shopsToFilter; // Return all shops if manual query is empty
    }
    const query = manualQuery.toLowerCase();
    return shopsToFilter.filter(shop =>
      shop.name.toLowerCase().includes(query) ||
      (shop.description && shop.description.toLowerCase().includes(query)) ||
      shop.location.address.toLowerCase().includes(query) ||
      shop.services.some(service =>
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query))
      )
    );
  }, []);

  const handleFilterChange = async (query: string, type: 'ai' | 'manual') => {
    setIsLoading(true);
    setAiSearchSummary(null);
    setLastSearchType(type);

    if (type === 'ai') {
      if (!query) { // If AI query is cleared
        setFilteredShops(allShops);
        setIsLoading(false);
        return;
      }
      setIsAISearching(true);
      try {
        const aiResult: NaturalLanguageSearchOutput = await searchShopsByNaturalLanguage({ query });
        if (aiResult.clarificationNeeded) {
          toast({ title: "Clarification Needed", description: aiResult.clarificationNeeded, variant: "default" });
          setFilteredShops(allShops);
          setAiSearchSummary(`AI needs more information: ${aiResult.clarificationNeeded}`);
        } else {
          const effectivelyFilteredShops = applyAIFilters(allShops, aiResult.parsedFilters);
          setFilteredShops(effectivelyFilteredShops);
          setAiSearchSummary(aiResult.searchSummary || "AI processed your search.");
          toast({ title: "AI Search Complete", description: aiResult.searchSummary || `Found ${effectivelyFilteredShops.length} shops.`, duration: 5000 });
        }
      } catch (error) {
        console.error("AI Search Error:", error);
        toast({ title: "AI Search Failed", description: (error as Error).message || "Could not process your search. Please try again.", variant: "destructive" });
        setFilteredShops(allShops);
      } finally {
        setIsAISearching(false);
      }
    } else if (type === 'manual') {
      setIsManualSearching(true);
      const manuallyFilteredShops = applyManualFilters(allShops, query);
      setFilteredShops(manuallyFilteredShops);
      setIsManualSearching(false);
      if (query) {
        toast({ title: "Manual Filter Applied", description: `Found ${manuallyFilteredShops.length} shops matching "${query}".` });
      } else {
        toast({ title: "Manual Filters Cleared", description: "Showing all shops." });
      }
    }
    setIsLoading(false);
  };

  const currentProcessingState = isAISearching || isManualSearching;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Find Your Next Style</h1>
      <ShopFilters 
        onFilterChange={handleFilterChange} 
        isProcessingAI={isAISearching} 
        isProcessingManual={isManualSearching}
      />

      {aiSearchSummary && lastSearchType === 'ai' && (
        <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-semibold">AI Search Assistant</AlertTitle>
          <AlertDescription className="text-primary/90">
            {aiSearchSummary}
          </AlertDescription>
        </Alert>
      )}
      
      {lastSearchType === 'manual' && !currentProcessingState && (
        <Alert variant="default" className="bg-accent/10 border-accent/30">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent font-semibold">Manual Search Results</AlertTitle>
          <AlertDescription className="text-accent/90">
            Showing results based on your keyword search. Use the AI search for more nuanced filtering.
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
            We couldn&apos;t find any barbershops matching your {lastSearchType === 'ai' ? 'AI-powered search' : 'keyword search'}. Try rephrasing or simplifying your query.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
