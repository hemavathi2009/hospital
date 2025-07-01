import React from 'react';
import { generateCloudinaryUrl, getPublicIdFromUrl } from '../../lib/cloudinary';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  transformation?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: boolean;
  fallback?: string;
}

/**
 * Optimized image component for Cloudinary
 * This component automatically applies transformations for performance
 */
const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  transformation,
  loading = 'lazy',
  objectFit = 'cover',
  placeholder = true,
  fallback
}) => {
  // If no source or not a Cloudinary URL, render regular image or fallback
  if (!src || !src.includes('cloudinary')) {
    const imgSrc = src || fallback || 'https://res.cloudinary.com/dobktsnix/image/upload/v1699781540/placeholder-image.jpg';
    return (
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        style={{ objectFit }}
      />
    );
  }

  // Extract public ID from the Cloudinary URL
  const publicId = getPublicIdFromUrl(src);
  
  if (!publicId) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        style={{ objectFit }}
      />
    );
  }
  
  // Create transformations string
  let transformString = '';
  
  if (transformation) {
    transformString = transformation;
  } else {
    const transforms = [];
    
    // Add width and height if provided
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    
    // Add auto format and quality
    transforms.push('f_auto,q_auto');
    
    // Add responsive cropping based on object fit
    if (objectFit === 'cover') transforms.push('c_fill,g_auto');
    else if (objectFit === 'contain') transforms.push('c_fit');
    
    transformString = transforms.join(',');
  }
  
  // Generate optimized Cloudinary URL
  const optimizedUrl = generateCloudinaryUrl(publicId, transformString);
  
  return (
    <img
      src={optimizedUrl}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={{ objectFit }}
    />
  );
};

export default CloudinaryImage;
