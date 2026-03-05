export interface GalaxyRubric {
  rubric_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  content_category: string;
  game_id: string | null;
  display_on_frontend: boolean;
  found_in_galaxy: boolean;
  content_count?: number;
  sort_order?: number;
}

export interface GalaxyContentItem {
  content_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  content_type: string | null;
  theme_label: string | null;
  position?: number;
}

export interface ResolvedVideo {
  content_id: string;
  delivery_url: string;
}

export type GalaxyContentCategory = 'tips' | 'masterclass' | 'grind_zone';

export interface GalaxyErrorResponse {
  status: number;
  message: string;
}
