import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, Star, User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import { AvailabilityCalendar } from './AvailabilityCalendar';

interface Doctor {
  id: string;
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
  availability?: Record<string, string[]>;
  createdAt?: any;
  verified?: boolean;
}

interface DoctorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctorData: Doctor | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  uploadProgress: number;
  uploadError: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  resetForm: () => void;
}

// Add these specialty and department option arrays
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
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState('basic');
  
  // Effect to handle form reset when closing
  useEffect(() => {
    if (!isOpen) {
      // Wait for animation to complete before resetting form
      setTimeout(() => {
        resetForm();
        setActiveTab('basic');
      }, 300);
    }
  }, [isOpen, resetForm]);
  
  // Effect to set availability when editing a doctor
  useEffect(() => {
    if (doctorData?.availability) {
      setAvailability(doctorData.availability);
    } else {
      setAvailability({});
    }
  }, [doctorData]);

  // Handle availability updates from calendar
  const handleAvailabilityChange = (newAvailability: Record<string, string[]>) => {
    setAvailability(newAvailability);
    
    // Update the form data with new availability
    document.getElementById('availability-input')?.setAttribute(
      'value', 
      JSON.stringify(newAvailability)
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          ></div>
          
          {/* Drawer */}
          <motion.div
            className="absolute right-0 top-0 h-full max-w-3xl w-full bg-background shadow-xl overflow-hidden flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-background">
              <h2 className="text-2xl font-bold text-foreground">
                {doctorData ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Tab Navigation */}
            <div className="px-6 border-b border-border bg-background">
              <div className="flex space-x-6">
                <button
                  className={`py-3 px-1 border-b-2 transition-colors ${
                    activeTab === 'basic' 
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Information
                </button>
                <button
                  className={`py-3 px-1 border-b-2 transition-colors ${
                    activeTab === 'details' 
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('details')}
                >
                  Details & Bio
                </button>
                <button
                  className={`py-3 px-1 border-b-2 transition-colors ${
                    activeTab === 'availability' 
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('availability')}
                >
                  Availability
                </button>
              </div>
            </div>
            
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="doctorForm" onSubmit={onSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                  {/* Image Upload */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Doctor Photo
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted/20 flex items-center justify-center relative">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Doctor Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground" />
                        )}
                        
                        {/* Upload progress overlay */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                            <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-sm font-semibold">{uploadProgress}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label 
                          htmlFor="imageUpload"
                          className="flex items-center justify-center px-4 py-2 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Upload new photo</span>
                        </label>
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Recommended: Square image, at least 300x300px
                        </p>
                        
                        {uploadError && (
                          <div className="mt-2 text-sm text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {uploadError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name*
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Input
                          name="name"
                          defaultValue={doctorData?.name || ''}
                          required
                          placeholder="Dr. John Doe"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Specialty */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Specialty*
                        </label>
                        <select
                          name="specialty"
                          defaultValue={doctorData?.specialty || ''}
                          required
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        >
                          <option value="" disabled>Select Specialty</option>
                          {specialtyOptions.map(specialty => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Department
                        </label>
                        <select
                          name="department"
                          defaultValue={doctorData?.department || ''}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map(department => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            type="email"
                            name="email"
                            defaultValue={doctorData?.email || ''}
                            placeholder="john.doe@hospital.com"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            type="tel"
                            name="phone"
                            defaultValue={doctorData?.phone || ''}
                            placeholder="+1 (123) 456-7890"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Experience
                        </label>
                        <Input
                          name="experience"
                          defaultValue={doctorData?.experience || ''}
                          placeholder="10+ years"
                        />
                      </div>
                      
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Primary Location
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            name="location"
                            defaultValue={doctorData?.location || ''}
                            placeholder="Main Hospital"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Verification Status */}
                    <div className="flex items-start mt-4">
                      <div className="flex items-center h-5">
                        <input
                          id="verified"
                          name="verified"
                          type="checkbox"
                          defaultChecked={doctorData?.verified || false}
                          className="focus:ring-primary h-4 w-4 text-primary border-input rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="verified" className="text-sm font-medium text-foreground flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                          Verified Doctor
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Mark this doctor as verified to display a verification badge
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Details & Bio */}
                <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Biography / Description
                      </label>
                      <textarea
                        name="bio"
                        defaultValue={doctorData?.bio || ''}
                        rows={5}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                        placeholder="Provide a detailed description of the doctor's background, expertise, and approach to patient care..."
                      ></textarea>
                    </div>
                    
                    {/* Education - as array */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Education & Training
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter each qualification on a new line
                      </p>
                      <textarea
                        name="education"
                        defaultValue={doctorData?.education?.join('\n') || ''}
                        rows={4}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                        placeholder="M.D., Harvard Medical School
Residency in Internal Medicine, Mayo Clinic
Fellowship in Cardiology, Johns Hopkins"
                      ></textarea>
                    </div>
                    
                    {/* Languages - as array */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Languages Spoken
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter each language on a new line
                      </p>
                      <textarea
                        name="languages"
                        defaultValue={doctorData?.languages?.join('\n') || ''}
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                        placeholder="English
Spanish
French"
                      ></textarea>
                    </div>
                    
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Doctor Rating
                      </label>
                      <div className="flex items-center">
                        <input
                          type="range"
                          name="rating"
                          min="0"
                          max="5"
                          step="0.1"
                          defaultValue={doctorData?.rating || 4.5}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center ml-4 min-w-[60px]">
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                          <span className="font-medium" id="ratingValue">
                            {doctorData?.rating || 4.5}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Awards & Recognitions - as array */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Awards & Recognitions
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter each award on a new line
                      </p>
                      <textarea
                        name="awards"
                        defaultValue={doctorData?.awards?.join('\n') || ''}
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                        placeholder="Top Doctor Award, 2022
Research Excellence Prize
Community Service Recognition"
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                {/* Availability Calendar */}
                <div className={activeTab === 'availability' ? 'block' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Doctor Availability Schedule
                    </label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set the days and time slots when this doctor is available for appointments.
                    </p>
                    
                    <AvailabilityCalendar 
                      initialAvailability={availability}
                      onChange={handleAvailabilityChange}
                    />
                    
                    {/* Hidden input to store availability data */}
                    <input
                      type="hidden"
                      name="availability"
                      id="availability-input"
                      value={JSON.stringify(availability)}
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-background flex justify-between items-center">
              {activeTab !== 'basic' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const prevTab = activeTab === 'availability' ? 'details' : 'basic';
                    setActiveTab(prevTab);
                  }}
                >
                  Previous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              
              {activeTab !== 'availability' ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    const nextTab = activeTab === 'basic' ? 'details' : 'availability';
                    setActiveTab(nextTab);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  form="doctorForm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {doctorData ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    doctorData ? 'Update Doctor' : 'Create Doctor'
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DoctorFormDrawer;
