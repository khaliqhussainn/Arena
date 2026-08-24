export const CATEGORIES = [
  "General",
  "AI Tools",
  "Dev Tools",
  "Design",
  "Marketing",
  "Productivity",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ProductStatus = "active" | "eliminated" | "champion";
export type MatchStatus = "active" | "resolved";
export type VoteSide = "a" | "b";
export type PaymentType = "boost" | "revive" | "defend";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface Product {
  id: string;
  name: string;
  url: string;
  pitch: string;
  category: Category;
  status: ProductStatus;
  wins: number;
  is_defending: boolean;
  submitted_at: string;
}

export interface Match {
  id: string;
  category: Category;
  product_a_id: string;
  product_b_id: string;
  votes_a: number;
  votes_b: number;
  status: MatchStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface Vote {
  id: string;
  match_id: string;
  voter_fingerprint: string;
  side: VoteSide;
  created_at: string;
}

export interface Champion {
  id: string;
  product_id: string;
  category: Category;
  crowned_at: string;
  times_defended: number;
}

export interface ActivityLogEntry {
  id: string;
  text: string;
  created_at: string;
}

export interface Payment {
  id: string;
  lemonsqueezy_order_id: string | null;
  product_id: string | null;
  match_id: string | null;
  type: PaymentType;
  amount: number | null;
  status: PaymentStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      matches: { Row: Match; Insert: Partial<Match>; Update: Partial<Match> };
      votes: { Row: Vote; Insert: Partial<Vote>; Update: Partial<Vote> };
      champions: { Row: Champion; Insert: Partial<Champion>; Update: Partial<Champion> };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Partial<ActivityLogEntry>;
        Update: Partial<ActivityLogEntry>;
      };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
    };
  };
}
