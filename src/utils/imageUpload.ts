import { uploadToCloudinary } from '../lib/cloudinary';
import { toast } from 'sonner';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  success: boolean;
  error?: string;
}

/**
 * Upload image to Cloudinary with progress tracking
 * @param file - Image file to upload
 * @param onProgress - Optional callback for upload progress
 * @param folder - Optional folder name to organize uploads
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void,
  folder?: string
): Promise<UploadResult> => {
  if (!file) {
    return {
      url: '',
      secureUrl: '',
      publicId: '',
      success: false,
      error: 'No file provided'
    };
  }

  try {
    // Validate file type
    if (!file.type.match('image.*')) {
      return {
        url: '',
        secureUrl: '',
        publicId: '',
        success: false,
        error: 'Please select a valid image file'
      };
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        url: '',
        secureUrl: '',
        publicId: '',
        success: false,
        error: 'Image size should be less than 5MB'
      };
    }
    
    // Simulate progress for better UX
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(Math.min(progress, 90));
        if (progress >= 90) clearInterval(interval);
      }, 300);
    }
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file);
    
    // Complete the progress
    if (onProgress) onProgress(100);
    
    return {
      ...result,
      success: true
    };
  } catch (error) {
    console.error('Image upload error:', error);
    toast.error('Failed to upload image');
    return {
      url: '',
      secureUrl: '',
      publicId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

/**
 * Convert a base64 string to a File object
 */
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
