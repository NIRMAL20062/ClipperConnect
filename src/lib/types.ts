
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'shopkeeper';
  phoneNumber?: string | null;
  preferredBarber?: string;
  addresses?: UserAddress[];
  createdAt?: any; 
  updatedAt?: any; 
}

export interface UserProfileUpdateData {
  displayName?: string | null;
  photoURL?: string | null; // In a real app, this would be the Firebase Storage URL
  preferredBarber?: string;
  addresses?: UserAddress[];
}

export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
}

export interface Barbershop {
  id: string;
  name: string;
  ownerId: string; 
  photos?: string[]; 
  rating?: number; 
  priceRange?: string; 
  location: {
    address: string;
    googleMapsLink?: string;
    latitude?: number;
    longitude?: number;
  };
  services: Service[];
  availability: AvailabilitySlot[]; 
  description?: string; 
}

export interface Service {
  id: string;
  name: string; 
  price: number;
  durationMinutes: number; 
  description?: string;
}

export interface AvailabilitySlot {
  id: string; 
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  open: string; 
  close: string; 
  isAvailable: boolean; 
}


export interface Booking {
  id: string;
  userId: string; 
  shopId: string;
  serviceId: string;
  serviceName: string; 
  shopName?: string; 
  barberId?: string; 
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_shop' | 'completed';
  paymentId?: string; 
  totalPrice: number;
  createdAt: Date;
  cancellationReason?: string;
  userName?: string; 
  shopLocation?: Barbershop['location'];
  shopGoogleMapsLink?: string;
}

export interface HistoricalBookingEntry {
  date: string; 
  time: string; 
  service: string;
  barber: string;
}

export interface AvailableTimeSlotEntry {
  date: string; 
  startTime: string; 
  endTime: string; 
}

export interface CurrentBookingEntry {
  date: string; 
  time: string; 
  service: string;
  barber: string;
}

export interface AIScheduleInput {
  historicalBookingData: string; 
  availableTimeSlots: string; 
  currentBookings: string; 
}

export interface AIOptimalTimeSlotsInput {
  barbershopId: string;
  serviceType: string;
  date: string; 
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'any';
}

export interface ServiceRequest {
  id: string;
  userId: string; // ID of the user making the request
  userName: string; // Name of the user
  userPhotoUrl?: string; // Optional photo of the user
  serviceDescription: string; // What the user is looking for, e.g., "Men's haircut"
  requestedDate: Date; // Preferred date
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'any'; // Preferred time slot
  notes?: string; // Any additional notes from the user
  status: 'pending' | 'accepted' | 'declined' | 'completed'; // Status of the request
  createdAt: Date; // Timestamp of when the request was made
  acceptedByShopId?: string; // ID of the shop that accepted (if any)
  acceptedByShopName?: string; // Name of the shop that accepted (if any)
  // We could add location preferences here in a real app (e.g., user's current location or desired area)
}
