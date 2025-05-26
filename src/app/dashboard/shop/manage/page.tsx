
"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, PlusCircle, Trash2, Save, Clock, DollarSign, Image as ImageIcon, Link as LinkIcon, Info } from "lucide-react";
import type { Barbershop, Service, AvailabilitySlot } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch"; // For availability toggles
import Image from "next/image";

// Mock shop data - in a real app, this would be fetched based on the logged-in shopkeeper's user.uid
const mockShopDataForOwner: Barbershop = {
  id: "1", // Assume this shop belongs to the current shopkeeper
  name: "Gentleman's Choice Cuts",
  ownerId: "shopkeeper1_uid", // This should match the logged-in shopkeeper's UID
  photos: [
    "https://placehold.co/800x400.png?text=Shop+Main+Photo",
    "https://placehold.co/200x150.png?text=Interior+1",
    "https://placehold.co/200x150.png?text=Tools"
  ],
  location: {
    address: "123 Barber Lane, Styleville, ST 12345",
    googleMapsLink: "https://maps.google.com/?q=123+Barber+Lane,+Styleville",
  },
  services: [
    { id: "s1", name: "Classic Haircut", price: 30, durationMinutes: 45, description: "A timeless cut tailored to your preference." },
    { id: "s2", name: "Beard Trim & Shape", price: 20, durationMinutes: 25, description: "Expert shaping and trimming for a neat beard." },
  ],
  availability: [ // Example availability structure (very simplified)
    { day: "Monday", open: "09:00", close: "18:00", isAvailable: true },
    { day: "Tuesday", open: "09:00", close: "18:00", isAvailable: true },
    { day: "Wednesday", open: "09:00", close: "18:00", isAvailable: true },
    { day: "Thursday", open: "09:00", close: "18:00", isAvailable: true },
    { day: "Friday", open: "09:00", close: "19:00", isAvailable: true },
    { day: "Saturday", open: "10:00", close: "17:00", isAvailable: true },
    { day: "Sunday", open: "", close: "", isAvailable: false },
  ].map(a => ({...a, id: a.day})) as any, // Casting for mock simplicity
  // description: "Your friendly neighborhood barbershop...",
};

export default function ManageShopPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [shopDetails, setShopDetails] = useState<Partial<Barbershop>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Partial<Service>>({ name: "", price: 0, durationMinutes: 30, description: "" });
  const [availability, setAvailability] = useState<any[]>([]); // Using any for simplified mock
  const [shopImages, setShopImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      // Fetch shop data for this owner from Firestore
      // MOCK:
      setIsLoading(true);
      // Simulating finding the shop for the logged-in owner
      // if (mockShopDataForOwner.ownerId === user.uid) { // This check won't work with placeholder UID
      setShopDetails(mockShopDataForOwner);
      setServices(mockShopDataForOwner.services || []);
      setAvailability(mockShopDataForOwner.availability || []);
      setImagePreviews(mockShopDataForOwner.photos || []);
      // } else {
      //   // Shop not found or new shopkeeper
      //   setShopDetails({ ownerId: user.uid, name: "", location: { address: "" }, services: [], availability: [] });
      // }
      setIsLoading(false);
    }
  }, [user]);

  const handleDetailChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const locField = name.split(".")[1];
      setShopDetails(prev => ({
        ...prev,
        location: { ...prev?.location, [locField]: value } as Barbershop['location'],
      }));
    } else {
      setShopDetails(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleServiceChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [name]: name === 'price' || name === 'durationMinutes' ? parseFloat(value) : value } as Service;
    setServices(updatedServices);
  };

  const handleNewServiceChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: name === 'price' || name === 'durationMinutes' ? parseFloat(value) : value }));
  };

  const addService = () => {
    if (newService.name && newService.price && newService.durationMinutes) {
      setServices([...services, { ...newService, id: Date.now().toString() } as Service]);
      setNewService({ name: "", price: 0, durationMinutes: 30, description: "" });
    } else {
      toast({ title: "Incomplete Service", description: "Please fill all required fields for the new service.", variant: "destructive" });
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };
  
  const handleAvailabilityChange = (index: number, field: string, value: string | boolean) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index] = { ...updatedAvailability[index], [field]: value };
    setAvailability(updatedAvailability);
  };
  
  const handleImageFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setShopImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImagePreview = (index: number, isExisting: boolean) => {
    if(isExisting) { // Removing an already uploaded image URL
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
      // TODO: Mark this image for deletion from Firebase Storage on save
    } else { // Removing a newly selected file preview
      // This logic needs to be more robust to map preview index to shopImages index
      // For simplicity, this mock just removes from preview. A real app would need better mapping.
      const urlToRemove = imagePreviews[index];
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
      setShopImages(prev => prev.filter(file => URL.createObjectURL(file) !== urlToRemove));
      URL.revokeObjectURL(urlToRemove);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !shopDetails.name) {
      toast({ title: "Missing Information", description: "Shop name is required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    // Mock saving process
    // TODO: Upload new images to Firebase Storage, get URLs
    // TODO: Save shopDetails, services, availability, and image URLs to Firestore
    const finalShopData = {
        ...shopDetails,
        services,
        availability,
        photos: imagePreviews, // In real app, use newly uploaded URLs + existing ones not marked for deletion
        ownerId: user.uid,
    };
    console.log("Saving shop data (mock):", finalShopData);

    setTimeout(() => {
      toast({ title: "Shop Updated", description: "Your shop details have been saved. (Mocked)"});
      setIsSaving(false);
    }, 1500);
  };
  
  if (authLoading || isLoading) {
    return <div className="text-center py-10">Loading shop management...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10">Access denied.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Settings className="mr-3 h-8 w-8 text-primary"/>Manage Your Shop</h1>
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Shop Details</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        {/* Shop Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Basic Information</CardTitle>
              <CardDescription>Update your shop's name, location, and other general details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Shop Name</Label>
                <Input id="name" name="name" value={shopDetails.name || ""} onChange={handleDetailChange} required />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="location.address" value={shopDetails.location?.address || ""} onChange={handleDetailChange} />
              </div>
              <div>
                <Label htmlFor="googleMapsLink" className="flex items-center"><LinkIcon className="mr-2 h-4 w-4"/>Google Maps Link</Label>
                <Input id="googleMapsLink" name="location.googleMapsLink" value={shopDetails.location?.googleMapsLink || ""} onChange={handleDetailChange} placeholder="https://maps.google.com/..."/>
              </div>
              <div>
                <Label htmlFor="description">Shop Description (Optional)</Label>
                <Textarea id="description" name="description" value={(shopDetails as any).description || ""} onChange={handleDetailChange} placeholder="Tell customers about your shop..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
              <CardDescription>Add, edit, or remove the services you offer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.map((service, index) => (
                <Card key={service.id || index} className="p-4 space-y-2 relative bg-muted/50">
                   <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor={`serviceName-${index}`}>Service Name</Label><Input id={`serviceName-${index}`} name="name" value={service.name} onChange={(e) => handleServiceChange(index, e)} /></div>
                    <div><Label htmlFor={`servicePrice-${index}`} className="flex items-center"><DollarSign className="mr-1 h-4 w-4"/>Price</Label><Input id={`servicePrice-${index}`} name="price" type="number" value={service.price} onChange={(e) => handleServiceChange(index, e)} /></div>
                    <div><Label htmlFor={`serviceDuration-${index}`} className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Duration (minutes)</Label><Input id={`serviceDuration-${index}`} name="durationMinutes" type="number" value={service.durationMinutes} onChange={(e) => handleServiceChange(index, e)} /></div>
                    <div className="md:col-span-2"><Label htmlFor={`serviceDescription-${index}`}>Description (Optional)</Label><Textarea id={`serviceDescription-${index}`} name="description" value={service.description || ""} onChange={(e) => handleServiceChange(index, e)} placeholder="Briefly describe the service"/></div>
                  </div>
                </Card>
              ))}
              <Card className="p-4 space-y-2 border-dashed border-primary">
                <h4 className="font-medium text-lg">Add New Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="newServiceName">Service Name</Label><Input id="newServiceName" name="name" placeholder="e.g., Men's Haircut" value={newService.name || ""} onChange={handleNewServiceChange} /></div>
                    <div><Label htmlFor="newServicePrice" className="flex items-center"><DollarSign className="mr-1 h-4 w-4"/>Price</Label><Input id="newServicePrice" name="price" type="number" placeholder="30" value={newService.price || ""} onChange={handleNewServiceChange} /></div>
                    <div><Label htmlFor="newServiceDuration" className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Duration (minutes)</Label><Input id="newServiceDuration" name="durationMinutes" type="number" placeholder="45" value={newService.durationMinutes || ""} onChange={handleNewServiceChange} /></div>
                    <div className="md:col-span-2"><Label htmlFor="newServiceDescription">Description (Optional)</Label><Textarea id="newServiceDescription" name="description" value={newService.description || ""} onChange={handleNewServiceChange} placeholder="Briefly describe the service"/></div>
                </div>
                <Button type="button" variant="outline" onClick={addService} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                </Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Set Availability</CardTitle>
                    <CardDescription>Define your shop's opening hours for each day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {availability.map((daySlot, index) => (
                        <Card key={daySlot.id || daySlot.day} className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4 bg-muted/50">
                            <Label className="font-semibold md:col-span-1">{daySlot.day}</Label>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`open-${index}`} className="text-sm">Open</Label>
                                <Input type="time" id={`open-${index}`} value={daySlot.open} disabled={!daySlot.isAvailable} onChange={(e) => handleAvailabilityChange(index, 'open', e.target.value)} className="w-full"/>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`close-${index}`} className="text-sm">Close</Label>
                                <Input type="time" id={`close-${index}`} value={daySlot.close} disabled={!daySlot.isAvailable} onChange={(e) => handleAvailabilityChange(index, 'close', e.target.value)} className="w-full"/>
                            </div>
                            <div className="flex items-center space-x-2 justify-self-end">
                                <Label htmlFor={`available-${index}`} className="text-sm whitespace-nowrap">{daySlot.isAvailable ? "Open" : "Closed"}</Label>
                                <Switch id={`available-${index}`} checked={daySlot.isAvailable} onCheckedChange={(checked) => handleAvailabilityChange(index, 'isAvailable', checked)} />
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
        
        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary"/>Shop Photos</CardTitle>
                    <CardDescription>Manage photos for your shop's gallery.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label htmlFor="shopImages" className="text-base font-medium">Upload New Photos</Label>
                        <Input id="shopImages" type="file" multiple accept="image/*" onChange={handleImageFilesChange} className="mt-1"/>
                        <p className="text-sm text-muted-foreground mt-1">You can select multiple images.</p>
                    </div>
                    {imagePreviews.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold mb-2">Current Photos (Click to remove)</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {imagePreviews.map((src, index) => {
                                    const isExisting = mockShopDataForOwner.photos?.includes(src); // Crude check for existing
                                    return (
                                        <div key={index} className="relative group aspect-video rounded-md overflow-hidden border">
                                            <Image src={src} alt={`Shop photo ${index + 1}`} layout="fill" objectFit="cover" />
                                            <Button 
                                                type="button"
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImagePreview(index, !!isExisting)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
      
      <CardFooter className="mt-8 border-t pt-6 flex justify-end">
         <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save All Changes</>}
        </Button>
      </CardFooter>
    </form>
  );
}
