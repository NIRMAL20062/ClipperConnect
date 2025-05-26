
"use client";

import { useState, useEffect } from "react";
import { ShopCard } from "@/components/shops/shop-card";
import { ShopFilters } from "@/components/shops/shop-filters";
import type { Barbershop } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Frown } from "lucide-react";

// Mock data for barbershops
const mockShops: Barbershop[] = [
  {
    id: "1",
    name: "Gentleman's Choice Cuts",
    ownerId: "shopkeeper1",
    photos: ["https://placehold.co/400x240.png?text=Gentleman's+Choice"],
    rating: 4.8,
    priceRange: "$$",
    location: { address: "123 Barber Lane, Styleville", googleMapsLink: "#" },
    services: [
      { id: "s1", name: "Classic Haircut", price: 30, durationMinutes: 45 },
      { id: "s2", name: "Beard Trim", price: 15, durationMinutes: 20 },
    ],
    availability: [],
  },
  {
    id: "2",
    name: "The Modern Mane",
    ownerId: "shopkeeper2",
    photos: ["https://placehold.co/400x240.png?text=Modern+Mane"],
    rating: 4.5,
    priceRange: "$$$",
    location: { address: "456 Shear Street, Trendytown", googleMapsLink: "#" },
    services: [
      { id: "s3", name: "Designer Cut", price: 50, durationMinutes: 60 },
      { id: "s4", name: "Hot Towel Shave", price: 35, durationMinutes: 40 },
    ],
    availability: [],
  },
  {
    id: "3",
    name: "Quick Snips",
    ownerId: "shopkeeper3",
    photos: ["https://placehold.co/400x240.png?text=Quick+Snips"],
    rating: 4.2,
    priceRange: "$",
    location: { address: "789 Clipper Road, Fastville", googleMapsLink: "#" },
    services: [
      { id: "s5", name: "Buzz Cut", price: 20, durationMinutes: 20 },
      { id: "s6", name: "Kids Haircut", price: 18, durationMinutes: 30 },
    ],
    availability: [],
  },
   {
    id: "4",
    name: "The Dapper Den",
    ownerId: "shopkeeper4",
    photos: ["https://placehold.co/400x240.png?text=Dapper+Den"],
    rating: 4.9,
    priceRange: "$$$",
    location: { address: "101 Style Ave, Groomington", googleMapsLink: "#" },
    services: [
      { id: "s7", name: "Executive Cut & Style", price: 60, durationMinutes: 75 },
      { id: "s8", name: "Luxury Beard Spa", price: 45, durationMinutes: 50 },
    ],
    availability: [],
  },
  {
    id: "5",
    name: "Urban Edge Barbers",
    ownerId: "shopkeeper5",
    photos: ["https://placehold.co/400x240.png?text=Urban+Edge"],
    rating: 4.6,
    priceRange: "$$",
    location: { address: "202 Fade St, Metro City", googleMapsLink: "#" },
    services: [
      { id: "s9", name: "Skin Fade", price: 35, durationMinutes: 50 },
      { id: "s10", name: "Hair Tinting", price: 40, durationMinutes: 60 },
    ],
    availability: [],
  }
];

export default function ShopsPage() {
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<any>({}); // Define a proper filter type

  useEffect(() => {
    // Simulate fetching shops
    const timer = setTimeout(() => {
      setShops(mockShops);
      setFilteredShops(mockShops); // Initially show all shops
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
        shop.name.toLowerCase().includes(newFilters.searchTerm.toLowerCase())
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
