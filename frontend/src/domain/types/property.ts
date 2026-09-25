export interface PropertyHost {
  id: number;
  name: string;
  picture: string | null;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover: string | null;
  location: string | null;
  price_per_night: number;
  rating_avg: number;
  ratings_count: number;
  host?: PropertyHost;
}