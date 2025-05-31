
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
  photoURL?: string | null; 
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
  userId: string; 
  serviceInterest?: string;
}

export interface RecommendedShopInfo {
  shopId: string;
  shopName: string;
  reason: string; 
}

export interface RecommendShopsOutput {
  recommendations: RecommendedShopInfo[];
  overallReasoning: string; 
}

// Types for AI Service Description Generator
export interface GenerateServiceDescriptionInput {
  serviceName: string;
  keywords?: string; // Optional keywords to guide the AI
}

export interface GenerateServiceDescriptionOutput {
  description: string;
}

// Types for AI Customer Support Chatbot
export interface ChatbotMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}
export interface CustomerSupportChatbotInput {
  userQuery: string;
  // Optional: to provide conversation history for context
  chatHistory?: Array<{role: 'user' | 'model', parts: [{text: string}]}>; 
}

export interface CustomerSupportChatbotOutput {
  botResponse: string;
}

// Types for Natural Language Shop Search AI Flow
export interface NaturalLanguageSearchInput {
  query: string;
  // Could include current location if available for better "nearby" results
  // userLatitude?: number;
  // userLongitude?: number;
}

export interface ParsedShopFilters {
  serviceKeywords?: string[];
  locationKeywords?: string[];
  price?: {
    max?: number;
    min?: number;
    descriptor?: 'under' | 'over' | 'around' | 'exact' | 'cheap' | 'expensive';
  };
  dateTime?: {
    date?: string; // e.g., "today", "tomorrow", "2024-07-15"
    time?: string; // e.g., "4 PM", "afternoon", "evening", "16:00"
    dayOfWeek?: string; // e.g., "Saturday"
  };
  rating?: {
    min?: number; // e.g., 4 for "4 stars and up"
  };
  openNow?: boolean; // If user explicitly asks "open now"
  otherFeatures?: string[]; // For miscellaneous keywords like "free wifi", "kid-friendly"
}

export interface NaturalLanguageSearchOutput {
  parsedFilters: ParsedShopFilters;
  clarificationNeeded?: string; // If AI needs more info
  searchSummary?: string; // A summary of how AI interpreted the query
}
