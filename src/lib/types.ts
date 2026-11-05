export type Province = 'Kigali City' | 'Northern' | 'Southern' | 'Eastern' | 'Western';
export interface Destination { id: string; name: string; slug: string; province: Province | null; tagline: string | null; description: string | null; hero_image_url: string | null; is_featured: boolean; is_published: boolean; display_order: number }
export interface Attraction {
  id: string; destination_id: string | null; name: string; slug: string; category: string; short_description: string | null; description: string | null;
  main_image_url: string | null; province: Province | null; district: string | null; sector: string | null; exact_location: string | null;
  latitude: number | null; longitude: number | null; google_maps_url: string | null; contact_phone: string | null; contact_email: string | null; website_url: string | null;
  opening_hours: string | null; entrance_fee_info: string | null; entrance_fee_amount: number | null; currency: string; activities: string[]; accommodation_info: string | null;
  facilities: string[]; accessibility_info: string | null; best_time_to_visit: string | null; visit_duration: string | null; safety_info: string | null;
  faqs: { q: string; a: string }[]; booking_enabled: boolean; available_times: string[]; daily_capacity: number | null; max_group_size: number;
  cancellation_hours: number; cancellation_policy: string | null; verification_status: 'verified' | 'awaiting'; is_demo: boolean; is_featured: boolean; is_published: boolean;
}
export interface Product { id: string; attraction_id: string | null; name: string; slug: string; product_type: string; description: string | null; image_url: string | null; price: number | null; currency: string; is_demo: boolean; is_featured: boolean }
export interface Pkg { id: string; attraction_id: string | null; title: string; slug: string; description: string | null; image_url: string | null; duration_days: number | null; price_per_person: number | null; currency: string; includes: string[]; is_demo: boolean; is_featured: boolean }
export interface Booking {
  id: string; reference: string; user_id: string; attraction_id: string; product_id: string | null; package_id: string | null; full_name: string; email: string; phone: string;
  nationality: string | null; experience: string | null; booking_date: string; preferred_time: string | null; visitors: number; special_requests: string | null;
  unit_price: number | null; total_amount: number; currency: string; status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; created_at: string;
  attractions?: { name: string; slug: string; cancellation_hours: number } | null;
}
export interface Profile { id: string; full_name: string | null; email: string | null; phone: string | null; nationality: string | null; avatar_url: string | null; role: string; is_active: boolean; created_at: string }
export interface Review { id: string; attraction_id: string; reviewer_name: string | null; rating: number; title: string | null; comment: string | null; created_at: string; is_featured?: boolean; is_approved?: boolean }
export const STAFF_ROLES = ['super_admin', 'admin', 'content_manager', 'booking_manager', 'editor'];
export const CATEGORY_LABEL: Record<string, string> = {
  national_park: 'National Park', lake: 'Lake', mountain: 'Mountain', adventure: 'Adventure', wildlife: 'Wildlife', cultural: 'Cultural',
  historical: 'Historical', museum: 'Museum', city: 'Kigali & City', recreation: 'Recreation', landscape: 'Landscape',
};
