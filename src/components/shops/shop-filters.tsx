
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Star, DollarSign, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ShopFiltersProps {
  onFilterChange: (filters: any) => void; // Replace 'any' with a proper filter type
}

export function ShopFilters({ onFilterChange }: ShopFiltersProps) {
  // State for filters can be added here
  // For now, it's a stateless UI component

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // Collect filter values and call onFilterChange
    const formData = new FormData(event.target as HTMLFormElement);
    const filters = Object.fromEntries(formData.entries());
    onFilterChange(filters);
  };

  return (
    <Card className="mb-8 p-4 md:p-6 shadow-md">
      <CardHeader className="p-0 pb-4 mb-4 border-b">
        <CardTitle className="text-2xl flex items-center">
            <Search className="mr-2 h-6 w-6 text-primary"/> Filter Barbershops
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="searchTerm" className="text-sm font-medium">Search by Name</Label>
            <Input id="searchTerm" name="searchTerm" placeholder="e.g., Cool Cuts" className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <Input id="location" name="location" placeholder="e.g., Anytown or Zip Code" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="rating" className="text-sm font-medium">Min. Rating</Label>
            <Select name="rating">
              <SelectTrigger id="rating" className="mt-1">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5"><Star className="h-4 w-4 inline-block mr-1 text-yellow-400 fill-yellow-400" /> 5 Stars</SelectItem>
                <SelectItem value="4"><Star className="h-4 w-4 inline-block mr-1 text-yellow-400 fill-yellow-400" /> 4 Stars & Up</SelectItem>
                <SelectItem value="3"><Star className="h-4 w-4 inline-block mr-1 text-yellow-400 fill-yellow-400" /> 3 Stars & Up</SelectItem>
                <SelectItem value="0">Any Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priceRange" className="text-sm font-medium">Price Range</Label>
            <Select name="priceRange">
              <SelectTrigger id="priceRange" className="mt-1">
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ (Affordable)</SelectItem>
                <SelectItem value="$$">$$ (Mid-Range)</SelectItem>
                <SelectItem value="$$$">$$$ (Premium)</SelectItem>
                <SelectItem value="any">Any Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Add more filters like services, availability if needed */}

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <Button type="submit" className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

