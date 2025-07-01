import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, AlertCircle, Sidebar, PlusCircle, Trash2, 
  Eye, EyeOff, Info, Clock
} from 'lucide-react';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import { Service, ServiceFormData } from '../../../types/service';
import { addService, updateService } from '../../../lib/serviceFirebase';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import ServicePreview from './ServicePreview';

interface ServiceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSave: (service: Service) => void;
}

const ServiceFormDrawer: React.FC<ServiceFormDrawerProps> = ({
  isOpen,
  onClose,
  service,
  onSave
}) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    shortDescription: '',
    iconType: 'Image',
    visible: true,
    category: '',
    features: [],
    available24h: false
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  // Initialize form data when editing a service
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        shortDescription: service.shortDescription || '',
        iconType: service.iconType || 'Image',
        visible: service.visible !== undefined ? service.visible : true,
        category: service.category || '',
        features: service.features || [],
        available24h: service.available24h || false
      });
      
      if (service.imageUrl) {
        setImagePreview(service.imageUrl);
      }
      
      if (service.iconUrl) {
        setIconPreview(service.iconUrl);
      }
    } else {
      // Reset form for new service
      setFormData({
        name: '',
        description: '',
        shortDescription: '',
        iconType: 'Image',
        visible: true,
        category: '',
        features: [],
        available24h: false
      });
      setImagePreview(null);
      setIconPreview(null);
    }
    
    setActiveTab('details');
    setImageFile(null);
    setIconFile(null);
    setUploadProgress(0);
    setUploadError(null);
  }, [service, isOpen]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadError(null);
  };
  
  // Handle icon upload
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setUploadError(null);
  };
  
  // Add a new feature
  const addFeature = () => {
    if (!newFeature.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    
    setNewFeature('');
  };
  
  // Remove a feature
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };
  
  // Handle key press in feature input
  const handleFeatureKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setUploading(true);
      
      let imageUrl = service?.imageUrl || '';
      let iconUrl = service?.iconUrl || '';
      
      // Upload new image if selected
      if (imageFile) {
        // Simulate upload progress for better UX
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);
        
        try {
          const uploadResult = await uploadToCloudinary(imageFile);
          imageUrl = uploadResult.secureUrl;
          clearInterval(interval);
          setUploadProgress(100);
        } catch (err) {
          clearInterval(interval);
          setUploadError('Failed to upload image. Please try again.');
          setUploading(false);
          setSaving(false);
          return;
        }
      }
      
      // Upload new icon if selected
      if (iconFile) {
        try {
          const uploadResult = await uploadToCloudinary(iconFile);
          iconUrl = uploadResult.secureUrl;
        } catch (err) {
          setUploadError('Failed to upload icon. Please try again.');
          setUploading(false);
          setSaving(false);
          return;
        }
      }
      
      // Create or update service in Firebase
      if (service) {
        // Update existing service
        await updateService(service.id, {
          ...formData,
          imageUrl,
          iconUrl,
          updatedAt: new Date()
        });
        
        onSave({
          ...service,
          ...formData,
          imageUrl,
          iconUrl,
          updatedAt: new Date()
        });
      } else {
        // Create new service
        const newServiceId = await addService({
          ...formData,
        });
        
        // Update with image URLs
        await updateService(newServiceId, {
          imageUrl,
          iconUrl
        });
        
        onSave({
          id: newServiceId,
          ...formData,
          imageUrl,
          iconUrl,
          order: 0, // Will be set by the addService function
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('Error saving service:', err);
      setUploadError('Failed to save service. Please try again.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-3xl bg-background border-l border-border shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-background">
                <h2 className="text-2xl font-bold">
                  {service ? 'Edit Service' : 'Add New Service'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={saving || uploading}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Service Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'preview'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Live Preview
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6">
                {activeTab === 'details' ? (
                  <form id="serviceForm" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                        
                        <div className="space-y-4">
                          {/* Service Name */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Service Name*
                            </label>
                            <Input
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              placeholder="e.g. Cardiology Services"
                            />
                          </div>
                          
                          {/* Service Category */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Category
                            </label>
                            <Input
                              name="category"
                              value={formData.category}
                              onChange={handleInputChange}
                              placeholder="e.g. Specialty Care"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Used for grouping similar services
                            </p>
                          </div>
                          
                          {/* Short Description */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Short Description*
                            </label>
                            <Input
                              name="shortDescription"
                              value={formData.shortDescription}
                              onChange={handleInputChange}
                              required
                              placeholder="Brief description (1-2 sentences)"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              This will appear in service cards and listings
                            </p>
                          </div>
                          
                          {/* Full Description */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Full Description*
                            </label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              required
                              rows={5}
                              className="w-full rounded-xl border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              placeholder="Detailed description of the service..."
                            />
                          </div>
                          
                          {/* Toggles */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Visibility Toggle */}
                            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg flex-1">
                              <div className="flex items-center">
                                {formData.visible ? (
                                  <Eye className="w-5 h-5 text-success mr-3" />
                                ) : (
                                  <EyeOff className="w-5 h-5 text-muted-foreground mr-3" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">Visibility</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formData.visible ? 'Visible to users' : 'Hidden from users'}
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="visible"
                                  checked={formData.visible}
                                  onChange={handleCheckboxChange}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                            
                            {/* 24/7 Availability Toggle */}
                            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg flex-1">
                              <div className="flex items-center">
                                {formData.available24h ? (
                                  <Clock className="w-5 h-5 text-success mr-3" />
                                ) : (
                                  <Clock className="w-5 h-5 text-muted-foreground mr-3" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">24/7 Availability</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formData.available24h ? 'Available 24/7' : 'Standard hours only'}
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="available24h"
                                  checked={formData.available24h}
                                  onChange={handleCheckboxChange}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Media Upload Section */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Media</h3>
                        
                        <div className="space-y-6">
                          {/* Service Icon */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Service Icon
                            </label>
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 flex items-center justify-center bg-background border border-border rounded-xl overflow-hidden">
                                {iconPreview ? (
                                  <img 
                                    src={iconPreview} 
                                    alt="Icon preview" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Info className="w-8 h-8 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <label 
                                  htmlFor="iconUpload"
                                  className="flex items-center justify-center px-4 py-2 border border-dashed border-border bg-background rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
                                  <span className="text-sm">Upload Icon</span>
                                </label>
                                <input
                                  type="file"
                                  id="iconUpload"
                                  accept="image/*"
                                  onChange={handleIconChange}
                                  className="hidden"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Recommended: Square image, at least 100x100px
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Service Image */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Service Image
                            </label>
                            <div className="border border-dashed border-border rounded-xl p-4 bg-background">
                              <div className="flex flex-col items-center justify-center text-center">
                                {imagePreview ? (
                                  <div className="w-full max-w-sm mx-auto mb-4">
                                    <div className="aspect-video relative rounded-lg overflow-hidden">
                                      <img 
                                        src={imagePreview} 
                                        alt="Service preview" 
                                        className="w-full h-full object-cover"
                                      />
                                      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                          <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="text-lg font-semibold">{uploadProgress}%</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(service?.imageUrl || null);
                                      }}
                                      className="mt-2"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <label 
                                      htmlFor="imageUpload"
                                      className="flex flex-col items-center justify-center w-full h-40 cursor-pointer hover:bg-muted/20 transition-colors"
                                    >
                                      <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-2">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                      <p className="text-sm font-medium">
                                        Click to upload service image
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        SVG, PNG, JPG or WEBP (max. 2MB)
                                      </p>
                                    </label>
                                    <input
                                      type="file"
                                      id="imageUpload"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                      className="hidden"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            {uploadError && (
                              <div className="mt-2 text-sm text-red-500 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {uploadError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Features Section */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Features & Highlights</h3>
                        
                        <div className="space-y-4">
                          {/* Add Feature */}
                          <div className="flex">
                            <Input
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyPress={handleFeatureKeyPress}
                              placeholder="Add a feature or highlight..."
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={addFeature}
                              variant="outline"
                              className="ml-2"
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          {/* Features List */}
                          <div className="space-y-2">
                            {formData.features.length > 0 ? (
                              <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                                {formData.features.map((feature, index) => (
                                  <li key={index} className="flex justify-between items-center p-3 bg-background">
                                    <span className="text-sm">{feature}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFeature(index)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center py-6 bg-background border border-border rounded-xl">
                                <p className="text-muted-foreground text-sm">
                                  No features added yet
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <ServicePreview
                    service={{
                      id: service?.id || 'preview',
                      name: formData.name || 'Service Name',
                      description: formData.description || 'Service description will appear here...',
                      shortDescription: formData.shortDescription || 'Brief description of the service',
                      iconType: formData.iconType,
                      iconUrl: iconPreview || '',
                      imageUrl: imagePreview || '',
                      visible: formData.visible,
                      order: service?.order || 0,
                      category: formData.category || '',
                      features: formData.features,
                      available24h: formData.available24h,
                      createdAt: service?.createdAt || new Date(),
                      updatedAt: service?.updatedAt || new Date()
                    }}
                  />
                )}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-between bg-background">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving || uploading}
                >
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab(activeTab === 'details' ? 'preview' : 'details')}
                  >
                    <Sidebar className="w-4 h-4 mr-2" />
                    {activeTab === 'details' ? 'Show Preview' : 'Edit Details'}
                  </Button>
                  <Button
                    type="submit"
                    form="serviceForm"
                    variant="primary"
                    disabled={saving || uploading}
                  >
                    {saving || uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {service ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      service ? 'Update Service' : 'Create Service'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServiceFormDrawer;
