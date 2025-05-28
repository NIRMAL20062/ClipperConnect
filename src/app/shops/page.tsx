
"use client";

import { useState, useEffect } from "react";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopFilters } from "@/components/shops/shop-filters";
import type { Barbershop } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Frown } from "lucide-react";
import { mockShopsArray } from "@/lib/mock-data"; // Use centralized mock data

export default function ShopsPage() {
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<any>({}); // Define a proper filter type

  useEffect(() => {
    // Simulate fetching shops
    const timer = setTimeout(() => {
      setShops(mockShopsArray);
      setFilteredShops(mockShopsArray); // Initially show all shops
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setIsLoading(true);
    // Simulate filtering logic
    let tempFilteredShops = [...shops];
    if (newFilters.searchTerm) {
      tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.name.toLowerCase().includes(newFilters.searchTerm.toLowerCase()) ||
        (shop.description && shop.description.toLowerCase().includes(newFilters.searchTerm.toLowerCase()))
      );
    }
    if (newFilters.location) {
       tempFilteredShops = tempFilteredShops.filter(shop =>
        shop.location.address.toLowerCase().includes(newFilters.location.toLowerCase())
      );
    }
    if (newFilters.rating && newFilters.rating !== "0" && newFilters.rating !== "Any Rating") {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.rating && shop.rating >= parseFloat(newFilters.rating));
    }
    if (newFilters.priceRange && newFilters.priceRange !== "any" && newFilters.priceRange !== "Any Price") {
        tempFilteredShops = tempFilteredShops.filter(shop => shop.priceRange === newFilters.priceRange);
    }

    // Simulate API call delay for filtering
    setTimeout(() => {
      setFilteredShops(tempFilteredShops);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Find Your Next Style</h1>
      <ShopFilters onFilterChange={handleFilterChange} />

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
            We couldn&apos;t find any barbershops matching your criteria. Try adjusting your filters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
