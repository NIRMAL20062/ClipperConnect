
import type { Barbershop, Booking, UserAddress, AvailabilitySlot } from './types';
import { addDays, addMinutes, subDays } from 'date-fns';

export const mockUserAddresses: UserAddress[] = [
  {id: "addr1", street: "123 Main St", city: "Anytown", state: "CA", zipCode: "90210", isPrimary: true},
  {id: "addr2", street: "456 Oak Ave", city: "Otherville", state: "NY", zipCode: "10001"},
];

export const defaultAvailability: AvailabilitySlot[] = [
    { id: "mon", day: "Monday", open: "09:00", close: "18:00", isAvailable: true },
    { id: "tue", day: "Tuesday", open: "09:00", close: "18:00", isAvailable: true },
    { id: "wed", day: "Wednesday", open: "09:00", close: "18:00", isAvailable: true },
    { id: "thu", day: "Thursday", open: "09:00", close: "18:00", isAvailable: true },
    { id: "fri", day: "Friday", open: "09:00", close: "19:00", isAvailable: true },
    { id: "sat", day: "Saturday", open: "10:00", close: "17:00", isAvailable: true },
    { id: "sun", day: "Sunday", open: "", close: "", isAvailable: false },
];

export const mockShopsArray: Barbershop[] = [
  {
    id: "1",
    name: "Gentleman's Choice Cuts",
    ownerId: "shopkeeper1_uid",
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
    availability: defaultAvailability,
    description: "Experience traditional barbering with a modern touch. We pride ourselves on precision cuts and exceptional service."
  },
  {
    id: "2",
    name: "The Modern Mane",
    ownerId: "shopkeeper2_uid",
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
    availability: [
      ...defaultAvailability.filter(d => d.day !== "Sunday"),
      { id: "sun", day: "Sunday", open: "11:00", close: "16:00", isAvailable: true }, // Open on Sunday
    ],
    description: "Your destination for contemporary hairstyling and premium grooming services. We stay ahead of the trends."
  },
  {
    id: "3",
    name: "Quick Snips",
    ownerId: "shopkeeper3_uid",
    photos: ["https://placehold.co/400x240.png?text=Quick+Snips"],
    rating: 4.2,
    priceRange: "$",
    location: { address: "789 Clipper Road, Fastville, FV 34567", googleMapsLink: "https://maps.google.com/?q=789+Clipper+Road,+Fastville" },
    services: [
      { id: "s5", name: "Buzz Cut", price: 20, durationMinutes: 20 },
      { id: "s6", name: "Kids Haircut", price: 18, durationMinutes: 30 },
    ],
    availability: defaultAvailability.map(s => s.day === 'Sunday' || s.day === 'Saturday' ? {...s, isAvailable: false, open:"", close:""} : s),
    description: "Fast, friendly, and affordable cuts for the whole family."
  },
  {
    id: "4",
    name: "The Dapper Den",
    ownerId: "shopkeeper4_uid",
    photos: ["https://placehold.co/400x240.png?text=Dapper+Den"],
    rating: 4.9,
    priceRange: "$$$",
    location: { address: "101 Style Ave, Groomington, GR 00112", googleMapsLink: "https://maps.google.com/?q=101+Style+Ave,+Groomington" },
    services: [
      { id: "s7", name: "Executive Cut & Style", price: 60, durationMinutes: 75, description: "Premium cut, wash, and style for the discerning gentleman." },
      { id: "s8", name: "Luxury Beard Spa", price: 45, durationMinutes: 50, description: "Indulge in a full beard treatment with oils, balms, and hot towels." },
    ],
    availability: defaultAvailability,
    description: "An upscale barbering experience focusing on classic techniques and luxury products."
  },
  {
    id: "5",
    name: "Urban Edge Barbers",
    ownerId: "shopkeeper5_uid",
    photos: ["https://placehold.co/400x240.png?text=Urban+Edge"],
    rating: 4.6,
    priceRange: "$$",
    location: { address: "202 Fade St, Metro City, MC 99000", googleMapsLink: "https://maps.google.com/?q=202+Fade+St,+Metro+City" },
    services: [
      { id: "s9", name: "Skin Fade", price: 35, durationMinutes: 50, description: "Sharp skin fades and modern urban styles." },
      { id: "s10", name: "Hair Tinting", price: 40, durationMinutes: 60, description: "Subtle or bold hair tinting services." },
    ],
    availability: defaultAvailability.map(s => s.day === 'Sunday' ? {...s, isAvailable: false, open:"", close:""} : s),
    description: "Modern cuts, fades, and styles in a vibrant urban atmosphere."
  }
];

const today = new Date();
export const mockUserBookings: Booking[] = mockShopsArray.flatMap((shop, shopIndex) => {
  const bookingsForShop: Booking[] = [];
  const baseUserId = "user1"; // Can be varied if needed

  // Upcoming confirmed booking
  if (shop.services.length > 0) {
    const service1 = shop.services[0];
    bookingsForShop.push({
      id: `booking-${shop.id}-upcoming`,
      userId: baseUserId,
      shopId: shop.id,
      serviceId: service1.id,
      serviceName: service1.name,
      shopName: shop.name,
      startTime: addDays(new Date(new Date().setHours(10 + shopIndex, 30, 0, 0)), 2 + shopIndex),
      endTime: addMinutes(addDays(new Date(new Date().setHours(10 + shopIndex, 30, 0, 0)), 2 + shopIndex), service1.durationMinutes),
      status: "confirmed",
      totalPrice: service1.price,
      createdAt: new Date(),
      shopLocation: shop.location,
      shopGoogleMapsLink: shop.location.googleMapsLink,
    });
  }

  // Past completed booking
  if (shop.services.length > 1) {
    const service2 = shop.services[1 % shop.services.length];
    bookingsForShop.push({
      id: `booking-${shop.id}-completed`,
      userId: baseUserId,
      shopId: shop.id,
      serviceId: service2.id,
      serviceName: service2.name,
      shopName: shop.name,
      startTime: subDays(new Date(new Date().setHours(14 - shopIndex, 0, 0, 0)), 7 + shopIndex),
      endTime: addMinutes(subDays(new Date(new Date().setHours(14 - shopIndex, 0, 0, 0)), 7 + shopIndex), service2.durationMinutes),
      status: "completed",
      totalPrice: service2.price,
      createdAt: subDays(new Date(), 8 + shopIndex),
      shopLocation: shop.location,
      shopGoogleMapsLink: shop.location.googleMapsLink,
    });
  } else if (shop.services.length > 0) { // Ensure at least one service exists
     const service1 = shop.services[0];
     bookingsForShop.push({
      id: `booking-${shop.id}-completed-alt`,
      userId: baseUserId,
      shopId: shop.id,
      serviceId: service1.id,
      serviceName: service1.name,
      shopName: shop.name,
      startTime: subDays(new Date(new Date().setHours(14 - shopIndex, 0, 0, 0)), 7 + shopIndex),
      endTime: addMinutes(subDays(new Date(new Date().setHours(14 - shopIndex, 0, 0, 0)), 7 + shopIndex), service1.durationMinutes),
      status: "completed",
      totalPrice: service1.price,
      createdAt: subDays(new Date(), 8 + shopIndex),
      shopLocation: shop.location,
      shopGoogleMapsLink: shop.location.googleMapsLink,
    });
  }


  // Upcoming pending booking (for one shop)
  if (shopIndex === 0 && shop.services.length > 0) {
     const service1 = shop.services[0];
    bookingsForShop.push({
      id: `booking-${shop.id}-pending`,
      userId: baseUserId,
      shopId: shop.id,
      serviceId: service1.id,
      serviceName: service1.name,
      shopName: shop.name,
      startTime: addDays(new Date(new Date().setHours(15, 0, 0, 0)), 1),
      endTime: addMinutes(addDays(new Date(new Date().setHours(15, 0, 0, 0)), 1), service1.durationMinutes),
      status: "pending",
      totalPrice: service1.price,
      createdAt: new Date(),
      shopLocation: shop.location,
      shopGoogleMapsLink: shop.location.googleMapsLink,
    });
  }
  
  // Cancelled booking
  if (shopIndex === 1 && shop.services.length > 0) { // For the second shop
    const service1 = shop.services[0];
    bookingsForShop.push({
      id: `booking-${shop.id}-cancelled`,
      userId: baseUserId,
      shopId: shop.id,
      serviceId: service1.id,
      serviceName: service1.name,
      shopName: shop.name,
      startTime: addDays(new Date(new Date().setHours(9, 0, 0, 0)), 4), // Was upcoming
      endTime: addMinutes(addDays(new Date(new Date().setHours(9, 0, 0, 0)), 4), service1.durationMinutes),
      status: "cancelled_by_user",
      cancellationReason: "Changed my plans.",
      totalPrice: service1.price,
      createdAt: subDays(new Date(), 1),
      shopLocation: shop.location,
      shopGoogleMapsLink: shop.location.googleMapsLink,
    });
  }

  return bookingsForShop;
}).slice(0, 5); // Take first 5 bookings to keep the list manageable


export const mockShopkeeperOwnedShopId = "1"; // Gentleman's Choice Cuts

export const mockShopBookingsForShopkeeper: Booking[] = [
  // Bookings for shopId: "1"
  {
    id: "booking101", userId: "userA_uid", userName: "Alice Wonderland", shopId: "1", serviceId: "s1", serviceName: "Classic Haircut",
    startTime: addDays(new Date(today.setHours(10,0,0,0)), 1),
    endTime: addMinutes(addDays(new Date(today.setHours(10,0,0,0)), 1), 45),
    status: "pending", totalPrice: 30, createdAt: new Date(),
  },
  {
    id: "booking102", userId: "userB_uid", userName: "Bob The Builder", shopId: "1", serviceId: "s2", serviceName: "Beard Trim & Shape",
    startTime: addDays(new Date(today.setHours(14,30,0,0)), 2),
    endTime: addMinutes(addDays(new Date(today.setHours(14,30,0,0)), 2), 25),
    status: "confirmed", totalPrice: 20, createdAt: new Date(),
  },
  {
    id: "booking103", userId: "userC_uid", userName: "Carol Danvers", shopId: "1", serviceId: "s1", serviceName: "Classic Haircut",
    startTime: subDays(new Date(today.setHours(9,0,0,0)),1),
    endTime: addMinutes(subDays(new Date(today.setHours(9,0,0,0)),1), 45),
    status: "completed", totalPrice: 30, createdAt: subDays(new Date(),2),
  },
  {
    id: "booking104", userId: "userD_uid", userName: "David Copperfield", shopId: "1", serviceId: "s11", serviceName: "Hot Towel Shave",
    startTime: addDays(new Date(today.setHours(11,15,0,0)), 3),
    endTime: addMinutes(addDays(new Date(today.setHours(11,15,0,0)), 3), 40),
    status: "pending", totalPrice: 35, createdAt: new Date(),
  },
   {
    id: "booking105", userId: "userE_uid", userName: "Eve Adams", shopId: "1", serviceId: "s2", serviceName: "Beard Trim & Shape",
    startTime: subDays(new Date(today.setHours(17,0,0,0)), 2),
    endTime: addMinutes(subDays(new Date(today.setHours(17,0,0,0)), 2), 25),
    status: "cancelled_by_user", cancellationReason: "User changed their mind.", totalPrice: 20, createdAt: subDays(new Date(),3),
  },
  // Adding some bookings for shopId: "2" to show they don't appear for shopkeeper of shop "1"
  {
    id: "booking201", userId: "userF_uid", userName: "Frank Castle", shopId: "2", serviceId: "s3", serviceName: "Designer Cut",
    startTime: addDays(new Date(today.setHours(12,0,0,0)), 1),
    endTime: addMinutes(addDays(new Date(today.setHours(12,0,0,0)), 1), 60),
    status: "confirmed", totalPrice: 50, createdAt: new Date(),
  }
].filter(b => b.shopId === mockShopkeeperOwnedShopId); // Ensure only bookings for the owned shop are included
