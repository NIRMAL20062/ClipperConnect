
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, DollarSign, Scissors, CalendarCheck, ExternalLink, Phone } from "lucide-react";
import type { Barbershop, Service } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Mock data - in a real app, this would be fetched from Firestore
const mockShopsData: Barbershop[] = [
   {
    id: "1",
    name: "Gentleman's Choice Cuts",
    ownerId: "shopkeeper1",
    photos: [
        "https://placehold.co/800x400.png?text=Gentleman's+Choice+Main",
        "https://placehold.co/400x300.png?text=Interior+1",
        "https://placehold.co/400x300.png?text=Tools"
    ],
    rating: 4.8,
    priceRange: "$$",
    location: { address: "123 Barber Lane, Styleville, ST 12345", googleMapsLink: "https://maps.google.com/?q=123+Barber+Lane,+Styleville" },
    services: [
      { id: "s1", name: "Classic Haircut", price: 30, durationMinutes: 45, description: "A timeless cut tailored to your preference." },
      { id: "s2", name: "Beard Trim & Shape", price: 20, durationMinutes: 25, description: "Expert shaping and trimming for a neat beard." },
      { id: "s11", name: "Hot Towel Shave", price: 35, durationMinutes: 40, description: "Luxurious traditional hot towel shave experience." },
    ],
    availability: [], // Simplified for now
    // description: "Experience traditional barbering with a modern touch. We pride ourselves on precision cuts and exceptional service."
  },
  {
    id: "2",
    name: "The Modern Mane",
    ownerId: "shopkeeper2",
    photos: [
        "https://placehold.co/800x400.png?text=Modern+Mane+Showcase",
        "https://placehold.co/400x300.png?text=Stylish+Setup",
        "https://placehold.co/400x300.png?text=Products"
    ],
    rating: 4.5,
    priceRange: "$$$",
    location: { address: "456 Shear Street, Trendytown, TR 67890", googleMapsLink: "https://maps.google.com/?q=456+Shear+Street,+Trendytown" },
    services: [
      { id: "s3", name: "Designer Cut", price: 50, durationMinutes: 60, description: "Cutting-edge styles from our expert stylists." },
      { id: "s4", name: "Color & Highlights", price: 75, durationMinutes: 90, description: "Vibrant colors and highlights to refresh your look." },
      { id: "s12", name: "Keratin Treatment", price: 120, durationMinutes: 120, description: "Smooth and straighten your hair with a keratin treatment." },
    ],
    availability: [],
    // description: "Your destination for contemporary hairstyling and premium grooming services. We stay ahead of the trends."
  },
  // Add other mock shops if needed, matching IDs from ShopsPage
];


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
        const foundShop = mockShopsData.find(s => s.id === shopId);
        setShop(foundShop || null);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shopId]);

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (!shop) {
    return <div className="text-center py-10">Shop not found. <Button variant="link" onClick={() => router.push('/shops')}>Back to shops</Button></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Image */}
      <Card className="overflow-hidden">
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={shop.photos?.[0] || "https://placehold.co/800x400.png"}
            data-ai-hint="barbershop interior"
            alt={shop.name}
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">{shop.name}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-yellow-300">
                <Star className="h-5 w-5 mr-1 fill-current" /> {shop.rating?.toFixed(1) || "N/A"}
              </div>
              <div className="text-gray-200 flex items-center">
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
                  <CardTitle>Our Services</CardTitle>
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
                  <CardTitle>About {shop.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {/* shop.description || "Detailed information about the shop will be available here. We are committed to providing the best barbering experience in town." */}
                     Experience traditional barbering with a modern touch at {shop.name}. We pride ourselves on precision cuts, expert styling, and exceptional customer service. Our team of skilled barbers is dedicated to helping you look and feel your best.
                  </p>
                  {/* Add more details like opening hours, mission, etc. */}
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
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
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
              {/* Placeholder for phone number */}
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">(555) 123-4567</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opening Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Mon - Fri: 9:00 AM - 7:00 PM</p>
              <p>Saturday: 10:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
              {/* This should be dynamic based on shop's availability data */}
            </CardContent>
          </Card>
          
          <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold flex items-center">
          <Scissors className="h-5 w-5 mr-2 text-primary" /> {service.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{service.description || "High-quality service by our professionals."}</p>
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-green-500" /> ${service.price.toFixed(2)}</span>
          <span className="flex items-center"><Clock className="h-4 w-4 mr-1 text-blue-500" /> {service.durationMinutes} min</span>
        </div>
      </div>
      <Button asChild variant="default" size="sm" className="mt-2 sm:mt-0 flex-shrink-0">
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
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-3/5 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex items-center space-x-4 mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
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

