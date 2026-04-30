export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      gatherings: {
        Row: Gathering;
        Insert: Omit<Gathering, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Gathering, "id" | "created_at" | "updated_at">>;
      };
      header_buttons: {
        Row: HeaderButton;
        Insert: Omit<HeaderButton, "id" | "created_at">;
        Update: Partial<Omit<HeaderButton, "id" | "created_at">>;
      };
    };
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: "host" | "admin";
  created_at: string;
}

export interface Gathering {
  id: string;
  host_id: string;
  category_id: string | null;
  title: string;
  summary: string | null;
  content: EditorJSContent | null;
  thumbnail_url: string | null;
  thumbnail_detail_url: string | null;
  location: string | null;
  date: string | null;
  capacity: number | null;
  cost: number;
  google_form_url: string | null;
  recruitment_start: string | null;
  recruitment_end: string | null;
  status: "draft" | "published" | "closed";
  is_pinned: boolean;
  pin_order: number;
  created_at: string;
  updated_at: string;
}


export interface EditorJSContent {
  time?: number;
  blocks: EditorJSBlock[];
  version?: string;
}

export interface EditorJSBlock {
  id?: string;
  type: string;
  data: Record<string, unknown>;
  tunes?: Record<string, unknown>;
}

/** Gathering with joined category */
export interface GatheringWithCategory extends Gathering {
  category: Category | null;
}

export interface HeaderButton {
  id: string;
  label: string;
  url: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export type GatheringEventType = "view" | "apply_click";

export interface GatheringEvent {
  id: string;
  gathering_id: string;
  event_type: GatheringEventType;
  created_at: string;
}
