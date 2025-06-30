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
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search, Filter, Star, Calendar, Users, Stethoscope, Building, Activity, 
  UserCheck, Plus, Edit, Trash2, MoreHorizontal, Upload, X, Check,
  UserCircle, MapPin, GraduationCap, BookOpen, Languages, Award, Mail, Phone, Eye,
  // Add these new imports for contact buttons
  MessageCircle, PhoneCall, Send
} from 'lucide-react';

import Card from '../../components/atoms/Card';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Badge from '../../components/atoms/Badge';

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
  availability?: Record<string, string[]>;
  createdAt?: any; // Firestore timestamp
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
  const [loading, setLoading] = useState(true);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  
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
      
      const storageRef = ref(storage, fileName);
      
      // If editing and has previous image, try to delete it
      if (editingDoctor?.image && editingDoctor.image.includes('firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = ref(storage, editingDoctor.image);
          await deleteObject(oldImageRef).catch(() => {
            console.log('Previous image not found or already deleted');
          });
        } catch (error) {
          console.error('Error deleting previous image:', error);
          // Continue with upload even if delete fails
        }
      }
      
      // Upload the new image
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(progress);
            
            // Update UI based on upload state
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
            }
          },
          (error) => {
            // Handle upload errors
            console.error('Error uploading image:', error);
            setIsUploading(false);
            setUploadError('Failed to upload image. Please try again.');
            reject(null);
          },
          async () => {
            // Handle successful upload
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              toast.success('Image uploaded successfully');
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              setIsUploading(false);
              setUploadError('Failed to process uploaded image.');
              reject(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in image upload process:', error);
      setIsUploading(false);
      setUploadError('An unexpected error occurred. Please try again.');
      return null;
    }
  };
  
  // Enhanced doctor submission with better image handling
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);
    
    try {
      // Validate form
      if (!doctorForm.name || !doctorForm.specialty) {
        toast.error('Name and Specialty are required');
        setIsSubmitting(false);
        return;
      }
      
      let doctorId = editingDoctor?.id;
      let imageUrl: string | null = null;
      
      // Upload image if present
      if (imageFile) {
        imageUrl = await uploadDoctorImage(doctorId);
        if (!imageUrl && uploadError) {
          setIsSubmitting(false);
          return; // Stop if image upload failed
        }
      } else if (editingDoctor?.image) {
        imageUrl = editingDoctor.image;
      }
      
      const doctorData = {
        ...doctorForm,
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
        
        // If we have a new image and a new doctor, update the image path to include the doctor ID
        if (imageUrl && imageFile) {
          // This could be further enhanced to move the file to a permanent location
          // but that would require a more complex setup with Cloud Functions
          console.log('New doctor created with ID:', docRef.id);
        }
        
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
  
  // Enhanced delete function with image cleanup
  const confirmDeleteDoctor = async (doctor: Doctor) => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      try {
        // Delete image from storage if exists
        if (doctor.image && doctor.image.includes('firebasestorage.googleapis.com')) {
          try {
            const imageRef = ref(storage, doctor.image);
            await deleteObject(imageRef);
            console.log('Doctor image deleted successfully');
          } catch (imageError) {
            console.error('Error deleting doctor image:', imageError);
            // Continue with deletion even if image delete fails
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

  const [viewingContact, setViewingContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

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

    setLoading(false);

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeAppointments();
      unsubscribeContacts();
      unsubscribeDoctors();
      unsubscribeFacilities();
    };
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (dateString?.toDate) {
        return dateString.toDate().toLocaleDateString();
      }
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const stats = [
    { 
      icon: Users, 
      label: 'Total Appointments', 
      value: appointments.length.toString(), 
      change: '+' + Math.floor(appointments.length * 0.1) + '%', 
      color: 'text-blue-600' 
    },
    { 
      icon: Calendar, 
      label: 'Pending Appointments', 
      value: appointments.filter(apt => apt.status === 'pending').length.toString(), 
      change: '+' + Math.floor(appointments.filter(apt => apt.status === 'pending').length * 0.05) + '%', 
      color: 'text-green-600' 
    },
    { 
      icon: Stethoscope, 
      label: 'Total Doctors', 
      value: doctors.length.toString(), 
      change: '+' + Math.floor(doctors.length * 0.08) + '%', 
      color: 'text-purple-600' 
    },
    { 
      icon: Activity, 
      label: 'Contact Messages', 
      value: contacts.length.toString(), 
      change: '+' + Math.floor(contacts.length * 0.15) + '%', 
      color: 'text-red-600' 
    },
    { 
      icon: Building, 
      label: 'Medical Facilities', 
      value: facilities.length.toString(), 
      change: '+' + Math.floor(facilities.length * 0.12) + '%', 
      color: 'text-orange-600' 
    },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} premium className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-success' : 'text-error'}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card premium className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Recent Appointments</h3>
          <div className="space-y-4">
            {appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{appointment.firstName} {appointment.lastName}</h4>
                  <p className="text-sm text-muted-foreground">{appointment.doctor} • {appointment.department}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(appointment.date)} • {appointment.time}</p>
                </div>
                <Badge variant={getStatusColor(appointment.status)} size="sm">
                  {appointment.status || 'pending'}
                </Badge>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No appointments yet</p>
            )}
          </div>
        </Card>

        <Card premium className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">Recent Contact Messages</h3>
          <div className="space-y-4">
            {contacts.slice(0, 5).map((contact) => (
              <div key={contact.id} className="p-4 border border-border rounded-xl">
                <h4 className="font-medium text-foreground">{contact.firstName} {contact.lastName}</h4>
                <p className="text-sm text-muted-foreground">{contact.subject}</p>
                <p className="text-sm text-muted-foreground truncate">{contact.message}</p>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No contact messages yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Appointments Management</h2>
        <Input
          placeholder="Search appointments..."
          className="max-w-xs"
          onChange={(e) => {
            // Add appointment search functionality here
            // This would filter appointments based on patient name, doctor, etc.
          }}
        />
      </div>

      <Card premium className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">Patient</th>
                <th className="text-left p-4 font-medium text-foreground">Doctor</th>
                <th className="text-left p-4 font-medium text-foreground">Department</th>
                <th className="text-left p-4 font-medium text-foreground">Date & Time</th>
                <th className="text-left p-4 font-medium text-foreground">Status</th>
                <th className="text-left p-4 font-medium text-foreground">Insurance</th>
                <th className="text-left p-4 font-medium text-foreground">Contact</th>
                <th className="text-left p-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-border hover:bg-muted/10">
                  <td className="p-4">
                    <div>
                      <p className="text-foreground font-medium">
                        {appointment.firstName} {appointment.lastName}
                        {appointment.isNewPatient && (
                          <Badge variant="primary" size="sm" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            New Patient
                          </Badge>
                        )}
                      </p>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="w-3 h-3 mr-1" />
                          {appointment.email}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 mr-1" />
                          {appointment.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">
                    <p className="font-medium">Dr. {appointment.doctorName}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {appointment.departmentName}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{formatDate(appointment.date)}</p>
                      <p className="text-sm">{appointment.time}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getStatusColor(appointment.status)} size="sm">
                      {appointment.status || 'pending'}
                    </Badge>
                    {appointment.paymentStatus && (
                      <Badge variant={appointment.paymentStatus === 'completed' ? 'success' : 'warning'} size="sm" className="ml-2">
                        {appointment.paymentStatus}
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    {appointment.insuranceProvider ? (
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{appointment.insuranceProvider}</p>
                        <p className="text-muted-foreground">{appointment.insuranceNumber}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not provided</span>
                    )}
                  </td>
                  
                  {/* New Contact cell */}
                  <td className="p-4">
                    <div className="flex space-x-1">
                      {appointment.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="WhatsApp"
                          onClick={() => handleWhatsAppContact(
                            appointment.phone, 
                            `${appointment.firstName} ${appointment.lastName}`,
                            true,
                            appointment // Pass the entire appointment object
                          )}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {appointment.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Send Email"
                          onClick={() => handleEmailContact(
                            appointment.email,
                            `${appointment.firstName} ${appointment.lastName}`,
                            'Your Appointment Details',
                            true,
                            appointment // Pass the entire appointment object
                          )}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {appointment.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Call"
                          onClick={() => handlePhoneCall(appointment.phone)}
                        >
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                  
                  {/* ...existing actions cell... */}
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-success/10 hover:text-success"
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingAppointment(appointment);
                          setShowAppointmentModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {appointments.length === 0 && (
        <Card premium className="p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No appointments found</p>
        </Card>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentModal && viewingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 bg-background border-b">
              <h3 className="text-xl font-semibold text-foreground">
                Appointment Details
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAppointmentModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Patient Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium text-foreground">{viewingAppointment.firstName} {viewingAppointment.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{viewingAppointment.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{viewingAppointment.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Type</p>
                      <p className="font-medium text-foreground">
                        {viewingAppointment.isNewPatient ? 'New Patient' : 'Existing Patient'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Appointment Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Doctor</p>
                      <p className="font-medium text-foreground">Dr. {viewingAppointment.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium text-foreground">{viewingAppointment.departmentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium text-foreground">
                        {formatDate(viewingAppointment.date)} at {viewingAppointment.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusColor(viewingAppointment.status)}>
                        {viewingAppointment.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Insurance Information */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Insurance Information</h4>
                {viewingAppointment.insuranceProvider ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <p className="font-medium text-foreground">{viewingAppointment.insuranceProvider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Policy Number</p>
                      <p className="font-medium text-foreground">{viewingAppointment.insuranceNumber}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No insurance information provided</p>
                )}
              </div>
              
              {/* Additional Notes/Reason */}
              {viewingAppointment.message && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-3">Visit Reason / Additional Notes</h4>
                  <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg">{viewingAppointment.message}</p>
                </div>
              )}
              
              {/* Add Contact Options */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Contact Patient</h4>
                <div className="flex flex-wrap gap-3">
                  {viewingAppointment.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleWhatsAppContact(
                        viewingAppointment.phone, 
                        `${viewingAppointment.firstName} ${viewingAppointment.lastName}`,
                        true,
                        viewingAppointment // Pass the entire appointment object
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  
                  {viewingAppointment.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleEmailContact(
                        viewingAppointment.email,
                        `${viewingAppointment.firstName} ${viewingAppointment.lastName}`,
                        'Your Appointment Details',
                        true,
                        viewingAppointment // Pass the entire appointment object
                      )}
                    >
                      <Send className="w-4 h-4" />
                      Send Email
                    </Button>
                  )}
                  
                  {viewingAppointment.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => handlePhoneCall(viewingAppointment.phone)}
                    >
                      <PhoneCall className="w-4 h-4" />
                      Call Patient
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    updateAppointmentStatus(viewingAppointment.id, 'cancelled');
                    setShowAppointmentModal(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    updateAppointmentStatus(viewingAppointment.id, 'confirmed');
                    setShowAppointmentModal(false);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDoctors = () => (
    <div>
      {/* TODO: Implement doctors management UI here */}
      <p className="text-muted-foreground text-center py-8">Doctors management coming soon.</p>
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Contacts Management</h2>
      </div>

      <Card premium className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">Name</th>
                <th className="text-left p-4 font-medium text-foreground">Email</th>
                <th className="text-left p-4 font-medium text-foreground">Subject</th>
                <th className="text-left p-4 font-medium text-foreground">Message</th>
                <th className="text-left p-4 font-medium text-foreground">Date</th>
                <th className="text-left p-4 font-medium text-foreground">Contact</th>
                <th className="text-left p-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-border hover:bg-muted/10">
                  <td className="p-4 text-foreground">{contact.firstName} {contact.lastName}</td>
                  <td className="p-4 text-muted-foreground">{contact.email}</td>
                  <td className="p-4 text-muted-foreground">{contact.subject}</td>
                  <td className="p-4 text-muted-foreground truncate max-w-xs">{contact.message}</td>
                  <td className="p-4 text-muted-foreground">{formatDate(contact.createdAt)}</td>
                  
                  {/* New Contact Actions cell */}
                  <td className="p-4">
                    <div className="flex space-x-1">
                      {contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="WhatsApp"
                          onClick={() => handleWhatsAppContact(contact.phone, `${contact.firstName} ${contact.lastName}`)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {contact.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Send Email"
                          onClick={() => handleEmailContact(
                            contact.email, 
                            `${contact.firstName} ${contact.lastName}`, 
                            contact.subject
                          )}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Call"
                          onClick={() => handlePhoneCall(contact.phone)}
                        >
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {contacts.length === 0 && (
        <Card premium className="p-8 text-center">
          <p className="text-muted-foreground">No contacts found</p>
        </Card>
      )}

      {/* Contact Details Modal */}
      {showContactModal && viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 bg-background border-b">
              <h3 className="text-xl font-semibold text-foreground">
                Contact Message Details
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowContactModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Sender Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium text-foreground">{viewingContact.firstName} {viewingContact.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{viewingContact.email}</p>
                    </div>
                    {viewingContact.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{viewingContact.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Date Received</p>
                      <p className="font-medium text-foreground">{formatDate(viewingContact.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Message</h4>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-medium text-foreground">{viewingContact.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Content</p>
                      <div className="mt-2 p-4 bg-background rounded-lg whitespace-pre-wrap">
                        {viewingContact.message}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Actions */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-3">Contact Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    {viewingContact.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleWhatsAppContact(viewingContact.phone, `${viewingContact.firstName} ${viewingContact.lastName}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    )}
                    
                    {viewingContact.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleEmailContact(
                          viewingContact.email, 
                          `${viewingContact.firstName} ${viewingContact.lastName}`, 
                          viewingContact.subject
                        )}
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </Button>
                    )}
                    
                    {viewingContact.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handlePhoneCall(viewingContact.phone)}
                      >
                        <PhoneCall className="w-4 h-4" />
                        Call
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if(window.confirm("Are you sure you want to delete this contact message?")) {
                          deleteContact(viewingContact.id);
                          setShowContactModal(false);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="primary"
                    onClick={() => setShowContactModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // WhatsApp contact handler with professional templated message
  const handleWhatsAppContact = (phone: string, name?: string, isAppointment?: boolean, appointmentData?: any) => {
    // Remove non-digit characters and ensure country code (assume +91 for India if not present)
    let cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone.startsWith('91') && cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }
    
    let message = '';
    
    if (isAppointment && appointmentData) {
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
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
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
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'doctors' && renderDoctors()}
          {activeTab === 'contacts' && renderContacts()}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
