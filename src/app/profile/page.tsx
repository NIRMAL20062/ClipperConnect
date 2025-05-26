
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Edit3, PlusCircle, Trash2, Save, UploadCloud } from "lucide-react";
import { useState, useEffect, type ChangeEvent } from "react";
import type { UserProfile as AuthUserProfile, UserAddress } from "@/lib/types"; // Renamed to avoid conflict
import { useToast } from "@/hooks/use-toast";
// Mock functions for Firestore interaction - replace with actual Firebase calls
// import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db, storage } from "@/lib/firebase";

// Mock user data structure, assuming it's fetched from Firestore
interface UserProfileData extends AuthUserProfile {
  // Add any fields not in AuthUserProfile that are specific to Firestore profile
}


export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Partial<UserProfileData>>({});
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [newAddress, setNewAddress] = useState<Partial<UserAddress>>({ street: "", city: "", state: "", zipCode: "" });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      // Fetch user profile from Firestore
      const fetchProfile = async () => {
        setIsLoading(true);
        // const userDocRef = doc(db, "users", authUser.uid);
        // const userDocSnap = await getDoc(userDocRef);
        // if (userDocSnap.exists()) {
        //   const data = userDocSnap.data() as UserProfileData;
        //   setProfile(data);
        //   setAddresses(data.addresses || []);
        //   setProfileImageUrl(data.photoURL || authUser.photoURL);
        // } else {
        //   // Initialize profile if it doesn't exist
        //   const initialProfile = { ...authUser, addresses: [] };
        //   setProfile(initialProfile);
        //   setAddresses([]);
        //   setProfileImageUrl(authUser.photoURL);
        // }
        // MOCK IMPLEMENTATION:
        const mockProfile: UserProfileData = {
          ...authUser,
          preferredBarber: "John Doe",
          addresses: [{id: "1", street: "123 Main St", city: "Anytown", state: "CA", zipCode: "90210", isPrimary: true}],
        };
        setProfile(mockProfile);
        setAddresses(mockProfile.addresses || []);
        setProfileImageUrl(mockProfile.photoURL || authUser.photoURL);

        setIsLoading(false);
      };
      fetchProfile();
    }
  }, [authUser]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

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
      setAddresses([...addresses, { ...newAddress, id: Date.now().toString() } as UserAddress]);
      setNewAddress({ street: "", city: "", state: "", zipCode: "" });
    } else {
      toast({ title: "Incomplete Address", description: "Please fill all fields for the new address.", variant: "destructive" });
    }
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileImageUrl(URL.createObjectURL(file)); // Preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setIsLoading(true);

    let updatedPhotoURL = profile.photoURL;

    // if (profileImageFile) {
    //   const imageRef = ref(storage, `profileImages/${authUser.uid}/${profileImageFile.name}`);
    //   await uploadBytes(imageRef, profileImageFile);
    //   updatedPhotoURL = await getDownloadURL(imageRef);
    // }
    
    // MOCK: Simulate image upload
    if (profileImageFile) {
        updatedPhotoURL = profileImageUrl; // Use local preview URL for mock
    }


    const updatedProfileData = {
      ...profile,
      uid: authUser.uid,
      email: authUser.email,
      photoURL: updatedPhotoURL,
      addresses: addresses,
    };

    try {
      // await setDoc(doc(db, "users", authUser.uid), updatedProfileData, { merge: true });
      // MOCK: Log data
      console.log("Profile to save:", updatedProfileData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || (!authUser && !authLoading)) {
     return <div className="text-center py-10">Loading profile or please log in...</div>;
  }
  
  if (isLoading && !profile.uid) { // Initial data load
    return <div className="text-center py-10">Loading profile data...</div>;
  }


  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Your Profile</CardTitle>
            <CardDescription>Manage your personal information and preferences.</CardDescription>
          </div>
          <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)} size="sm">
            {isEditing ? "Cancel Edit" : <><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</>}
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-primary/50">
                <AvatarImage src={profileImageUrl || undefined} alt={profile.displayName || "User"} />
                <AvatarFallback className="text-4xl">
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : <User className="h-16 w-16"/>}
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

            {/* Personal Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" value={profile.displayName || ""} onChange={handleInputChange} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email || ""} disabled />
              </div>
              <div>
                <Label htmlFor="preferredBarber">Preferred Barber</Label>
                <Input id="preferredBarber" name="preferredBarber" value={profile.preferredBarber || ""} onChange={handleInputChange} disabled={!isEditing} placeholder="e.g., John Doe" />
              </div>
            </div>
            
            {/* Addresses Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Addresses</h3>
              {addresses.map((address, index) => (
                <Card key={address.id || index} className="mb-4 p-4 space-y-2 relative bg-muted/50">
                  {isEditing && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeAddress(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <Label htmlFor={`street-${index}`}>Street</Label>
                      <Input id={`street-${index}`} name="street" value={address.street} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label htmlFor={`city-${index}`}>City</Label>
                      <Input id={`city-${index}`} name="city" value={address.city} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label htmlFor={`state-${index}`}>State</Label>
                      <Input id={`state-${index}`} name="state" value={address.state} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label htmlFor={`zipCode-${index}`}>Zip Code</Label>
                      <Input id={`zipCode-${index}`} name="zipCode" value={address.zipCode} onChange={(e) => handleAddressChange(index, e)} disabled={!isEditing} />
                    </div>
                  </div>
                </Card>
              ))}
              {isEditing && (
                <Card className="p-4 space-y-2 border-dashed border-primary">
                  <h4 className="font-medium">Add New Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <Input name="street" placeholder="Street" value={newAddress.street || ""} onChange={handleNewAddressChange} />
                    <Input name="city" placeholder="City" value={newAddress.city || ""} onChange={handleNewAddressChange} />
                    <Input name="state" placeholder="State" value={newAddress.state || ""} onChange={handleNewAddressChange} />
                    <Input name="zipCode" placeholder="Zip Code" value={newAddress.zipCode || ""} onChange={handleNewAddressChange} />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addAddress} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Address
                  </Button>
                </Card>
              )}
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
