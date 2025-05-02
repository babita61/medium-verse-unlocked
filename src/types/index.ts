
export type UserRole = 'admin' | 'verified' | 'guest';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: string;
  category_id: string | null;
  cover_image: string | null;
  published: boolean;
  featured: boolean;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
  read_time: number;
  views: number;
  author?: Profile;
  category?: Category;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  reported: boolean;
  user?: Profile;
  replies?: Comment[];
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  post?: Post;
}
