export interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  iconType?: string;
  iconUrl?: string;
  imageUrl?: string;
  category?: string;
  features: string[];
  available24h?: boolean;
  visible: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceFormData {
  name: string;
  description: string;
  shortDescription: string;
  iconType?: string;
  visible: boolean;
  category?: string;
  features: string[];
  available24h?: boolean;
  duration?: number; // Added duration field (in minutes)
  preparationInstructions?: string; // Added instructions for patients
  departmentId?: string; // Added department association
  doctorIds?: string[]; // Added related doctors
}
