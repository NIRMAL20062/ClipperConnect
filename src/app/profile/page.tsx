
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Edit3, PlusCircle, Trash2, Save, UploadCloud } from "lucide-react";
import { useState, useEffect, type ChangeEvent } from "react";
import type { UserProfile as AuthUserProfileFromTypes, UserAddress, UserProfileUpdateData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockUserAddresses } from "@/lib/mock-data"; 
import Link from "next/link";


export default function ProfilePage() {
  const { user: authUser, loading: authLoading, updateUserProfileInContext } = useAuth();
  const { toast } = useToast();
  
  // Local state for form editing, initialized from authUser
  const [displayName, setDisplayName] = useState("");
  const [preferredBarber, setPreferredBarber] = useState("");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [newAddress, setNewAddress] = useState<Partial<UserAddress>>({ street: "", city: "", state: "", zipCode: "" });
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); // For preview and potential upload
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);


  useEffect(() => {
    if (authUser) {
      setIsPageLoading(true);
      setDisplayName(authUser.displayName || "");
      setPreferredBarber(authUser.preferredBarber || "");
      // Use addresses from authUser if available, otherwise default to mockUserAddresses for new profiles or as fallback
      setAddresses(authUser.addresses && authUser.addresses.length > 0 ? authUser.addresses : []);
      setProfileImageUrl(authUser.photoURL || null); // Use photoURL from authUser
      setIsPageLoading(false);
    } else if (!authLoading) {
        setIsPageLoading(false);
    }
  }, [authUser, authLoading]);


  const handleAddressChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [name]: value } as UserAddress;
    setAddresses(updatedAddresses);
  };
  
  const handleNewAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const addAddress = () => {
    if (newAddress.street && newAddress.city && newAddress.state && newAddress.zipCode) {
      const newAddrWithId = { ...newAddress, id: `addr-${Date.now().toString()}` } as UserAddress;
      setAddresses([...addresses, newAddrWithId]);
      setNewAddress({ street: "", city: "", state: "", zipCode: "" });
    } else {
      toast({ title: "Incomplete Address", description: "Please fill all fields for the new address.", variant: "destructive" });
    }
  };

  const removeAddress = (idToRemove: string) => {
    setAddresses(addresses.filter((address) => address.id !== idToRemove));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file); // Store the file itself for potential upload
      setProfileImageUrl(URL.createObjectURL(file)); // Set temporary blob URL for preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setIsSaving(true);

    const updateData: UserProfileUpdateData = {
      displayName: displayName,
      preferredBarber: preferredBarber,
      addresses: addresses,
    };

    // Handle photoURL:
    // In a real app, if profileImageFile exists, you'd upload it to Firebase Storage first,
    // get the downloadURL, and then set updateData.photoURL = downloadURL.
    // For this mock, we'll just pass the current profileImageUrl (which might be a blob URL).
    // If it's a new blob URL, Firebase Auth update might not persist it effectively without a real upload.
    // If it's an existing URL from authUser.photoURL and it hasn't changed, we don't need to include it.
    // If a new image was selected, profileImageUrl holds the blob URL.
    if (profileImageUrl !== authUser.photoURL) { // Only include if changed or newly set
        updateData.photoURL = profileImageUrl;
    }


    try {
      await updateUserProfileInContext(updateData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setIsEditing(false);
      setProfileImageFile(null); // Clear staged file after successful update
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message || "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || isPageLoading) {
     return <div className="text-center py-10 text-lg">Loading profile...</div>;
  }
  
  if (!authUser) {
     return (
        <div className="text-center py-10">
            <p className="text-lg mb-4">Please log in to view your profile.</p>
            <Button asChild><Link href="/login?redirect=/profile">Login</Link></Button>
        </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-3xl">Your Profile</CardTitle>
            <CardDescription>Manage your personal information and preferences.</CardDescription>
          </div>
          <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)} size="sm" className="w-full sm:w-auto">
            {isEditing ? "Cancel Edit" : <><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</>}
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-primary/50 shadow-md">
                <AvatarImage src={profileImageUrl || undefined} alt={displayName || "User"} />
                <AvatarFallback className="text-4xl bg-muted">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-16 w-16 text-muted-foreground"/>}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="relative">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('profileImageInput')?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Change Photo
                  </Button>
                  <input 
                    type="file" 
                    id="profileImageInput"
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!isEditing || isSaving} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={authUser.email || ""} disabled />
              </div>
              <div>
                <Label htmlFor="preferredBarber">Preferred Barber</Label>
                <Input id="preferredBarber" name="preferredBarber" value={preferredBarber} onChange={(e) => setPreferredBarber(e.target.value)} disabled={!isEditing || isSaving} placeholder="e.g., John Doe / Any" />
              </div>
               <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" value={authUser.role ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1) : ''} disabled />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">Addresses</h3>
              {addresses.map((address, index) => (
                <Card key={address.id || index} className="mb-4 p-4 space-y-2 relative bg-muted/30 shadow-sm">
                  {isEditing && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeAddress(address.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <Label htmlFor={`street-${index}`}>Street</Label>
                      <Input id={`street-${index}`} name="street" value={address.street} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing || isSaving} />
                    </div>
                    <div>
                      <Label htmlFor={`city-${index}`}>City</Label>
                      <Input id={`city-${index}`} name="city" value={address.city} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing || isSaving} />
                    </div>
                    <div>
                      <Label htmlFor={`state-${index}`}>State</Label>
                      <Input id={`state-${index}`} name="state" value={address.state} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing || isSaving} />
                    </div>
                    <div>
                      <Label htmlFor={`zipCode-${index}`}>Zip Code</Label>
                      <Input id={`zipCode-${index}`} name="zipCode" value={address.zipCode} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing || isSaving} />
                    </div>
                  </div>
                </Card>
              ))}
              {isEditing && (
                <Card className="p-4 space-y-3 border-dashed border-primary mt-4">
                  <h4 className="font-medium text-md">Add New Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <Input name="street" placeholder="Street" value={newAddress.street || ""} onChange={handleNewAddressChange} disabled={isSaving} />
                    <Input name="city" placeholder="City" value={newAddress.city || ""} onChange={handleNewAddressChange} disabled={isSaving} />
                    <Input name="state" placeholder="State" value={newAddress.state || ""} onChange={handleNewAddressChange} disabled={isSaving} />
                    <Input name="zipCode" placeholder="Zip Code" value={newAddress.zipCode || ""} onChange={handleNewAddressChange} disabled={isSaving} />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addAddress} className="mt-2" disabled={isSaving}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Address
                  </Button>
                </Card>
              )}
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}

