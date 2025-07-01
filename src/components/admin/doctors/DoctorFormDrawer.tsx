import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, AlertCircle, Trash2, Mail, Phone, Star,
  Languages, Award, MapPin, Stethoscope, User, UserCheck, Info
} from 'lucide-react';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import { uploadImage } from '../../../utils/imageUpload';

// Specialty and department options
const specialtyOptions = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Oncology",
  "Gynecology",
  "Urology",
  "Ophthalmology",
  "Psychiatry",
  "General Medicine",
  "Internal Medicine",
  "Family Medicine",
  "Emergency Medicine",
  "Anesthesiology",
  "Radiology",
  "Pathology"
];

const departmentOptions = [
  "Emergency",
  "Outpatient",
  "Inpatient",
  "Surgery",
  "Intensive Care",
  "Radiology",
  "Laboratory",
  "Physical Therapy",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Gynecology",
  "Orthopedics",
  "Oncology",
  "General Medicine"
];

// Define Doctor interface
interface Doctor {
  id?: string;
  name: string;
  specialty: string;
  department?: string;
  experience?: string;
  rating?: number;
  location?: string;
  bio?: string;
  image?: string;
  email?: string;
  phone?: string;
  education?: string[];
  languages?: string[];
  awards?: string[];
  verified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface DoctorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctorData: Doctor | null;
  onSubmit: (e: React.FormEvent, formData: Partial<Doctor>) => void; // Update to pass formData
  isSubmitting: boolean;
  uploadProgress: number;
  uploadError: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  resetForm: () => void;
}

const DoctorFormDrawer: React.FC<DoctorFormDrawerProps> = ({
  isOpen,
  onClose,
  doctorData,
  onSubmit,
  isSubmitting,
  uploadProgress,
  uploadError,
  handleImageChange,
  imagePreview,
  resetForm
}) => {
  // Form state
  const [formValues, setFormValues] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    department: '',
    experience: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    rating: 4.5,
    education: [],
    languages: [],
    awards: [],
    verified: false
  });
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update form values when editing a doctor
  useEffect(() => {
    if (doctorData) {
      setFormValues({
        name: doctorData.name || '',
        specialty: doctorData.specialty || '',
        department: doctorData.department || '',
        experience: doctorData.experience || '',
        location: doctorData.location || '',
        bio: doctorData.bio || '',
        email: doctorData.email || '',
        phone: doctorData.phone || '',
        rating: doctorData.rating || 4.5,
        education: doctorData.education || [],
        languages: doctorData.languages || [],
        awards: doctorData.awards || [],
        verified: doctorData.verified || false
      });
    } else {
      setFormValues({
        name: '',
        specialty: '',
        department: '',
        experience: '',
        location: '',
        bio: '',
        email: '',
        phone: '',
        rating: 4.5,
        education: [],
        languages: [],
        awards: [],
        verified: false
      });
    }
    setActiveTab('basic');
  }, [doctorData, isOpen]);
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'education' || name === 'languages' || name === 'awards') {
      setFormValues(prev => ({
        ...prev,
        [name]: value.split('\n').filter(item => item.trim() !== '')
      }));
    } else if (type === 'checkbox') {
      setFormValues(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'rating') {
      setFormValues(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Rating component
  const Rating = ({ value, onChange }: { value: number, onChange: (newRating: number) => void }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 cursor-pointer ${i < value ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
            onClick={() => onChange(i + 1)}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">({value})</span>
      </div>
    );
  };
  
  // Handle form submission with form data
  const handleFormSubmit = (e: React.FormEvent) => {
    // Pass the current formValues to the parent's onSubmit
    onSubmit(e, formValues);
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
                  {doctorData ? 'Edit Doctor' : 'Add New Doctor'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Qualifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'contact'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Contact
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6">
                <form id="doctorForm" onSubmit={handleFormSubmit}>
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      {/* Doctor Image */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Doctor Profile Image</h3>
                        
                        <div className="flex flex-col items-center justify-center">
                          {imagePreview ? (
                            <div className="mb-4">
                              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                                <img 
                                  src={imagePreview} 
                                  alt="Doctor preview" 
                                  className="w-full h-full object-cover"
                                />
                                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                    <span className="text-lg font-semibold">{uploadProgress}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-center mt-3">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                    // Clear the image preview but don't reset the form
                                    setFormValues(prev => ({ ...prev, image: '' }));
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Change
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                                <User className="w-12 h-12 text-muted-foreground" />
                              </div>
                              <div className="flex justify-center mt-3">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Upload Image
                                </Button>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          
                          {uploadError && (
                            <div className="mt-2 text-sm text-red-500 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {uploadError}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Recommended: Square image, at least 300x300px
                          </p>
                        </div>
                      </div>
                      
                      {/* Basic Information */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                        
                        <div className="space-y-4">
                          {/* Doctor Name */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Doctor Name*
                            </label>
                            <Input
                              name="name"
                              value={formValues.name || ''}
                              onChange={handleInputChange}
                              required
                              placeholder="e.g. Dr. John Smith"
                            />
                          </div>
                          
                          {/* Specialty and Department */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Specialty*
                              </label>
                              <select
                                name="specialty"
                                value={formValues.specialty || ''}
                                onChange={handleInputChange}
                                required
                                className="w-full p-2.5 rounded-xl border border-input bg-background px-4 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              >
                                <option value="">Select Specialty</option>
                                {specialtyOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Department
                              </label>
                              <select
                                name="department"
                                value={formValues.department || ''}
                                onChange={handleInputChange}
                                className="w-full p-2.5 rounded-xl border border-input bg-background px-4 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              >
                                <option value="">Select Department</option>
                                {departmentOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Experience and Location */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Experience
                              </label>
                              <Input
                                name="experience"
                                value={formValues.experience || ''}
                                onChange={handleInputChange}
                                placeholder="e.g. 10+ years"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Location/Branch
                              </label>
                              <Input
                                name="location"
                                value={formValues.location || ''}
                                onChange={handleInputChange}
                                placeholder="e.g. Main Hospital"
                              />
                            </div>
                          </div>
                          
                          {/* Bio */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Biography
                            </label>
                            <textarea
                              name="bio"
                              value={formValues.bio || ''}
                              onChange={handleInputChange}
                              rows={5}
                              className="w-full rounded-xl border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              placeholder="Professional background and expertise..."
                            />
                          </div>
                          
                          {/* Rating */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Rating
                            </label>
                            <Rating 
                              value={formValues.rating || 4.5} 
                              onChange={(newRating) => {
                                setFormValues(prev => ({ ...prev, rating: newRating }));
                              }} 
                            />
                            <input 
                              type="hidden" 
                              name="rating" 
                              value={formValues.rating || 4.5} 
                            />
                          </div>
                          
                          {/* Verified Doctor */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="verified"
                              name="verified"
                              checked={formValues.verified || false}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="verified" className="ml-2 text-sm font-medium text-foreground flex items-center">
                              <UserCheck className="w-4 h-4 mr-1 text-success" />
                              Verified Doctor
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Qualifications */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Qualifications & Expertise</h3>
                        
                        <div className="space-y-4">
                          {/* Education */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <Award className="w-4 h-4 mr-1 text-primary" />
                              Education & Degrees
                            </label>
                            <textarea
                              name="education"
                              value={(formValues.education || []).join('\n')}
                              onChange={handleInputChange}
                              rows={4}
                              className="w-full rounded-xl border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              placeholder="Enter each qualification on a new line&#10;e.g. M.D. Harvard Medical School&#10;e.g. Residency, Mayo Clinic"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter each qualification on a new line
                            </p>
                          </div>
                          
                          {/* Languages */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <Languages className="w-4 h-4 mr-1 text-primary" />
                              Languages Spoken
                            </label>
                            <textarea
                              name="languages"
                              value={(formValues.languages || []).join('\n')}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full rounded-xl border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              placeholder="Enter each language on a new line&#10;e.g. English&#10;e.g. Spanish"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter each language on a new line
                            </p>
                          </div>
                          
                          {/* Awards */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <Award className="w-4 h-4 mr-1 text-primary" />
                              Awards & Recognitions
                            </label>
                            <textarea
                              name="awards"
                              value={(formValues.awards || []).join('\n')}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full rounded-xl border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 ring-primary/30 focus:border-primary"
                              placeholder="Enter each award on a new line&#10;e.g. Outstanding Medical Research Award 2022&#10;e.g. Top Doctor in Cardiology 2021"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter each award on a new line
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div className="bg-muted/30 rounded-xl p-6">
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        
                        <div className="space-y-4">
                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <Mail className="w-4 h-4 mr-1 text-primary" />
                              Email Address
                            </label>
                            <Input
                              type="email"
                              name="email"
                              value={formValues.email || ''}
                              onChange={handleInputChange}
                              placeholder="e.g. doctor@hospital.com"
                            />
                          </div>
                          
                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <Phone className="w-4 h-4 mr-1 text-primary" />
                              Phone Number
                            </label>
                            <Input
                              name="phone"
                              value={formValues.phone || ''}
                              onChange={handleInputChange}
                              placeholder="e.g. +1 (555) 123-4567"
                            />
                          </div>
                          
                          {/* Location */}
                          <div>
                            <label className="block text-sm font-medium mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-primary" />
                              Primary Practice Location
                            </label>
                            <Input
                              name="location"
                              value={formValues.location || ''}
                              onChange={handleInputChange}
                              placeholder="e.g. Main Hospital, 2nd Floor"
                            />
                          </div>
                          
                          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mt-4">
                            <p className="text-sm flex items-start">
                              <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                              <span>
                                Contact information will be used for internal administrative purposes. 
                                If displayed publicly, it will be the hospital's main contact information.
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-between bg-background">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  {activeTab !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ['basic', 'details', 'contact'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {activeTab !== 'contact' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const tabs = ['basic', 'details', 'contact'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      form="doctorForm"
                      variant="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {doctorData ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        doctorData ? 'Update Doctor' : 'Create Doctor'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DoctorFormDrawer;
