
"use client";

import { useState, useEffect, useCallback } from "react";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopFilters } from "@/components/shops/shop-filters";
import type { Barbershop, ParsedShopFilters, CombinedShopSearchCriteria } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Added CardContent, CardHeader
import { Button } from "@/components/ui/button"; // Added Button
import { Frown, Lightbulb, Info, Send } from "lucide-react"; // Added Send
import { mockShopsArray } from "@/lib/mock-data";
import { searchShopsByNaturalLanguage, type NaturalLanguageSearchOutput } from "@/ai/flows/natural-language-shop-search-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link"; // Added Link

export default function ShopsPage() {
  const [allShops, setAllShops] = useState<Barbershop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAISearching, setIsAISearching] = useState(false);
  const [isManualFiltering, setIsManualFiltering] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [lastSearchType, setLastSearchType] = useState<'ai' | 'manual' | null>(null);
  const { toast } = useToast();

  const [uniqueServices, setUniqueServices] = useState<string[]>([]);
  const [priceRanges, setPriceRanges] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllShops(mockShopsArray);
      setFilteredShops(mockShopsArray);

      // Extract unique services and price ranges for filters
      const services = new Set<string>();
      const prices = new Set<string>();
      mockShopsArray.forEach(shop => {
        shop.services.forEach(service => services.add(service.name));
        if (shop.priceRange) prices.add(shop.priceRange);
      });
      setUniqueServices(Array.from(services).sort());
      setPriceRanges(Array.from(prices).sort((a,b) => a.length - b.length)); // Sort $, $$, $$$

      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const applyFilters = useCallback((shopsToFilter: Barbershop[], criteria: ParsedShopFilters & { manualService?: string; manualRating?: number; manualPriceRange?: string }): Barbershop[] => {
    let tempFilteredShops = [...shopsToFilter];

    // Apply AI-parsed filters first
    if (criteria.serviceKeywords && criteria.serviceKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        criteria.serviceKeywords!.some(keyword => // Changed to some for broader match
          shop.services.some(service => service.name.toLowerCase().includes(keyword.toLowerCase()) || (service.description && service.description.toLowerCase().includes(keyword.toLowerCase()))) ||
          (shop.description && shop.description.toLowerCase().includes(keyword.toLowerCase()))
        )
      );
    }

    if (criteria.locationKeywords && criteria.locationKeywords.length > 0) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        criteria.locationKeywords!.some(keyword => // Changed to some
          shop.location.address.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }
    
    if (criteria.price?.max) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price <= criteria.price!.max!)
      );
    }
    if (criteria.price?.min) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.price >= criteria.price!.min!)
      );
    }
    if (criteria.price?.descriptor && !criteria.manualPriceRange) { // Only apply AI price descriptor if manual not set
      if (criteria.price.descriptor === 'cheap' || criteria.price.descriptor === 'under') {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$' || shop.services.some(s => s.price < 30));
      } else if (criteria.price.descriptor === 'expensive' || criteria.price.descriptor === 'over') {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === '$$$' || shop.services.some(s => s.price > 70));
      }
    }

    if (criteria.rating?.min && !criteria.manualRating) { // Only apply AI rating if manual not set
      tempFilteredShops = tempFilteredShops.filter(shop => shop.rating && shop.rating >= criteria.rating!.min!);
    }

    // Apply manual overrides / specific filters
    if (criteria.manualService) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.services.some(s => s.name === criteria.manualService)
      );
    }
    if (criteria.manualRating) {
      tempFilteredShops = tempFilteredShops.filter(shop => shop.rating && shop.rating >= criteria.manualRating!);
    }
    if (criteria.manualPriceRange) {
      tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === criteria.manualPriceRange);
    }

    return tempFilteredShops;
  }, []);


  const handleFilterChange = async (criteria: CombinedShopSearchCriteria) => {
    setIsLoading(true);
    setAiSearchSummary(null);
    setIsAISearching(!!criteria.aiQuery);
    setIsManualFiltering(!!(criteria.manualService || criteria.manualRating || criteria.manualPriceRange));

    let finalFilters: ParsedShopFilters & { manualService?: string; manualRating?: number; manualPriceRange?: string } = {
      manualService: criteria.manualService,
      manualRating: criteria.manualRating,
      manualPriceRange: criteria.manualPriceRange,
    };
    
    let summaryForToast = "Filters applied.";
    let effectiveSearchType: 'ai' | 'manual' = 'manual';


    if (criteria.aiQuery) {
      effectiveSearchType = 'ai';
      try {
        const aiResult: NaturalLanguageSearchOutput = await searchShopsByNaturalLanguage({ query: criteria.aiQuery });
        if (aiResult.clarificationNeeded) {
          toast({ title: "Clarification Needed", description: aiResult.clarificationNeeded, variant: "default" });
          setFilteredShops(allShops); // Show all if clarification needed
          setAiSearchSummary(`AI needs more information: ${aiResult.clarificationNeeded}`);
          summaryForToast = `AI needs more information: ${aiResult.clarificationNeeded}`;
        } else {
          finalFilters = { ...finalFilters, ...aiResult.parsedFilters };
          setAiSearchSummary(aiResult.searchSummary || "AI processed your search.");
          summaryForToast = aiResult.searchSummary || "AI search complete.";
        }
      } catch (error) {
        console.error("AI Search Error:", error);
        toast({ title: "AI Search Failed", description: (error as Error).message || "Could not process your search. Please try again.", variant: "destructive" });
        finalFilters = { ...finalFilters, ...({} as ParsedShopFilters) }; // Reset AI part of filters on error
        summaryForToast = "AI Search Failed.";
      }
    }
    
    setLastSearchType(effectiveSearchType);
    const effectivelyFilteredShops = applyFilters(allShops, finalFilters);
    setFilteredShops(effectivelyFilteredShops);

    if (criteria.manualService || criteria.manualRating || criteria.manualPriceRange) {
      if (criteria.aiQuery && aiSearchSummary && !aiSearchSummary.includes("AI needs more information")) {
        setAiSearchSummary(prev => `${prev} Refined by manual selections.`);
        summaryForToast = `AI search refined. Found ${effectivelyFilteredShops.length} shops.`;
      } else if (!criteria.aiQuery) {
         summaryForToast = `Manual filters applied. Found ${effectivelyFilteredShops.length} shops.`;
      }
    } else if (criteria.aiQuery && !aiSearchSummary?.includes("AI needs more information")) {
       summaryForToast = `${aiSearchSummary} Found ${effectivelyFilteredShops.length} shops.`;
    }


    toast({ title: "Search Complete", description: summaryForToast, duration: 5000 });
    setIsLoading(false);
    setIsAISearching(false);
    setIsManualFiltering(false);
  };

  const currentProcessingState = isAISearching || isManualFiltering;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-center md:text-left">Find Your Next Style</h1>

      {/* Prominent CTA for Broadcast Request */}
      <Card className="bg-primary/10 border-primary/30 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Send className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold text-primary">Need a Service ASAP or Can't Find a Slot?</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-base">
            No time to browse? Describe the service you need, and let available shopkeepers respond to you directly.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/request-service">
              Broadcast My Request Now
            </Link>
          </Button>
        </CardContent>
      </Card>

      <ShopFilters 
        onFilterChange={handleFilterChange} 
        isProcessing={currentProcessingState}
        availableServices={uniqueServices}
        availablePriceRanges={priceRanges}
      />

      {aiSearchSummary && lastSearchType === 'ai' && (
        <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary-foreground">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-semibold">AI Search Assistant</AlertTitle>
          <AlertDescription className="text-primary/90">
            {aiSearchSummary}
          </AlertDescription>
        </Alert>
      )}
      
      {lastSearchType === 'manual' && !currentProcessingState && !aiSearchSummary && (
        <Alert variant="default" className="bg-accent/5 border-accent/20">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent font-semibold">Manual Filter Results</AlertTitle>
          <AlertDescription className="text-accent/90">
            Showing results based on your selected filters.
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
            We couldn&apos;t find any barbershops matching your criteria. Try adjusting your AI query or manual filters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

