export interface Facility {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  features: string[];
  equipment: string[];
  staffCount: number;
  available24h: boolean;
  image: string;
  icon?: string;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}
