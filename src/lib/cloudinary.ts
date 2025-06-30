// Cloudinary configuration for media storage
export const cloudinaryConfig = {
  cloudName: 'dobktsnix',
  uploadPreset: 'hospital',
  apiKey: 'your-api-key', // Replace with your Cloudinary API key if needed for signed uploads
};

export const uploadToCloudinary = async (file: File, folder: string = 'hospital') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
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
