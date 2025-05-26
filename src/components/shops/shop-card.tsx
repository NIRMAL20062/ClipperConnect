
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, ArrowRight } from "lucide-react";
import type { Barbershop } from "@/lib/types";

interface ShopCardProps {
  shop: Barbershop;
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <div className="relative w-full h-48">
        <Image
          src={shop.photos?.[0] || "https://placehold.co/400x240.png"}
          data-ai-hint="barbershop storefront"
          alt={shop.name}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl">{shop.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" /> {shop.location.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" /> 
            {shop.rating?.toFixed(1) || "N/A"}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
            {shop.priceRange || "N/A"}
          </div>
        </div>
        {/* <p className="text-sm text-muted-foreground line-clamp-2">
          {shop.services.map(s => s.name).join(', ')}
        </p> */}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/shops/${shop.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
