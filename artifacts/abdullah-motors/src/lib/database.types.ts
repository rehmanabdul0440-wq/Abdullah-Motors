export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: "customer" | "staff" | "admin";
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "customer" | "staff" | "admin";
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role?: "customer" | "staff" | "admin";
          avatar_url?: string | null;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
        };
      };
      models: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          slug: string;
        };
        Update: {
          brand_id?: string;
          name?: string;
          slug?: string;
        };
      };
      categories: {
        Row: { id: string; name: string; slug: string };
        Insert: { id?: string; name: string; slug: string };
        Update: { name?: string; slug?: string };
      };
      cars: {
        Row: {
          id: string;
          title: string;
          slug: string;
          brand_id: string;
          model_id: string;
          category_id: string;
          year: number;
          price: number;
          mileage: number;
          fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
          transmission: "manual" | "automatic";
          condition: "new" | "used" | "certified";
          color: string | null;
          engine: string | null;
          seating_capacity: number | null;
          description: string | null;
          features: Json;
          status: "available" | "reserved" | "sold";
          is_featured: boolean;
          views_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          brand_id: string;
          model_id: string;
          category_id: string;
          year: number;
          price: number;
          mileage: number;
          fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
          transmission: "manual" | "automatic";
          condition: "new" | "used" | "certified";
          color?: string | null;
          engine?: string | null;
          seating_capacity?: number | null;
          description?: string | null;
          features?: Json;
          status?: "available" | "reserved" | "sold";
          is_featured?: boolean;
          views_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cars"]["Insert"]>;
      };
      car_images: {
        Row: {
          id: string;
          car_id: string;
          image_url: string;
          is_primary: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          car_id: string;
          image_url: string;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: {
          image_url?: string;
          is_primary?: boolean;
          sort_order?: number;
        };
      };
      enquiries: {
        Row: {
          id: string;
          car_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          status: "new" | "contacted" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          message: string;
          status?: "new" | "contacted" | "closed";
          created_at?: string;
        };
        Update: { status?: "new" | "contacted" | "closed" };
      };
      test_drive_bookings: {
        Row: {
          id: string;
          car_id: string;
          name: string;
          email: string;
          phone: string;
          preferred_date: string;
          preferred_time: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          name: string;
          email: string;
          phone: string;
          preferred_date: string;
          preferred_time: string;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
        };
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          avatar_url: string | null;
          rating: number;
          message: string;
          car_id: string | null;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          avatar_url?: string | null;
          rating: number;
          message: string;
          car_id?: string | null;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: { is_approved?: boolean; rating?: number; message?: string };
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          cover_image_url: string | null;
          author_id: string | null;
          status: "draft" | "published";
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          cover_image_url?: string | null;
          author_id?: string | null;
          status?: "draft" | "published";
          published_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blogs"]["Insert"]>;
      };
      newsletter_subscribers: {
        Row: { id: string; email: string; subscribed_at: string };
        Insert: { id?: string; email: string; subscribed_at?: string };
        Update: { email?: string };
      };
      finance_applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          annual_income: number;
          requested_amount: number;
          status: "new" | "reviewing" | "approved" | "declined" | "contacted";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          annual_income: number;
          requested_amount: number;
          status?: "new" | "reviewing" | "approved" | "declined" | "contacted";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          phone?: string;
          annual_income?: number;
          requested_amount?: number;
          status?: "new" | "reviewing" | "approved" | "declined" | "contacted";
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_car_views: {
        Args: { car_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "customer" | "staff" | "admin";
      fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
      transmission_type: "manual" | "automatic";
      car_condition: "new" | "used" | "certified";
      car_status: "available" | "reserved" | "sold";
      enquiry_status: "new" | "contacted" | "closed";
      booking_status: "pending" | "confirmed" | "completed" | "cancelled";
      blog_status: "draft" | "published";
      finance_application_status: "new" | "reviewing" | "approved" | "declined" | "contacted";
    };
  };
}
