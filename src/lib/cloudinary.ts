// Cloudinary configuration for media storage
export const cloudinaryConfig = {
  cloudName: 'dobktsnix',
  uploadPreset: 'Real-Estate',
  apiKey: 'your-api-key', // Replace with your Cloudinary API key if needed for signed uploads
};

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dobktsnix/upload";
const UPLOAD_PRESET = "Real-Estate";

interface UploadResponse {
  url: string;
  secureUrl: string;
  publicId: string;
}

export const uploadToCloudinary = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      url: data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  // This would typically be done server-side for security
  // In a production app, you would create a Firebase Function to handle this securely
  console.log('Delete image with publicId:', publicId);
};

export const generateCloudinaryUrl = (publicId: string, transformations?: string) => {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
  return transformations 
    ? `${baseUrl}/${transformations}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

// Helper function to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string) => {
  if (!url) return null;
  
  try {
    // Extract the public ID from a Cloudinary URL
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Function to create a thumbnail URL
export const getThumbnailUrl = (url: string, width: number = 100, height: number = 100) => {
  if (!url) return '';
  
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return url;
  
  return generateCloudinaryUrl(publicId, `c_thumb,w_${width},h_${height},g_face`);
};
