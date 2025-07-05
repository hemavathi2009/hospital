export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department?: string;
  experience?: string;
  rating?: number;
  location?: string;
  bio?: string;
  image?: string;
  education?: string[];
  languages?: string[];
  availability?: {
    [key: string]: string[];
  };
  verified?: boolean;
  createdAt?: any;
}