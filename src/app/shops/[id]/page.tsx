
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, DollarSign, Scissors, CalendarCheck, ExternalLink, Phone, Info } from "lucide-react";
import type { Barbershop, Service, AvailabilitySlot } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { mockShopsArray } from "@/lib/mock-data"; // Use centralized mock data
import { format, parse } from "date-fns";

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      // Simulate fetching shop details
      const timer = setTimeout(() => {
        const foundShop = mockShopsArray.find(s => s.id === shopId);
        setShop(foundShop || null);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shopId]);

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return "N/A";
    try {
        // Parse time string like "09:00" and format it to "9:00 AM"
        const date = parse(timeStr, "HH:mm", new Date());
        return format(date, "p");
    } catch (error) {
        console.warn("Error formatting time:", timeStr, error);
        return timeStr; // fallback to original string if parsing fails
    }
  };

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (!shop) {
    return <div className="text-center py-10">Shop not found. <Button variant="link" onClick={() => router.push('/shops')}>Back to shops</Button></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Image */}
      <Card className="overflow-hidden shadow-xl rounded-lg">
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={shop.photos?.[0] || "https://placehold.co/800x400.png"}
            data-ai-hint="barbershop interior"
            alt={shop.name}
            layout="fill"
            objectFit="cover"
            priority
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">{shop.name}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-yellow-300 text-lg">
                <Star className="h-5 w-5 mr-1 fill-current" /> {shop.rating?.toFixed(1) || "N/A"}
              </div>
              <div className="text-gray-200 flex items-center text-lg">
                <DollarSign className="h-5 w-5 mr-1" /> {shop.priceRange || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Scissors className="mr-2 h-6 w-6 text-primary"/>Our Services</CardTitle>
                  <CardDescription>Choose from a range of professional grooming services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shop.services.map(service => (
                    <ServiceItem key={service.id} service={service} shopId={shop.id} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary"/>About {shop.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {shop.description || "Detailed information about the shop will be available here. We are committed to providing the best barbering experience in town."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="gallery" className="mt-4">
                 <Card>
                    <CardHeader><CardTitle>Gallery</CardTitle></CardHeader>
                    <CardContent>
                        {shop.photos && shop.photos.length > 1 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {shop.photos.slice(1).map((photoUrl, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border shadow-md group">
                                        <Image src={photoUrl} alt={`${shop.name} gallery image ${index + 1}`} layout="fill" objectFit="cover" className="hover:scale-105 transition-transform duration-300"/>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No additional images available.</p>
                        )}
                    </CardContent>
                 </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{shop.location.address}</span>
              </div>
              {shop.location.googleMapsLink && (
                <Button variant="outline" asChild className="w-full">
                  <a href={shop.location.googleMapsLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View on Google Maps
                  </a>
                </Button>
              )}
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">(555) 123-4567</span> {/* Placeholder */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opening Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {shop.availability && shop.availability.length > 0 ? (
                shop.availability.map(slot => (
                  <div key={slot.id} className="flex justify-between">
                    <span>{slot.day}:</span>
                    <span>{slot.isAvailable ? `${formatTime(slot.open)} - ${formatTime(slot.close)}` : "Closed"}</span>
                  </div>
                ))
              ) : (
                <p>Opening hours not available.</p>
              )}
            </CardContent>
          </Card>
          
          <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
            <Link href={`/book/${shop.id}`}>
              <CalendarCheck className="mr-2 h-5 w-5" /> Book Appointment
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ServiceItem({ service, shopId }: { service: Service, shopId: string }) {
  return (
    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors shadow-sm">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold flex items-center">
          <Scissors className="h-5 w-5 mr-2 text-primary" /> {service.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{service.description || "High-quality service by our professionals."}</p>
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-green-600" /> ${service.price.toFixed(2)}</span>
          <span className="flex items-center"><Clock className="h-4 w-4 mr-1 text-blue-600" /> {service.durationMinutes} min</span>
        </div>
      </div>
      <Button asChild variant="default" size="sm" className="mt-2 sm:mt-0 flex-shrink-0 bg-primary hover:bg-primary/90">
        <Link href={`/book/${shopId}?service=${service.id}`}>Book Now</Link>
      </Button>
    </div>
  );
}

function ShopDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <Skeleton className="w-full h-64 md:h-96" />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-10 w-full rounded-md" /> {/* TabsList */}
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" /> {/* CardTitle */}
              <Skeleton className="h-4 w-3/4" /> {/* CardDescription */}
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex items-center space-x-4 pt-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-9 w-24 mt-2 ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Skeleton className="h-12 w-full rounded-md" /> {/* Book Button */}
        </div>
      </div>
    </div>
  );
}
