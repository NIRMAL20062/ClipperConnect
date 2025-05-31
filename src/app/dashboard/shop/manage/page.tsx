
"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, PlusCircle, Trash2, Save, Clock, DollarSign, Image as ImageIcon, Link as LinkIcon, Info, Building, Sparkles } from "lucide-react";
import type { Barbershop, Service, AvailabilitySlot } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { mockShopsArray, mockShopkeeperOwnedShopId, defaultAvailability } from "@/lib/mock-data"; 
import { generateServiceDescription } from "@/ai/flows/generate-service-description-flow";

export default function ManageShopPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [shopDetails, setShopDetails] = useState<Partial<Barbershop>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Partial<Service>>({ name: "", price: 0, durationMinutes: 30, description: "" });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [shopImageFiles, setShopImageFiles] = useState<File[]>([]); 
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<{ index: number | 'new', loading: boolean }>({ index: -1, loading: false });


  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      setIsLoading(true);
      const ownedShop = mockShopsArray.find(shop => shop.id === mockShopkeeperOwnedShopId );
      
      if (ownedShop) {
        setShopDetails(ownedShop);
        setServices(ownedShop.services || []);
        setAvailability(ownedShop.availability || JSON.parse(JSON.stringify(defaultAvailability))); 
        setImagePreviews(ownedShop.photos || []);
      } else {
        setShopDetails({ ownerId: user.uid, name: "", location: { address: "" }, services: [], availability: JSON.parse(JSON.stringify(defaultAvailability)), photos: [] });
        setServices([]);
        setAvailability(JSON.parse(JSON.stringify(defaultAvailability)));
        setImagePreviews([]);
        if (!mockShopsArray.some(s => s.ownerId === user.uid)) {
            toast({title: "New Shop Setup", description: "Fill in your shop details to get started."});
        }
      }
      setIsLoading(false);
    }
  }, [user, toast]); 

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
    updatedServices[index] = { ...updatedServices[index], [name]: name === 'price' || name === 'durationMinutes' ? parseFloat(value) || 0 : value } as Service;
    setServices(updatedServices);
  };

  const handleNewServiceChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: name === 'price' || name === 'durationMinutes' ? parseFloat(value) || 0 : value }));
  };

  const addService = () => {
    if (newService.name && (newService.price || newService.price === 0) && newService.durationMinutes) {
      setServices([...services, { ...newService, id: `new-${Date.now().toString()}` } as Service]);
      setNewService({ name: "", price: 0, durationMinutes: 30, description: "" });
    } else {
      toast({ title: "Incomplete Service", description: "Please provide name, price, and duration for the new service.", variant: "destructive" });
    }
  };

  const removeService = (idToRemove: string) => {
    setServices(services.filter((service) => service.id !== idToRemove));
  };
  
  const handleAvailabilityChange = (index: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    const updatedAvailability = availability.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setAvailability(updatedAvailability);
  };
  
  const handleImageFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      
      setShopImageFiles(prev => [...prev, ...imageFiles]);
      
      const newPreviews = imageFiles.map(file => ({ url: URL.createObjectURL(file), fileRef: file }));
      setImagePreviews(prev => [...prev, ...newPreviews.map(p => p.url)]);
    }
  };

  const removeImagePreview = (urlToRemove: string) => {
    const fileToRemove = shopImageFiles.find(file => URL.createObjectURL(file) === urlToRemove);
    if (fileToRemove) {
      URL.revokeObjectURL(urlToRemove);
      setShopImageFiles(prev => prev.filter(f => f !== fileToRemove));
    }
    setImagePreviews(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleGenerateDescription = async (serviceIndex: number | 'new') => {
    const serviceName = serviceIndex === 'new' ? newService.name : services[serviceIndex]?.name;
    if (!serviceName) {
      toast({ title: "Service Name Needed", description: "Please enter a service name to generate a description.", variant: "destructive" });
      return;
    }
    setIsGeneratingDescription({ index: serviceIndex, loading: true });
    try {
      const result = await generateServiceDescription({ serviceName });
      if (serviceIndex === 'new') {
        setNewService(prev => ({ ...prev, description: result.description }));
      } else {
        const updatedServices = [...services];
        updatedServices[serviceIndex].description = result.description;
        setServices(updatedServices);
      }
      toast({ title: "Description Generated!", description: "AI has crafted a description for your service." });
    } catch (error) {
      console.error("Error generating service description:", error);
      toast({ title: "Generation Failed", description: (error as Error).message || "Could not generate description.", variant: "destructive" });
    } finally {
      setIsGeneratingDescription({ index: -1, loading: false });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !shopDetails.name) {
      toast({ title: "Missing Information", description: "Shop name is required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    const finalShopData: Barbershop = {
        ...shopDetails,
        id: shopDetails.id || `shop-${user.uid}-${Date.now()}`, 
        name: shopDetails.name!, 
        ownerId: user.uid,
        services,
        availability,
        photos: imagePreviews, 
    } as Barbershop;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shopIndex = mockShopsArray.findIndex(s => s.id === finalShopData.id);
    if (shopIndex > -1) {
        mockShopsArray[shopIndex] = finalShopData;
    } else {
        mockShopsArray.push(finalShopData);
    }

    setShopDetails(finalShopData);
    setServices(finalShopData.services || []);
    setAvailability(finalShopData.availability || JSON.parse(JSON.stringify(defaultAvailability)));
    setImagePreviews(finalShopData.photos || []);
    setShopImageFiles([]); 

    toast({ title: "Shop Updated", description: `${finalShopData.name} details have been saved. (Mocked)`});
    setIsSaving(false);
  };
  
  if (authLoading || isLoading) {
    return <div className="text-center py-10 text-lg">Loading shop management...</div>;
  }

  if (!user || user.role !== 'shopkeeper') {
    return <div className="text-center py-10 text-lg">Access denied. This page is for shopkeepers.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Building className="mr-3 h-8 w-8 text-primary"/>Manage Your Shop</h1>
        <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save All Changes</>}
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="details">Shop Details</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Basic Information</CardTitle>
              <CardDescription>Update your shop's name, location, and other general details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Shop Name</Label>
                <Input id="name" name="name" value={shopDetails.name || ""} onChange={handleDetailChange} required disabled={isSaving}/>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="location.address" value={shopDetails.location?.address || ""} onChange={handleDetailChange} disabled={isSaving}/>
              </div>
              <div>
                <Label htmlFor="googleMapsLink" className="flex items-center"><LinkIcon className="mr-2 h-4 w-4"/>Google Maps Link (Optional)</Label>
                <Input id="googleMapsLink" name="location.googleMapsLink" value={shopDetails.location?.googleMapsLink || ""} onChange={handleDetailChange} placeholder="https://maps.google.com/..." disabled={isSaving}/>
              </div>
              <div>
                <Label htmlFor="description">Shop Description (Optional)</Label>
                <Textarea id="description" name="description" value={shopDetails.description || ""} onChange={handleDetailChange} placeholder="Tell customers about your shop..." rows={4} disabled={isSaving}/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
              <CardDescription>Add, edit, or remove the services you offer. Use AI to help craft descriptions!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.map((service, index) => (
                <Card key={service.id || index} className="p-4 space-y-3 relative bg-muted/50">
                   <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10 z-10"
                      onClick={() => removeService(service.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Remove service</span>
                    </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor={`serviceName-${index}`}>Service Name</Label><Input id={`serviceName-${index}`} name="name" value={service.name} onChange={(e) => handleServiceChange(index, e)} disabled={isSaving}/></div>
                    <div><Label htmlFor={`servicePrice-${index}`} className="flex items-center"><DollarSign className="mr-1 h-4 w-4"/>Price</Label><Input id={`servicePrice-${index}`} name="price" type="number" step="0.01" value={service.price} onChange={(e) => handleServiceChange(index, e)} disabled={isSaving}/></div>
                    <div><Label htmlFor={`serviceDuration-${index}`} className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Duration (minutes)</Label><Input id={`serviceDuration-${index}`} name="durationMinutes" type="number" value={service.durationMinutes} onChange={(e) => handleServiceChange(index, e)} disabled={isSaving}/></div>
                    <div className="md:col-span-2 space-y-1">
                      <Label htmlFor={`serviceDescription-${index}`}>Description (Optional)</Label>
                      <Textarea id={`serviceDescription-${index}`} name="description" value={service.description || ""} onChange={(e) => handleServiceChange(index, e)} placeholder="Briefly describe the service" rows={2} disabled={isSaving}/>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleGenerateDescription(index)} 
                        disabled={isSaving || isGeneratingDescription.loading || !services[index]?.name}
                        className="mt-1 text-xs"
                      >
                        {isGeneratingDescription.loading && isGeneratingDescription.index === index ? "Generating..." : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate with AI</>}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Card className="p-4 space-y-3 border-dashed border-primary">
                <h4 className="font-medium text-lg">Add New Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="newServiceName">Service Name</Label><Input id="newServiceName" name="name" placeholder="e.g., Men's Haircut" value={newService.name || ""} onChange={handleNewServiceChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="newServicePrice" className="flex items-center"><DollarSign className="mr-1 h-4 w-4"/>Price</Label><Input id="newServicePrice" name="price" type="number" step="0.01" placeholder="30" value={newService.price || ""} onChange={handleNewServiceChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="newServiceDuration" className="flex items-center"><Clock className="mr-1 h-4 w-4"/>Duration (minutes)</Label><Input id="newServiceDuration" name="durationMinutes" type="number" placeholder="45" value={newService.durationMinutes || ""} onChange={handleNewServiceChange} disabled={isSaving}/></div>
                    <div className="md:col-span-2 space-y-1">
                      <Label htmlFor="newServiceDescription">Description (Optional)</Label>
                      <Textarea id="newServiceDescription" name="description" value={newService.description || ""} onChange={handleNewServiceChange} placeholder="Briefly describe the service" rows={2} disabled={isSaving}/>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleGenerateDescription('new')} 
                        disabled={isSaving || isGeneratingDescription.loading || !newService.name}
                        className="mt-1 text-xs"
                      >
                         {isGeneratingDescription.loading && isGeneratingDescription.index === 'new' ? "Generating..." : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate with AI</>}
                      </Button>
                    </div>
                </div>
                <Button type="button" variant="outline" onClick={addService} className="mt-2" disabled={isSaving}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                </Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Set Availability</CardTitle>
                    <CardDescription>Define your shop's opening hours for each day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {availability.map((daySlot, index) => (
                        <Card key={daySlot.id || daySlot.day} className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4 bg-muted/50">
                            <Label className="font-semibold md:col-span-1 text-base">{daySlot.day}</Label>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`open-${index}`} className="text-sm">Open</Label>
                                <Input type="time" id={`open-${index}`} value={daySlot.open} disabled={!daySlot.isAvailable || isSaving} onChange={(e) => handleAvailabilityChange(index, 'open', e.target.value)} className="w-full"/>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`close-${index}`} className="text-sm">Close</Label>
                                <Input type="time" id={`close-${index}`} value={daySlot.close} disabled={!daySlot.isAvailable || isSaving} onChange={(e) => handleAvailabilityChange(index, 'close', e.target.value)} className="w-full"/>
                            </div>
                            <div className="flex items-center space-x-2 justify-self-start md:justify-self-end">
                                <Switch id={`available-${index}`} checked={daySlot.isAvailable} onCheckedChange={(checked) => handleAvailabilityChange(index, 'isAvailable', checked)} disabled={isSaving}/>
                                <Label htmlFor={`available-${index}`} className="text-sm whitespace-nowrap">{daySlot.isAvailable ? "Open" : "Closed"}</Label>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary"/>Shop Photos</CardTitle>
                    <CardDescription>Manage photos for your shop's gallery. The first image will be the main display photo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <Label htmlFor="shopImages" className="text-base font-medium">Upload New Photos</Label>
                        <Input id="shopImages" type="file" multiple accept="image/*" onChange={handleImageFilesChange} className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" disabled={isSaving}/>
                        <p className="text-sm text-muted-foreground mt-1">You can select multiple images. Drag to reorder (feature not implemented).</p>
                    </div>
                    {imagePreviews.length > 0 ? (
                        <div>
                            <h4 className="text-md font-semibold mb-2">Current Photos Preview</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {imagePreviews.map((src, index) => (
                                    <div key={src + index} className="relative group aspect-video rounded-md overflow-hidden border shadow-sm">
                                        <Image src={src} alt={`Shop photo ${index + 1}`} layout="fill" objectFit="cover" />
                                        <Button 
                                            type="button"
                                            variant="destructive" 
                                            size="icon" 
                                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={() => removeImagePreview(src)}
                                            disabled={isSaving}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove image</span>
                                        </Button>
                                        {index === 0 && <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 rounded-tr-md">Main</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No photos uploaded yet.</p>
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
