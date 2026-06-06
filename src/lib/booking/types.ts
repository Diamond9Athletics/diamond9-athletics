/**
 * Booking system shared types.
 * Mirrors the Supabase schema in supabase/schema.sql.
 */

export type Category = "pitching" | "hitting";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_trainer: boolean;
  trainer_slug: string | null;        // e.g. "wes", "turner"
  trainer_bio: string | null;
  trainer_categories: Category[] | null;
  created_at: string;
};

export type TrainerGoogleOAuth = {
  trainer_id: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  connected_at: string;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  duration_min: number;
  active: boolean;
};

export type PackageKind = "credits" | "enrollment";

export type Package = {
  id: string;
  slug: string;
  name: string;
  service_id: string;
  price_cents: number;
  credits: number;
  expiry_days: number;
  stripe_price_id: string | null;
  active: boolean;
  kind: PackageKind;
};

export type Purchase = {
  id: string;
  user_id: string;
  package_id: string;
  stripe_checkout_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  status: "pending" | "paid" | "refunded";
  created_at: string;
  paid_at: string | null;
};

export type CreditBucket = {
  id: string;
  user_id: string;
  purchase_id: string;
  service_id: string;
  credits_total: number;
  credits_remaining: number;
  expiry_days: number;
  first_booking_date: string | null;
  expires_at: string | null;
  created_at: string;
};

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type Booking = {
  id: string;
  user_id: string;
  trainer_id: string;
  service_id: string;
  credit_bucket_id: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
};

export type AvailabilityRule = {
  id: string;
  trainer_id: string;
  category: Category;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // "16:00"
  end_time: string;    // "20:00"
  active: boolean;
};

export type AvailabilityBlock = {
  id: string;
  trainer_id: string | null; // null = blocks all trainers (site-wide closure)
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};
