
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'shopkeeper'; // Role is now mandatory
  phoneNumber?: string | null; // For phone auth
  preferredBarber?: string;
  addresses?: UserAddress[];
  createdAt?: any; // Firestore server timestamp
  updatedAt?: any; // Firestore server timestamp
  // Loyalty points, etc.
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
  ownerId: string; // UID of the shopkeeper
  photos?: string[]; // URLs of photos
  rating?: number; // Average rating
  priceRange?: string; // e.g., "$", "$$", "$$$"
  location: {
    address: string;
    googleMapsLink?: string;
    latitude?: number;
    longitude?: number;
  };
  services: Service[];
  availability: AvailabilitySlot[]; // Could be more complex
  // description, phone, website, etc.
}

export interface Service {
  id: string;
  name: string; // e.g., Haircut, Facial, Beard Grooming
  price: number;
  durationMinutes: number; // Duration of the service
  description?: string;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  barberId?: string; // If specific barber is tied to slot
  isBooked: boolean;
}

export interface Booking {
  id: string;
  userId: string; // UID of the user
  shopId: string;
  serviceId: string;
  serviceName: string; // Denormalized for easier display
  shopName?: string; // Denormalized for easier display on user dashboard
  barberId?: string; // Optional specific barber
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_shop' | 'completed';
  paymentId?: string; // Razorpay Payment ID
  totalPrice: number;
  createdAt: Date;
  cancellationReason?: string;
  userName?: string; // Denormalized for shop bookings display
}

// For AI Scheduler
export interface HistoricalBookingEntry {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  barber: string;
}

export interface AvailableTimeSlotEntry {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface CurrentBookingEntry {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  barber: string;
}

export interface AIScheduleInput {
  historicalBookingData: string; // JSON string of HistoricalBookingEntry[]
  availableTimeSlots: string; // JSON string of AvailableTimeSlotEntry[]
  currentBookings: string; // JSON string of CurrentBookingEntry[]
}

export interface AIOptimalTimeSlotsInput {
  barbershopId: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'any';
}
