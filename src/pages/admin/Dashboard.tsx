import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { deleteService } from '../../lib/serviceFirebase';
// Remove Firebase storage imports since we'll use Cloudinary instead
// import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
// import { storage, db } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '../../components/layouts/AdminLayout';
import { 
  Search, Filter, Star, Calendar, Users, Stethoscope, Building, Activity, 
  UserCheck, Plus, Edit, Trash2, MoreHorizontal, Upload, X, Check,
  UserCircle, MapPin, GraduationCap, BookOpen, Languages, Award, Mail, Phone, Eye, EyeOff,
  // Add these new imports for contact buttons
  MessageCircle, PhoneCall, Send, Info, Clock, Grid, List, Edit2, ExternalLink, CheckCircle, Settings,
  // Add these missing icons
  Zap, UserPlus, CheckSquare, FileText, Bell, Download, User, Circle, ArrowRight
} from 'lucide-react';
// Import cloudinary utilities
import { uploadImage } from '../../utils/imageUpload';
import { getPublicIdFromUrl, deleteFromCloudinary } from '../../lib/cloudinary';

// Helper function to format date values
function formatDate(date: any): string {
  if (!date) return '';
  // Firestore Timestamp object
  if (typeof date === 'object' && date.seconds) {
    const d = new Date(date.seconds * 1000);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  // ISO string or JS Date
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Add this function after formatDate and before rendering functions
function isPastAppointment(appointment: any): boolean {
  if (!appointment.date) return false;
  const aptDate = appointment.date?.seconds 
    ? new Date(appointment.date.seconds * 1000) 
    : new Date(appointment.date);
  return aptDate < new Date() || appointment.status === 'completed' || appointment.status === 'cancelled';
}

// Helper function for formatting display dates more clearly
function formatDisplayDate(date: any): string {
  if (!date) return 'Not scheduled';
  
  // Firestore Timestamp object
  const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  // Check if date is today
  const today = new Date();
  const isToday = dateObj.toDateString() === today.toDateString();
  
  // Check if date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
  
  // Check if date is in the past
  const isPast = dateObj < today;
  
  // Format with appropriate label
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: today.getFullYear() !== dateObj.getFullYear() ? 'numeric' : undefined 
  });
  
  if (isToday) return `Today (${formattedDate})`;
  if (isTomorrow) return `Tomorrow (${formattedDate})`;
  if (isPast) return `${formattedDate} (Past)`;
  
  return formattedDate;
}

import Card from '../../components/atoms/Card';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Badge from '../../components/atoms/Badge';
import { motion } from 'framer-motion';

import DoctorGrid from '../../components/admin/doctors/DoctorGrid';
import DoctorTable from '../../components/admin/doctors/DoctorTable';
import DoctorFormDrawer from '../../components/admin/doctors/DoctorFormDrawer';
import ServiceFormDrawer from '../../components/admin/services/ServiceFormDrawer';

// Import the Service type from your types module to ensure consistency
import type { Service } from '../../types/service';

// Define enhanced interface for doctor objects
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
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  verified?: boolean;
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

// Simple Rating component for doctor ratings
const Rating = ({ value, readOnly = true, onChange, className = '' }) => {
  return (
    <div className={`flex ${className || ''}`}>
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-5 h-5 cursor-pointer ${i < value ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
          onClick={() => !readOnly && onChange && onChange(i + 1)}
        />
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [viewingContact, setViewingContact] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // View mode state for services
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('servicesViewMode') || 'grid';
  });
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isServiceDeleteDialogOpen, setIsServiceDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [reorderingServices, setReorderingServices] = useState(false);

  // Enhanced Doctor form state
  const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    department: '',
    experience: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    rating: 4.5,
    image: '',
    education: [],
    languages: [],
    awards: [],
    verified: false
  });
  
  // Facility form state
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    features: [],
    equipment: [],
    staffCount: 0,
    available24h: false,
    image: ''
  });
  
  // Image handling - enhanced
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  // Submission state for doctor form
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Appointment filter state
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Reset doctor form state
  const resetDoctorForm = () => {
    setDoctorForm({
      name: '',
      specialty: '',
      department: '',
      experience: '',
      location: '',
      bio: '',
      email: '',
      phone: '',
      rating: 4.5,
      image: '',
      education: [],
      languages: [],
      awards: [],
      verified: false
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingDoctor(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  // Populate form when editing doctor
  useEffect(() => {
    if (editingDoctor) {
      setDoctorForm({
        name: editingDoctor.name || '',
        specialty: editingDoctor.specialty || '',
        department: editingDoctor.department || '',
        experience: editingDoctor.experience || '',
        location: editingDoctor.location || '',
        bio: editingDoctor.bio || '',
        email: editingDoctor.email || '',
        phone: editingDoctor.phone || '',
        rating: editingDoctor.rating || 4.5,
        image: editingDoctor.image || '',
        education: editingDoctor.education || [],
        languages: editingDoctor.languages || [],
        awards: editingDoctor.awards || [],
        verified: editingDoctor.verified || false
      });
      
      // Set image preview if doctor has an image
      if (editingDoctor.image) {
        setImagePreview(editingDoctor.image);
      } else {
        setImagePreview(null);
      }
    }
  }, [editingDoctor]);

  // Populate form when editing facility
  useEffect(() => {
    if (editingFacility) {
      setFacilityForm({
        name: editingFacility.name || '',
        shortDescription: editingFacility.shortDescription || '',
        description: editingFacility.description || '',
        category: editingFacility.category || '',
        features: editingFacility.features || [],
        equipment: editingFacility.equipment || [],
        staffCount: editingFacility.staffCount || 0,
        available24h: editingFacility.available24h || false,
        image: editingFacility.image || ''
      });
      
      // Set image preview if facility has an image
      if (editingFacility.image) {
        setImagePreview(editingFacility.image);
      } else {
        setImagePreview(null);
      }
    }
  }, [editingFacility]);

  // Handle doctor form input changes with support for arrays and select/dropdown
  const handleDoctorFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle array fields
    if (name === 'education' || name === 'languages' || name === 'awards') {
      setDoctorForm(prev => ({
        ...prev,
        [name]: value.split('\n').filter(item => item.trim() !== '')
      }));
    } 
    // Handle checkbox fields
    else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDoctorForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } 
    // Handle number fields
    else if (type === 'range' || type === 'number') {
      setDoctorForm(prev => ({
        ...prev,
        [name]: type === 'range' ? parseFloat(value) : value
      }));
    } 
    // Handle all other fields including selects
    else {
      setDoctorForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle facility form input changes
  const handleFacilityFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Only HTMLInputElement has 'checked'
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox && 'checked' in e.target ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name === 'features' || name === 'equipment') {
      // Split comma-separated values into array
      setFacilityForm(prev => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim()).filter(Boolean)
      }));
    } else {
      setFacilityForm(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : value
      }));
    }
  };

  // Handle image file input change with preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setUploadError('Please select a valid image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Improved image upload with better error handling and cleanup
  const uploadDoctorImage = async (doctorId?: string): Promise<string | null> => {
    if (!imageFile) {
      // If editing and already has image URL, return it
      if (editingDoctor && editingDoctor.image) {
        return editingDoctor.image;
      }
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Generate a unique filename with doctor ID if available
      const fileName = doctorId 
        ? `doctors/${doctorId}/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        : `doctors/new/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // (Firebase Storage code removed; image upload now handled by Cloudinary in handleDoctorSubmit)
      return null;
    } catch (error) {
      console.error('Error in image upload process:', error);
      setIsUploading(false);
      setUploadError('An unexpected error occurred. Please try again.');
      return null;
    }
  };
  
  // Enhanced doctor submission with Cloudinary image handling
  const handleDoctorSubmit = async (e: React.FormEvent, formValues?: Partial<Doctor>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);
    
    // Use formValues from the form drawer if provided, otherwise use doctorForm
    const doctorFormData = formValues || doctorForm;
    
    try {
      // Validate form
      if (!doctorFormData.name || !doctorFormData.specialty) {
        toast.error('Name and Specialty are required');
        setIsSubmitting(false);
        return;
      }
      
      let doctorId = editingDoctor?.id;
      let imageUrl: string | null = null;
      
      // Upload image if present using Cloudinary
      if (imageFile) {
        const uploadResult = await uploadImage(
          imageFile,
          (progress) => setUploadProgress(progress),
          'doctors'
        );
        
        if (!uploadResult.success) {
          setUploadError(uploadResult.error || 'Failed to upload image');
          setIsSubmitting(false);
          return;
        }
        
        imageUrl = uploadResult.secureUrl;
      } else if (editingDoctor?.image) {
        imageUrl = editingDoctor.image;
      }
      
      const doctorData = {
        ...doctorFormData,
        image: imageUrl || '',
        updatedAt: serverTimestamp()
      };
      
      if (editingDoctor) {
        // Update existing doctor
        const doctorRef = doc(db, 'doctors', editingDoctor.id);
        await updateDoc(doctorRef, doctorData);
        toast.success('Doctor updated successfully');
      } else {
        // Add new doctor
        const docRef = await addDoc(collection(db, 'doctors'), {
          ...doctorData,
          createdAt: serverTimestamp()
        });
        
        toast.success('Doctor added successfully');
      }
      
      // Reset form and close modal
      resetDoctorForm();
      setShowAddDoctorModal(false);
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Failed to save doctor');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Enhanced delete function with Cloudinary cleanup
  const confirmDeleteDoctor = async (doctor: Doctor) => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      try {
        // Delete image from Cloudinary if exists
        if (doctor.image) {
          const publicId = getPublicIdFromUrl(doctor.image);
          if (publicId) {
            await deleteFromCloudinary(publicId);
            console.log('Doctor image deleted from Cloudinary');
          }
        }
        
        // Delete doctor document
        await deleteDoc(doc(db, 'doctors', doctor.id));
        toast.success('Doctor deleted successfully');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast.error('Failed to delete doctor');
      }
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }

    // Redirect if not admin
    if (userRole && userRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    // If userRole is still loading, wait
    if (userRole === null && currentUser) {
      return;
    }

    // If we reach here and userRole is 'admin', proceed with setting up real-time listeners
    if (userRole === 'admin') {
      setupRealTimeListeners();
    }
  }, [currentUser, userRole, navigate]);

  const setupRealTimeListeners = () => {
    setLoading(true);

    // Real-time listener for appointments
    const appointmentsRef = collection(db, 'appointments');
    const appointmentsQuery = query(appointmentsRef, orderBy('createdAt', 'desc'));
    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);
      console.log('Real-time appointments update:', appointmentsData.length);
    }, (error) => {
      console.error('Error listening to appointments:', error);
      toast.error('Failed to load appointments');
    });

    // Real-time listener for contacts
    const contactsRef = collection(db, 'contacts');
    const contactsQuery = query(contactsRef, orderBy('createdAt', 'desc'));
    const unsubscribeContacts = onSnapshot(contactsQuery, (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContacts(contactsData);
      console.log('Real-time contacts update:', contactsData.length);
    }, (error) => {
      console.error('Error listening to contacts:', error);
      toast.error('Failed to load contacts');
    });

    // Real-time listener for doctors
    const doctorsRef = collection(db, 'doctors');
    const doctorsQuery = query(doctorsRef, orderBy('createdAt', 'desc'));
    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);
      console.log('Real-time doctors update:', doctorsData.length);
    }, (error) => {
      console.error('Error listening to doctors:', error);
      toast.error('Failed to load doctors');
    });

    // Real-time listener for facilities
    const facilitiesRef = collection(db, 'facilities');
    const facilitiesQuery = query(facilitiesRef, orderBy('createdAt', 'desc'));
    const unsubscribeFacilities = onSnapshot(facilitiesQuery, (snapshot) => {
      const facilitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFacilities(facilitiesData);
      console.log('Real-time facilities update:', facilitiesData.length);
    }, (error) => {
      console.error('Error listening to facilities:', error);
      toast.error('Failed to load facilities');
    });

    // Real-time listener for services
    const servicesRef = collection(db, 'services');
    const servicesQuery = query(servicesRef, orderBy('order', 'asc'));
    const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
      console.log('Real-time services update:', servicesData.length);
    }, (error) => {
      console.error('Error listening to services:', error);
      toast.error('Failed to load services');
    });

    setLoading(false);

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeAppointments();
      unsubscribeContacts();
      unsubscribeDoctors();
      unsubscribeFacilities();
      unsubscribeServices();
    };
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const now = new Date();
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: now,
        statusUpdatedAt: now,
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: now,
          updatedBy: currentUser?.email || 'admin'
        })
      });
      
      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { 
          ...apt, 
          status: newStatus, 
          updatedAt: now,
          statusUpdatedAt: now,
          statusHistory: [...(apt.statusHistory || []), {
            status: newStatus,
            timestamp: now,
            updatedBy: currentUser?.email || 'admin'
          }]
        } : apt
      ));
      
      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const deleteContact = async (contactId) => {
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const addDoctor = async (doctorData) => {
    try {
      await addDoc(collection(db, 'doctors'), {
        ...doctorData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowAddDoctorModal(false);
      toast.success('Doctor added successfully');
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error('Failed to add doctor');
    }
  };

  const updateDoctor = async (doctorId, doctorData) => {
    try {
      const doctorRef = doc(db, 'doctors', doctorId);
      await updateDoc(doctorRef, {
        ...doctorData,
        updatedAt: new Date()
      });
      setEditingDoctor(null);
      toast.success('Doctor updated successfully');
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast.error('Failed to update doctor');
    }
  };

  const deleteDoctor = async (doctorId) => {
    try {
      await deleteDoc(doc(db, 'doctors', doctorId));
      toast.success('Doctor deleted successfully');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Failed to delete doctor');
    }
  };

  const addFacility = async (facilityData) => {
    try {
      await addDoc(collection(db, 'facilities'), {
        ...facilityData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowAddFacilityModal(false);
      toast.success('Facility added successfully');
    } catch (error) {
      console.error('Error adding facility:', error);
      toast.error('Failed to add facility');
    }
  };

  const updateFacility = async (facilityId, facilityData) => {
    try {
      const facilityRef = doc(db, 'facilities', facilityId);
      await updateDoc(facilityRef, {
        ...facilityData,
        updatedAt: new Date()
      });
      setEditingFacility(null);
      toast.success('Facility updated successfully');
    } catch (error) {
      console.error('Error updating facility:', error);
      toast.error('Failed to update facility');
    }
  };

  const deleteFacility = async (facilityId) => {
    try {
      await deleteDoc(doc(db, 'facilities', facilityId));
      toast.success('Facility deleted successfully');
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast.error('Failed to delete facility');
    }
  };

  // Handle service deletion
  const deleteServiceItem = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  // Handle service visibility toggle
  const toggleServiceVisibility = async (service: Service) => {
    try {
      // Update the service document in Firestore
      const serviceRef = doc(db, 'services', service.id);
      await updateDoc(serviceRef, {
        visible: !service.visible,
        updatedAt: new Date()
      });
      toast.success(`Service ${service.visible ? 'hidden' : 'shown'} successfully`);
    } catch (error) {
      console.error('Error updating service visibility:', error);
      toast.error('Failed to update service');
    }
  };

  // Add the renderOverview function with enhanced dashboard content
  const renderOverview = () => {
    // Calculate statistics
    const todayAppointments = appointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = apt.date.seconds 
        ? new Date(apt.date.seconds * 1000).toISOString().split('T')[0]
        : new Date(apt.date).toISOString().split('T')[0];
      return aptDate === new Date().toISOString().split('T')[0];
    });
    
    // Appointment status counts
    const appointmentStats = {
      total: appointments.length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
    };

    // Department distribution for today's appointments
    const departmentCounts = todayAppointments.reduce((acc, apt) => {
      const dept = apt.departmentName || 'General';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Recent 5 notifications/activities (could be from appointments, contacts, etc.)
    const recentActivities = [
      ...appointments.map(apt => ({
        type: 'appointment',
        title: `Appointment ${apt.status}`,
        description: `${apt.firstName} ${apt.lastName} with Dr. ${apt.doctorName}`,
        time: apt.createdAt?.seconds ? new Date(apt.createdAt.seconds * 1000) : new Date(),
        icon: <Calendar className="w-4 h-4" />
      })),
      ...contacts.map(contact => ({
        type: 'contact',
        title: 'New Contact Request',
        description: `${contact.name} sent a message`,
        time: contact.createdAt?.seconds ? new Date(contact.createdAt.seconds * 1000) : new Date(),
        icon: <MessageCircle className="w-4 h-4" />
      }))
    ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);
    
    // Doctor availability calculation
    const availableDoctors = doctors.filter(d => d.verified !== false);
    const doctorStatuses = {
      available: Math.floor(availableDoctors.length * 0.7), // 70% available (simulated data)
      busy: Math.floor(availableDoctors.length * 0.2), // 20% busy
      unavailable: Math.ceil(availableDoctors.length * 0.1) // 10% unavailable
    };

    // Format time elapsed from now
    const getTimeAgo = (date: Date) => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
    };

    return (
      <AdminLayout>
      <div className="space-y-8">
        {/* Header with welcome and date */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back, Admin</h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your hospital today.
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Appointments */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  {todayAppointments.length}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Today's Appointments</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {todayAppointments.length === 0 ? "No appointments scheduled today" : 
                 `${appointmentStats.confirmed} confirmed, ${appointmentStats.pending} pending`}
              </p>
              
              {/* Department distribution */}
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(departmentCounts).map(([dept, count], index) => (
                  <span key={dept} className={`px-2 py-1 text-xs rounded-full text-white
                    ${index % 4 === 0 ? 'bg-blue-500' : 
                      index % 4 === 1 ? 'bg-green-500' : 
                      index % 4 === 2 ? 'bg-purple-500' : 'bg-amber-500'}`}>
                    {dept} ({Number(count)})
                  </span>
                ))}
                {Object.keys(departmentCounts).length === 0 && (
                  <span className="text-xs text-muted-foreground">No departments scheduled</span>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-background/60 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => {
                  setActiveTab('appointments');
                  // Default to showing upcoming appointments when clicking from dashboard
                  setAppointmentFilter('upcoming');
                  // Show a welcome notification
                  toast.info('Showing your upcoming appointments', {
                    description: 'You can filter by status or view past appointments',
                    duration: 4000
                  });
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Appointments
              </Button>
            </div>
          </motion.div>

          {/* Doctor Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-foreground">{doctors.length}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Doctors Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {doctors.length === 0 ? "No doctors registered" : `${doctorStatuses.available} available now`}
              </p>
              
              {/* Doctor availability chart */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Available</span>
                  <span>Busy</span>
                  <span>Unavailable</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full flex overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${(doctorStatuses.available / doctors.length) * 100}%` }}></div>
                  <div className="bg-amber-500 h-full" style={{ width: `${(doctorStatuses.busy / doctors.length) * 100}%` }}></div>
                  <div className="bg-red-500 h-full" style={{ width: `${(doctorStatuses.unavailable / doctors.length) * 100}%` }}></div>
                </div>
                
                {/* Doctor avatars */}
                {doctors.length > 0 && (
                  <div className="flex mt-3 -space-x-2 overflow-hidden">
                    {doctors.slice(0, 5).map((doctor, index) => (
                      <div key={doctor.id} className="inline-block h-8 w-8 rounded-full border-2 border-white overflow-hidden" style={{ zIndex: 5-index }}>
                        {doctor.image ? (
                          <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                            {doctor.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    {doctors.length > 5 && (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium">
                        +{doctors.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-background/60 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => setActiveTab('doctors')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Manage Doctors
              </Button>
            </div>
          </motion.div>

          {/* Services Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-foreground">{services.length}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Active Services</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {services.filter(s => s.visible).length} visible, {services.filter(s => !s.visible).length} hidden
              </p>
              
              {/* Service categories */}
              <div className="mt-3">
                {services.length > 0 ? (
                  <div className="space-y-2">
                    {Array.from(new Set(services.map(s => s.category || 'Uncategorized'))).slice(0, 3).map((category, idx) => {
                      const count = services.filter(s => (s.category || 'Uncategorized') === category).length;
                      const percentage = Math.round((count / services.length) * 100);
                      
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-xs font-medium">{category}</span>
                          <div className="flex items-center">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mr-2">
                              <div 
                                className={`h-full ${idx % 3 === 0 ? 'bg-green-500' : idx % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">No services available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-background/60 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => setActiveTab('services')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Services
              </Button>
            </div>
          </motion.div>

          {/* Contact Inquiries */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  {contacts.length}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Contact Inquiries</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {contacts.length === 0 ? "No pending inquiries" : `${contacts.length} inquiries to respond`}
              </p>
              
              {/* Recent contacts */}
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.slice(0, 2).map((contact) => (
                    <div key={contact.id} className="text-xs bg-muted/30 p-2 rounded-lg">
                      <div className="font-medium truncate">{contact.name}</div>
                      <div className="text-muted-foreground truncate">{contact.message?.substring(0, 30)}...</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">Your inbox is empty</p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-background/60 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => setActiveTab('contacts')}
              >
                <Mail className="w-4 h-4 mr-2" />
                View All Messages
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Middle Row - Appointment Status & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment Status Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="lg:col-span-2 rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Appointment Analytics
                </h3>
                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground mr-2">
                    Total: {appointmentStats.total}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-primary/80"></div>
                    <span className="text-xs">Today: {todayAppointments.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enhanced Chart */}
                <div className="h-64">
                  <div className="flex h-full items-end gap-4">
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="w-full bg-primary/80 rounded-t-md relative group"
                          style={{ height: `${(appointmentStats.confirmed / Math.max(1, appointmentStats.total)) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round((appointmentStats.confirmed / Math.max(1, appointmentStats.total)) * 100)}% ({appointmentStats.confirmed})
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-medium">Confirmed</span>
                        <div className="flex items-center">
                          <span className="font-bold">{appointmentStats.confirmed}</span>
                          {appointmentStats.confirmed > 0 && (
                            <span className="text-xs text-success ml-1">
                              ({Math.round((appointmentStats.confirmed / Math.max(1, appointmentStats.total)) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="w-full bg-yellow-500/80 rounded-t-md relative group"
                          style={{ height: `${(appointmentStats.pending / Math.max(1, appointmentStats.total)) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round((appointmentStats.pending / Math.max(1, appointmentStats.total)) * 100)}% ({appointmentStats.pending})
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-medium">Pending</span>
                        <div className="flex items-center">
                          <span className="font-bold">{appointmentStats.pending}</span>
                          {appointmentStats.pending > 0 && (
                            <span className="text-xs text-amber-500 ml-1">
                              ({Math.round((appointmentStats.pending / Math.max(1, appointmentStats.total)) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="w-full bg-red-500/80 rounded-t-md relative group"
                          style={{ height: `${(appointmentStats.cancelled / Math.max(1, appointmentStats.total)) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round((appointmentStats.cancelled / Math.max(1, appointmentStats.total)) * 100)}% ({appointmentStats.cancelled})
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-medium">Cancelled</span>
                        <div className="flex items-center">
                          <span className="font-bold">{appointmentStats.cancelled}</span>
                          {appointmentStats.cancelled > 0 && (
                            <span className="text-xs text-red-500 ml-1">
                              ({Math.round((appointmentStats.cancelled / Math.max(1, appointmentStats.total)) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <div className="w-full flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500/80 rounded-t-md relative group"
                          style={{ height: `${(appointmentStats.completed / Math.max(1, appointmentStats.total)) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round((appointmentStats.completed / Math.max(1, appointmentStats.total)) * 100)}% ({appointmentStats.completed})
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-medium">Completed</span>
                        <div className="flex items-center">
                          <span className="font-bold">{appointmentStats.completed}</span>
                          {appointmentStats.completed > 0 && (
                            <span className="text-xs text-blue-500 ml-1">
                              ({Math.round((appointmentStats.completed / Math.max(1, appointmentStats.total)) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Department distribution and weekly heatmap combined */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-primary" />
                      This Week's Distribution
                    </h4>
                    
                    {/* Weekly heatmap - improved with tooltips */}
                    <div className="flex space-x-1 justify-between">
                      {Array.from({ length: 7 }).map((_, index) => {
                        // Calculate date for this weekday
                        const date = new Date();
                        date.setDate(date.getDate() - date.getDay() + index);
                        const dateStr = date.toISOString().split('T')[0];
                        
                        // Count appointments for this day
                        const count = appointments.filter(apt => {
                          if (!apt.date) return false;
                          const aptDate = apt.date.seconds 
                            ? new Date(apt.date.seconds * 1000).toISOString().split('T')[0]
                            : new Date(apt.date).toISOString().split('T')[0];
                          return aptDate === dateStr;
                        }).length;
                        
                        // Calculate intensity for heatmap (0-4)
                        const max = Math.max(
                          5,
                          ...Object.values(
                            appointments
                              .map(a => {
                                if (!a.date) return null;
                                const aptDate = a.date.seconds
                                  ? new Date(a.date.seconds * 1000).toISOString().split('T')[0]
                                  : new Date(a.date).toISOString().split('T')[0];
                                return aptDate;
                              })
                              .filter((date): date is string => !!date)
                              .reduce((acc, date) => {
                                acc[date] = (acc[date] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                          )
                        );
                        
                        const intensity = Math.min(4, Math.ceil((count / max) * 4));
                        const today = new Date().toISOString().split('T')[0] === dateStr;
                        
                        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                        
                        return (
                          <div key={index} className="flex flex-col items-center group relative">
                            <div className="text-xs text-muted-foreground mb-1">
                              {dayLabels[index]}
                            </div>
                            <div 
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                                today ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary/30' : 
                                intensity === 0 ? 'bg-muted/30 text-muted-foreground' :
                                intensity === 1 ? 'bg-blue-100 text-blue-800' :
                                intensity === 2 ? 'bg-blue-200 text-blue-800' :
                                intensity === 3 ? 'bg-blue-300 text-blue-800' :
                                'bg-blue-400 text-white'
                              }`}
                            >
                              {date.getDate()}
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {count} appointment{count !== 1 ? 's' : ''} on {date.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs mt-1 font-medium">
                              {count > 0 ? count : '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Top departments */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <Building className="w-4 h-4 mr-1 text-primary" />
                      Top Departments
                    </h4>
                    
                    {Object.entries(
                      appointments.reduce((acc, apt) => {
                        const dept = apt.departmentName || 'General';
                        acc[dept] = (acc[dept] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => Number(b) - Number(a))
                      .slice(0, 3)
                      .map(([dept, count], index) => (
                        <div key={dept} className="mb-2">
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1.5 ${
                                index === 0 ? 'bg-primary' : 
                                index === 1 ? 'bg-blue-500' : 
                                'bg-purple-500'
                              }`}></div>
                              <span className="text-sm font-medium">{dept}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{Number(count)} appts.</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                index === 0 ? 'bg-primary' : 
                                index === 1 ? 'bg-blue-500' : 
                                'bg-purple-500'
                              }`}
                              style={{ width: `${(Number(count) / Number(appointmentStats.total)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    }
                    
                    {/* Time distribution */}
                    <h4 className="text-sm font-medium text-foreground mt-5 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-primary" />
                      Time Distribution
                    </h4>
                    
                    {/* Calculate actual time distribution from appointments */}
                    {(() => {
                      const timeSlots = {
                        morning: { count: 0, label: 'Morning', color: 'bg-blue-500' },
                        afternoon: { count: 0, label: 'Afternoon', color: 'bg-amber-500' },
                        evening: { count: 0, label: 'Evening', color: 'bg-purple-500' }
                      };
                      
                      appointments.forEach(apt => {
                        if (!apt.time) return;
                        
                        const hour = parseInt(apt.time.split(':')[0]);
                        
                        if (hour < 12) timeSlots.morning.count++;
                        else if (hour < 17) timeSlots.afternoon.count++;
                        else timeSlots.evening.count++;
                      });
                      
                      const total = Object.values(timeSlots).reduce((sum, { count }) => sum + count, 0);
                      
                      return (
                        <>
                          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden flex">
                            {Object.values(timeSlots).map((slot, idx) => (
                              <div 
                                key={idx} 
                                className={`h-full ${slot.color}`} 
                                style={{ width: `${total ? (slot.count / total) * 100 : 0}%` }}
                              ></div>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            {Object.values(timeSlots).map((slot, idx) => (
                              <span key={idx}>{slot.label} ({total ? Math.round((slot.count / total) * 100) : 0}%)</span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Actionable insights */}
                <div className="mt-6 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-primary">
                      <path fillRule="evenodd" d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z" clipRule="evenodd" />
                    </svg>
                    Insights & Recommendations
                  </h4>
                  <ul className="text-xs space-y-1.5">
                    {appointmentStats.pending > 5 && (
                      <li className="flex items-start">
                        <div className="text-amber-500 mr-1.5 mt-0.5"><Circle className="w-2 h-2 fill-current" /></div>
                        <span>You have {appointmentStats.pending} pending appointments that require confirmation</span>
                      </li>
                    )}
                    {todayAppointments.length > 0 && (
                      <li className="flex items-start">
                        <div className="text-primary mr-1.5 mt-0.5"><Circle className="w-2 h-2 fill-current" /></div>
                        <span>Today's schedule has {todayAppointments.length} appointments</span>
                      </li>
                    )}
                    {(() => {
                      const cancellationRate = appointmentStats.total > 0 
                        ? (appointmentStats.cancelled / appointmentStats.total) * 100
                        : 0;
                        
                      if (cancellationRate > 15) {
                        return (
                          <li className="flex items-start">
                            <div className="text-red-500 mr-1.5 mt-0.5"><Circle className="w-2 h-2 fill-current" /></div>
                            <span>High cancellation rate ({Math.round(cancellationRate)}%) - Consider implementing appointment reminders</span>
                          </li>
                        );
                      }
                      return null;
                    })()}
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-muted/10 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Last updated: just now</span>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('appointments')}
                  className="text-primary"
                >
                  View Detailed Reports
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-muted/10 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Last updated: just now</span>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('appointments')}
                className="text-primary"
              >
                View Detailed Reports
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>

          {/* Quick Actions Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    resetDoctorForm();
                    setActiveTab('doctors');
                    setShowAddDoctorModal(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2 text-green-500" />
                  Add New Doctor
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/admin/patients')}
                >
                  <Users className="w-4 h-4 mr-2 text-indigo-500" />
                  Manage Patients
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('services');
                    setServiceToEdit(null);
                    setIsServiceFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2 text-blue-500" />
                  Create New Service
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('appointments')}
                >
                  <CheckSquare className="w-4 h-4 mr-2 text-amber-500" />
                  Review Appointments
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('contacts')}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-purple-500" />
                  Respond to Inquiries
                  {contacts.length > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center">
                      {contacts.length > 9 ? '9+' : contacts.length}
                    </span>
                  )}
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                  Generate Reports
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row - Recent Activities & Weekly Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities/Notifications */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="lg:col-span-2 rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-primary" />
                  Recent Activities
                </h3>
                
                {recentActivities.length > 0 && (
                  <Button variant="outline" size="sm">
                    Mark All Read
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border border-border flex ${
                        index === 0 ? 'bg-primary/5' : 'bg-background'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${
                        activity.type === 'appointment' ? 'bg-blue-100 text-blue-600' : 
                        activity.type === 'contact' ? 'bg-green-100 text-green-600' : 
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-foreground">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(activity.time)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-foreground font-medium">No Recent Activities</h4>
                    <p className="text-sm text-muted-foreground">
                      New activities will appear here as they happen
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {recentActivities.length > 0 && (
              <div className="px-6 py-3 bg-muted/10 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-center"
                >
                  View All Activities
                </Button>
              </div>
            )}
          </motion.div>

          {/* Hospital Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="rounded-xl border border-border overflow-hidden"
            whileHover={{ scale: 1.01, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.15)" }}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Hospital Stats</h3>
              </div>
              
              {/* Stats rows */}
              <div className="space-y-5">
                {/* Bed occupancy */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Bed Occupancy</span>
                    <span className="text-sm text-muted-foreground">76%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '76%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>152/200 beds</span>
                    <span className="text-green-600">24 available</span>
                  </div>
                </div>
                
                {/* Emergency room status */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Emergency Room</span>
                    <span className="text-sm text-muted-foreground">55%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: '55%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>11/20 beds</span>
                    <span className="text-green-600">Accepting patients</span>
                  </div>
                </div>
                
                {/* Surgery rooms */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Surgery Rooms</span>
                    <span className="text-sm text-muted-foreground">83%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: '83%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5/6 rooms</span>
                    <span className="text-amber-600">Limited availability</span>
                  </div>
                </div>
                
                {/* Staff on duty */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Staff On Duty</span>
                    <span className="text-sm text-muted-foreground">65/80</span>
                  </div>
                  <div className="flex space-x-1 mt-1">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div 
                        key={index} 
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                          index < 8 ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {index < 8 ? ((index + 1) * 8) + '%' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-muted/10 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last updated: 5 minutes ago</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-primary hover:text-primary hover:bg-transparent hover:underline"
                >
                  View Details
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </AdminLayout>
    );
  }

  // Render doctors tab content
  function renderDoctors() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Doctors Management</h2>
          <Button
            variant="primary"
            onClick={() => {
              resetDoctorForm();
              setShowAddDoctorModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        </div>
        
        <DoctorGrid
          doctors={doctors}
          onEdit={(doctor) => {
            setEditingDoctor(doctor);
            setShowAddDoctorModal(true);
          }}
          onDelete={confirmDeleteDoctor}
        />
        
        {/* Add Doctor Modal */}
        <DoctorFormDrawer
          isOpen={showAddDoctorModal}
          onClose={() => {
            setShowAddDoctorModal(false);
            resetDoctorForm();
          }}
          doctorData={editingDoctor}
          onSubmit={handleDoctorSubmit}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          handleImageChange={handleImageChange}
          imagePreview={imagePreview}
          resetForm={resetDoctorForm}
        />
      </div>
    );
  }

  // Update this function inside your AdminDashboard component to fix the closing tag issues
  function renderServices() {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Services Management</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('servicesViewMode', 'grid');
                }}
                className="rounded-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => {
                  setViewMode('table');
                  localStorage.setItem('servicesViewMode', 'table');
                }}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="primary"
              onClick={() => {
                setServiceToEdit(null);
                setIsServiceFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="p-12 text-center bg-muted/30 rounded-xl border border-border">
            <h3 className="text-xl font-semibold mb-3">No services found</h3>
            <p className="text-muted-foreground mb-6">
              Add your first service to display it on the website.
            </p>
            <Button 
              variant="primary"
              onClick={() => {
                setServiceToEdit(null);
                setIsServiceFormOpen(true);
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Service
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} premium className="h-full overflow-hidden group">
                {/* Card Header with Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                  {service.imageUrl ? (
                    <img 
                      src={service.imageUrl} 
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                        <Info className="w-10 h-10 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  
                  {/* Service Name Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                    <div className="p-4 w-full">
                      <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    </div>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {service.shortDescription || service.description}
                  </p>
                  
                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.visible ? (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Visible
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm" className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </Badge>
                    )}
                    
                    {service.available24h && (
                      <Badge variant="info" size="sm" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        24/7
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 pt-2 flex items-center justify-between mt-auto border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Order: <span className="font-medium">{service.order}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setServiceToEdit(service);
                        setIsServiceFormOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setServiceToDelete(service);
                        setIsServiceDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-primary hover:bg-primary/10"
                      onClick={() => toggleServiceVisibility(service)}
                    >
                      {service.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card premium className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Order</th>
                    <th className="text-left p-4 font-medium text-foreground">Service</th>
                    <th className="text-left p-4 font-medium text-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-foreground">24/7</th>
                    <th className="text-right p-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-t border-border hover:bg-muted/10">
                      <td className="p-4 text-center w-16">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground">
                          {service.order}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted mr-3">
                            {service.imageUrl ? (
                              <img 
                                src={service.imageUrl} 
                                alt={service.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Info className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                              {service.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {service.category || 'Uncategorized'}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleServiceVisibility(service)}
                          className={service.visible ? "text-success" : "text-muted-foreground"}
                        >
                          {service.visible ? (
                            <Eye className="w-4 h-4 mr-1" />
                          ) : (
                            <EyeOff className="w-4 h-4 mr-1" />
                          )}
                          {service.visible ? 'Visible' : 'Hidden'}
                        </Button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setServiceToEdit(service);
                              setIsServiceFormOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setServiceToDelete(service);
                              setIsServiceDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <a
                            href={`/services#${service.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-500 hover:text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Service Form Drawer */}
        {isServiceFormOpen && (
          <ServiceFormDrawer
            isOpen={isServiceFormOpen}
            onClose={() => setIsServiceFormOpen(false)}
            service={serviceToEdit}
            onSave={(updatedService) => {
              if (serviceToEdit) {
                setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
                toast.success('Service updated successfully');
              } else {
                setServices([...services, updatedService]);
                toast.success('Service added successfully');
              }
              setIsServiceFormOpen(false);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {isServiceDeleteDialogOpen && serviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Delete Service</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{serviceToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsServiceDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    deleteServiceItem(serviceToDelete.id);
                    setIsServiceDeleteDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

// WhatsApp contact handler
const handleWhatsAppContact = (
  phone: string,
  name?: string,
  isAppointment?: boolean,
  appointmentData?: any
) => {
  // Remove non-digit characters and ensure country code (assume +91 for India if not present)
  let cleanedPhone = phone.replace(/\D/g, '');
  if (!cleanedPhone.startsWith('91') && cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone;
  }

  let message = '';

  if (isAppointment && typeof appointmentData !== 'undefined') {
    // Professional appointment confirmation message with all details
    const formattedDate = formatDate(appointmentData.date);
    message = `Dear ${name},

*MediCare+ Hospital - Appointment Confirmation*

We are pleased to confirm your appointment with Dr. ${appointmentData.doctorName} in our ${appointmentData.departmentName} department.

*Appointment Details:*
📅 Date: ${formattedDate}
🕒 Time: ${appointmentData.time}
👨‍⚕️ Doctor: Dr. ${appointmentData.doctorName}
🏥 Department: ${appointmentData.departmentName}
📝 Reference ID: ${appointmentData.id?.substring(0, 8).toUpperCase()}

Please arrive 15 minutes before your scheduled appointment time. Kindly bring your ID and any relevant medical records or test results.

For any questions or to reschedule, please contact our reception at +91-8080808080.

Thank you for choosing MediCare+ for your healthcare needs.

Best regards,
MediCare+ Hospital
`;
  } else if (isAppointment) {
    // Generic appointment message if no detailed data is available
    message = `Dear ${name},

This is from MediCare+ Hospital regarding your recent appointment booking. 

We would like to confirm the details of your appointment. Please respond with a convenient time for us to discuss your appointment details.

Thank you for choosing MediCare+ for your healthcare needs.

Best regards,
MediCare+ Hospital Team
`;
  } else {
    // General contact message
    message = `Dear ${name},

Thank you for contacting MediCare+ Hospital. 

We have received your inquiry and would like to provide you with the information you need. Please let us know a convenient time to discuss your requirements in detail.

Best regards,
MediCare+ Hospital Team
`;
  }

  const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

  // Phone call handler
  const handlePhoneCall = (phone: string) => {
    // Remove non-digit characters
    const cleanedPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanedPhone}`, '_self');
  };

  // Email contact handler with professional templated message
  const handleEmailContact = (
    email: string,
    name?: string,
    subject?: string,
    isAppointment?: boolean,
    appointmentData?: any
  ) => {
    let mailSubject, body;
    
    if (isAppointment && appointmentData) {
      // Professional email subject with reference ID
      mailSubject = `MediCare+ Hospital: Appointment Confirmation [Ref: ${appointmentData.id?.substring(0, 8).toUpperCase()}]`;
      
      // Professional appointment email with all details
      const formattedDate = formatDate(appointmentData.date);
      body = `Dear ${name},

We are pleased to confirm your appointment at MediCare+ Hospital.

APPOINTMENT DETAILS:
-------------------
Patient Name: ${appointmentData.firstName} ${appointmentData.lastName}
Date: ${formattedDate}
Time: ${appointmentData.time}
Doctor: Dr. ${appointmentData.doctorName}
Department: ${appointmentData.departmentName}
Reference ID: ${appointmentData.id?.substring(0, 8).toUpperCase()}

IMPORTANT INFORMATION:
--------------------
• Please arrive 15 minutes prior to your appointment time
• Bring your ID and insurance card (if applicable)
• Bring any relevant medical reports or test results
• Follow any specific preparation instructions provided for your appointment
• Wear a mask as per hospital policy

If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance at +91-8080808080 or reply to this email.

Thank you for choosing MediCare+ Hospital for your healthcare needs. We look forward to providing you with exceptional care.

Best regards,
MediCare+ Hospital Team
`;
    } else if (isAppointment) {
      // Generic appointment email if no detailed data is available
      mailSubject = "MediCare+ Hospital: Your Appointment Information";
      body = `Dear ${name},

Thank you for booking an appointment with MediCare+ Hospital.

We are contacting you regarding your recent appointment booking. To ensure we have all the necessary information and to provide you with the best care possible, we may need to discuss a few details with you.

Please call us at +91-8080808080 or reply to this email at your earliest convenience.

Thank you for choosing MediCare+ Hospital for your healthcare needs.

Best regards,
MediCare+ Hospital Team
`;
    } else {
      // Response to contact inquiry
      mailSubject = subject ? `Re: ${subject}` : "Response from MediCare+ Hospital";
      body = `Dear ${name},

Thank you for contacting MediCare+ Hospital.

We have received your inquiry${subject ? ` regarding "${subject}"` : ''}. Our team is reviewing your request and will provide you with a detailed response as soon as possible.

If your matter is urgent, please contact our customer service team directly at +91-8080808080.

Thank you for considering MediCare+ Hospital for your healthcare needs.

Best regards,
MediCare+ Hospital Team
`;
    }
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Main render
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex flex-wrap items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'appointments' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </Button>
          <Button
            variant={activeTab === 'doctors' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('doctors')}
          >
            Doctors
          </Button>
          <Button
            variant={activeTab === 'patients' ? 'primary' : 'outline'}
            onClick={() => navigate('/admin/patients')}
          >
            Patients
          </Button>
          <Button
            variant={activeTab === 'services' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('services')}
          >
            Services
          </Button>
          <Button
            variant={activeTab === 'contacts' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'appointments' && renderAppointments(
            appointments,
            appointmentFilter,
            appointmentSearch,
            setAppointmentFilter,
            setAppointmentSearch,
            isExporting,
            setIsExporting,
            expandedAppointmentId,
            setExpandedAppointmentId,
            updateAppointmentStatus,
            deleteAppointment,
            handleWhatsAppContact,
            handleEmailContact,
            handlePhoneCall
          )}
          {activeTab === 'doctors' && renderDoctors()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'contacts' && renderContacts(
            contacts,
            deleteContact,
            handleWhatsAppContact,
            handleEmailContact
          )}
        </>
      )}
    </div>
  );
}

// Add this function before export default AdminDashboard
function renderAppointments(
  appointments: any[],
  appointmentFilter: string,
  appointmentSearch: string,
  setAppointmentFilter: React.Dispatch<React.SetStateAction<string>>,
  setAppointmentSearch: React.Dispatch<React.SetStateAction<string>>,
  isExporting: boolean,
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>,
  expandedAppointmentId: string | null,
  setExpandedAppointmentId: React.Dispatch<React.SetStateAction<string | null>>,
  updateAppointmentStatus: (appointmentId: string, newStatus: string) => void,
  deleteAppointment: (appointmentId: string) => void,
  handleWhatsAppContact: (phone: string, name?: string, isAppointment?: boolean, appointmentData?: any) => void,
  handleEmailContact: (email: string, name?: string, subject?: string, isAppointment?: boolean, appointmentData?: any) => void,
  handlePhoneCall: (phone: string) => void
) {
  // Separate past and upcoming appointments
  const currentDate = new Date();
  
  const pastAppointments = appointments.filter(apt => {
    const aptDate = apt.date?.seconds 
      ? new Date(apt.date.seconds * 1000) 
      : new Date(apt.date);
    return aptDate < currentDate || apt.status === 'completed' || apt.status === 'cancelled';
  });
  
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = apt.date?.seconds 
      ? new Date(apt.date.seconds * 1000) 
      : new Date(apt.date);
    return aptDate >= currentDate && apt.status !== 'completed' && apt.status !== 'cancelled';
  });

  // Filter appointments based on selected filter and timeframe
  const filteredAppointments = appointments.filter(apt => {
    // Filter by status
    if (appointmentFilter !== 'all' && appointmentFilter !== 'past' && appointmentFilter !== 'upcoming' && apt.status !== appointmentFilter) {
      return false;
    }
    
    // Filter by timeframe (past/upcoming)
    if (appointmentFilter === 'past') {
      const aptDate = apt.date?.seconds 
        ? new Date(apt.date.seconds * 1000) 
        : new Date(apt.date);
      if (!(aptDate < currentDate || apt.status === 'completed' || apt.status === 'cancelled')) {
        return false;
      }
    }
    
    if (appointmentFilter === 'upcoming') {
      const aptDate = apt.date?.seconds 
        ? new Date(apt.date.seconds * 1000) 
        : new Date(apt.date);
      if (!(aptDate >= currentDate && apt.status !== 'completed' && apt.status !== 'cancelled')) {
        return false;
      }
    }
    
    // Search filter - check multiple fields
    if (appointmentSearch.trim() !== '') {
      const search = appointmentSearch.toLowerCase();
      const searchableFields = [
        apt.firstName,
        apt.lastName,
        apt.email,
        apt.phone,
        apt.doctorName,
        apt.departmentName,
        apt.reason
      ];
      
      // Check if any field contains the search term
      return searchableFields.some(field => 
        field && field.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Get status counts for badges
  const statusCounts = {
    all: appointments.length,
    upcoming: upcomingAppointments.length,
    past: pastAppointments.length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length
  };

  // Function to export appointments as CSV
  const exportAppointments = () => {
    setIsExporting(true);
    
    try {
      // Headers for CSV
      const headers = [
        'Patient Name',
        'Email',
        'Phone',
        'Department',
        'Doctor',
        'Date',
        'Time',
        'Status',
        'Created At'
      ].join(',');
      
      // Map appointments to CSV rows
      const rows = filteredAppointments.map(apt => {
        const createdDate = apt.createdAt?.seconds 
          ? new Date(apt.createdAt.seconds * 1000).toISOString() 
          : '';
          
        const appointmentDate = apt.date?.seconds 
          ? new Date(apt.date.seconds * 1000).toLocaleDateString() 
          : apt.date;
          
        return [
          `"${apt.firstName || ''} ${apt.lastName || ''}"`,
          `"${apt.email || ''}"`,
          `"${apt.phone || ''}"`,
          `"${apt.departmentName || ''}"`,
          `"${apt.doctorName || ''}"`,
          `"${appointmentDate || ''}"`,
          `"${apt.time || ''}"`,
          `"${apt.status || ''}"`,
          `"${createdDate}"`
        ].join(',');
      }).join('\n');
      
      // Create and download the CSV file
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `appointments-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export appointments');
    } finally {
      setIsExporting(false);
    }
  };

  // Status badge color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-primary" />
            Appointments Management
          </h2>
          <p className="text-muted-foreground mt-1">
            View and manage all patient appointments, past and upcoming
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAppointmentFilter('upcoming')}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming ({statusCounts.upcoming})
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAppointmentFilter('past')}
            className="bg-amber-50 text-amber-700 hover:bg-amber-200 border-amber-200"
          >
            <Clock className="w-4 h-4 mr-2" />
            Past ({statusCounts.past})
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportAppointments}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'upcoming', 'past', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <Button
              key={status}
              variant={appointmentFilter === status ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setAppointmentFilter(status)}
              className={`capitalize ${status === 'upcoming' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800' : status === 'past' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800' : ''} ${appointmentFilter === status ? '!bg-primary !text-primary-foreground' : ''}`}
            >
              {status}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                {statusCounts[status]}
              </span>
            </Button>
          ))}
        </div>
        
        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={appointmentSearch}
            onChange={e => setAppointmentSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all w-full sm:w-64"
          />
          {appointmentSearch && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0" 
              onClick={() => setAppointmentSearch('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Appointments Table */}
      {filteredAppointments.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Patient</th>
                  <th className="text-left p-4 font-medium text-foreground">Appointment</th>
                  <th className="text-left p-4 font-medium text-foreground">Doctor</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <React.Fragment key={appointment.id}>
                    <tr 
                      className={`border-t border-border hover:bg-muted/10 ${
                        expandedAppointmentId === appointment.id ? 'bg-muted/5' : ''
                      } ${isPastAppointment(appointment) ? 'bg-muted/20' : ''}`}
                      onClick={() => setExpandedAppointmentId(
                        expandedAppointmentId === appointment.id ? null : appointment.id
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {appointment.firstName} {appointment.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.email}
                            </div>
                            {appointment.createdAt && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Booked on: {formatDate(appointment.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground flex items-center">
                          <Calendar className={`w-4 h-4 mr-2 ${isPastAppointment(appointment) ? 'text-amber-500' : 'text-primary'}`} />
                          <span className="flex items-center">
                            {formatDisplayDate(appointment.date)}
                            {isPastAppointment(appointment) ? (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">Past</span>
                            ) : (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">Upcoming</span>
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {appointment.time || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">
                          {appointment.doctorName || 'Not assigned'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.departmentName || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <Badge 
                            variant={getStatusColor(appointment.status)} 
                            size="sm"
                            className="capitalize"
                          >
                            {appointment.status || 'pending'}
                          </Badge>
                          
                          {/* Show timestamp of when status was last updated */}
                          {appointment.statusUpdatedAt && (
                            <div className="text-xs text-muted-foreground">
                              Updated: {formatDate(appointment.statusUpdatedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {/* Status update buttons conditionally shown based on current status */}
                          {appointment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success hover:text-success hover:bg-success/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(appointment.id, 'confirmed');
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(appointment.id, 'completed');
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {appointment.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus(appointment.id, 'cancelled');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this appointment?')) {
                                deleteAppointment(appointment.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded details row */}
                    {expandedAppointmentId === appointment.id && (
                      <tr className="bg-muted/5 border-t border-border">
                        <td colSpan={5} className="p-4">
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                Patient Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Full Name:</span>
                                  <span className="font-medium">{appointment.firstName} {appointment.lastName}</span>
                                </div>
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Email:</span>
                                  <a href={`mailto:${appointment.email}`} className="text-primary hover:underline">
                                    {appointment.email}
                                  </a>
                                </div>
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Phone:</span>
                                  <a href={`tel:${appointment.phone}`} className="text-primary hover:underline">
                                    {appointment.phone}
                                  </a>
                                </div>
                                {appointment.createdAt && (
                                  <div className="flex">
                                    <span className="text-muted-foreground w-24">Created:</span>
                                    <span>
                                      {appointment.createdAt.seconds
                                        ? new Date(appointment.createdAt.seconds * 1000).toLocaleString()
                                        : new Date(appointment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Appointment Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Doctor:</span>
                                  <span className="font-medium">{appointment.doctorName || 'Not assigned'}</span>
                                </div>
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Department:</span>
                                  <span>{appointment.departmentName || 'N/A'}</span>
                                </div>
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Date:</span>
                                  <span>{formatDisplayDate(appointment.date)}</span>
                                </div>
                                <div className="flex">
                                  <span className="text-muted-foreground w-24">Time:</span>
                                  <span>{appointment.time || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Additional Info
                              </h4>
                              <div className="space-y-2 text-sm">
                                {appointment.reason ? (
                                  <div>
                                    <span className="text-muted-foreground block mb-1">Reason:</span>
                                    <p className="bg-muted/30 p-2 rounded text-muted-foreground">
                                      {appointment.reason}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No additional information provided.</p>
                                )}
                              </div>
                              
                              {/* Appointment Status History */}
                              {appointment.statusHistory && appointment.statusHistory.length > 0 && (
                                <div className="mt-4 border-t border-border pt-3">
                                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Appointment History
                                  </h4>
                                  <div className="space-y-2">
                                    {appointment.statusHistory.map((history, idx) => (
                                      <div key={idx} className="text-xs flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                          history.status === 'confirmed' ? 'bg-green-500' :
                                          history.status === 'completed' ? 'bg-blue-500' :
                                          history.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                                        }`}></div>
                                        <span className="capitalize font-medium">{history.status}</span>
                                        <span className="mx-1">-</span>
                                        <span className="text-muted-foreground">
                                          {history.timestamp?.seconds 
                                            ? new Date(history.timestamp.seconds * 1000).toLocaleString()
                                            : new Date(history.timestamp).toLocaleString()}
                                        </span>
                                        {history.updatedBy && (
                                          <span className="ml-1 text-muted-foreground">
                                            by {history.updatedBy}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Contact Actions */}
                              <div className="mt-4 flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleWhatsAppContact(
                                    appointment.phone, 
                                    `${appointment.firstName} ${appointment.lastName}`,
                                    true,
                                    appointment
                                  )}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  WhatsApp
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEmailContact(
                                    appointment.email,
                                    `${appointment.firstName} ${appointment.lastName}`,
                                    "Appointment Information",
                                    true,
                                    appointment
                                  )}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  Email
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePhoneCall(appointment.phone)}
                                >
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-muted/30 rounded-xl border border-border">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-muted">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mt-4 mb-2">No appointments found</h3>
          <p className="text-muted-foreground mb-6">
            {appointmentSearch ? 'No appointments match your search criteria.' : 'There are no appointments yet.'}
          </p>
          {appointmentSearch && (
            <Button variant="outline" onClick={() => setAppointmentSearch('')}>
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Add this function before export default AdminDashboard
function renderContacts(
  contacts: any[],
  deleteContact: (contactId: string) => void,
  handleWhatsAppContact: (phone: string, name?: string) => void,
  handleEmailContact: (email: string, name?: string, subject?: string) => void
) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Contact Inquiries</h2>
      </div>
      {contacts.length === 0 ? (
        <div className="p-12 text-center bg-muted/30 rounded-xl border border-border">
          <h3 className="text-xl font-semibold mb-3">No contacts found</h3>
          <p className="text-muted-foreground mb-6">
            There are no contact inquiries yet.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-foreground">Email</th>
                  <th className="text-left p-4 font-medium text-foreground">Phone</th>
                  <th className="text-left p-4 font-medium text-foreground">Message</th>
                  <th className="text-right p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-border hover:bg-muted/10">
                    <td className="p-4">{contact.name}</td>
                    <td className="p-4">
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    </td>
                    <td className="p-4">
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    </td>
                    <td className="p-4">{contact.message}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsAppContact(contact.phone, contact.name)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmailContact(contact.email, contact.name, contact.subject)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this contact?')) {
                              deleteContact(contact.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
