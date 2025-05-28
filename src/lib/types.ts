
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
  preferredTime?: string; // HH:mm format
}

export interface ServiceRequest {
  id: string;
  userId: string; 
  userName: string; 
  userPhotoUrl?: string; 
  serviceDescription: string; 
  requestedDate: Date; 
  preferredTime: string; // HH:mm format
  notes?: string; 
  status: 'pending' | 'accepted' | 'declined' | 'completed'; 
  createdAt: Date; 
  acceptedByShopId?: string; 
  acceptedByShopName?: string; 
}

// Types for Personalized Shop Recommendations AI Flow
export interface RecommendShopsInput {
  userId: string; // For future use with actual user preferences
  serviceInterest?: string; // e.g., "Classic Haircut", "Beard Trim"
  // In a real app, you might include location, past booking history, explicit preferences, etc.
}

export interface RecommendedShopInfo {
  shopId: string;
  shopName: string;
  reason: string; // Why this shop is recommended
}

export interface RecommendShopsOutput {
  recommendations: RecommendedShopInfo[];
  overallReasoning: string; // A summary of why these shops are good choices
}
