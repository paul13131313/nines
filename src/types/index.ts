export type ContentType = "movie" | "drama" | "manga" | "book" | "game" | "music" | "other";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface NineCell {
  id: string;
  user_id: string;
  position: number;
  content_title: string;
  content_type: ContentType;
  thumbnail_url: string | null;
  updated_at: string;
}

export interface SearchResult {
  title: string;
  thumbnail_url: string;
  type: string;
  year: string;
}

export interface UserWithCells {
  profile: Profile;
  cells: NineCell[];
  matchCount?: number;
  matchRate?: number;
}
