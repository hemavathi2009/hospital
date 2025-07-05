import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import { SearchBar } from '../../components/admin/SearchBar';
import { FilterDropdown } from '../../components/admin/FilterDropdown';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import DoctorTable from '../../components/admin/doctors/CustomDoctorTable';
import { DeleteConfirmationDialog } from '../../components/admin/DeleteConfirmationDialog';
import { 
  User, 
  UserPlus, 
  Stethoscope, 
  Filter as FilterIcon, 
  Plus,
  Check,
  Clipboard,
  ClipboardCheck,
  Calendar,
  X
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { createDoctorAccessCode } from '../../utils/accessCodes';

// Define interfaces
interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  department?: string;
  bio?: string;
  verified?: boolean;
  image?: string;
  availability?: Record<string, string[]>;
  accessCode?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

interface AccessCode {
  id: string;
  code: string;
  doctorId: string;
  createdAt: Date;
  isPermanent: boolean;
  isUsed: boolean;
}

const DoctorsManagement = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [isEditingDoctor, setIsEditingDoctor] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    department: '',
    bio: ''
  });
  const [accessCodes, setAccessCodes] = useState<{[key: string]: AccessCode}>({});
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (userRole && userRole !== 'admin') {
      toast.error('Access denied. Only administrators can view this page.');
      window.location.href = '/';
      return;
    }
    
    fetchDoctors();
  }, [userRole]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const doctorsRef = collection(db, 'doctors');
      const q = query(doctorsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const doctorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      setDoctors(doctorsList);
      
      // Fetch access codes for each doctor
      await fetchAccessCodes(doctorsList);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
      setLoading(false);
    }
  };

  const fetchAccessCodes = async (doctorsList: Doctor[]) => {
    try {
      const codes: {[key: string]: AccessCode} = {};
      
      for (const doctor of doctorsList) {
        const doctorId = doctor.id;
        
        // Query for access codes for this doctor
        const accessCodesRef = collection(db, 'doctorAccessCodes');
        const q = query(
          accessCodesRef,
          where('doctorId', '==', doctorId),
          orderBy('createdAt', 'asc'), // Order by creation time, oldest first
          limit(1) // We only need the first (oldest) code
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const codeDoc = querySnapshot.docs[0];
          const codeData = codeDoc.data();
          
          codes[doctorId] = {
            id: codeDoc.id,
            code: codeData.code,
            doctorId,
            createdAt: codeData.createdAt?.toDate() || new Date(),
            isPermanent: true,
            isUsed: false
          };
          
          // Also update the doctor in the state to include the access code
          const updatedDoctors = doctors.map(d => 
            d.id === doctorId ? { ...d, accessCode: codeData.code } : d
          );
          setDoctors(updatedDoctors);
        }
      }
      
      setAccessCodes(codes);
    } catch (error) {
      console.error('Error fetching access codes:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const resetForm = () => {
    setDoctorForm({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      department: '',
      bio: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDoctorForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!doctorForm.name || !doctorForm.email) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(doctorForm.email)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      // Create new doctor document
      const doctorsRef = collection(db, 'doctors');
      const newDoctorRef = await addDoc(doctorsRef, {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone,
        specialty: doctorForm.specialty,
        department: doctorForm.department,
        bio: doctorForm.bio,
        verified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Generate access code for the new doctor
      await handleGenerateAccessCode(newDoctorRef.id);
      
      // Refresh doctors list
      await fetchDoctors();
      
      setIsAddingDoctor(false);
      resetForm();
      toast.success('Doctor added successfully with permanent access code');
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error('Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditingDoctor) return;
    
    try {
      if (!doctorForm.name || !doctorForm.email) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(doctorForm.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      setLoading(true);
      
      // Update doctor document
      const doctorRef = doc(db, 'doctors', isEditingDoctor);
      await updateDoc(doctorRef, {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone,
        specialty: doctorForm.specialty,
        department: doctorForm.department,
        bio: doctorForm.bio,
        updatedAt: serverTimestamp()
      });
      
      // Refresh doctors list
      await fetchDoctors();
      
      setIsEditingDoctor(null);
      resetForm();
      toast.success('Doctor updated successfully');
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast.error('Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      setLoading(true);
      
      // Delete doctor document
      await deleteDoc(doc(db, 'doctors', doctorId));
      
      // Refresh doctors list
      await fetchDoctors();
      
      setShowDeleteDialog(null);
      toast.success('Doctor deleted successfully');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Failed to delete doctor');
    } finally {
      setLoading(false);
    }
  };

  const startEditingDoctor = (doctor: Doctor) => {
    setDoctorForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialty: doctor.specialty || '',
      department: doctor.department || '',
      bio: doctor.bio || ''
    });
    setIsEditingDoctor(doctor.id);
  };

  const handleGenerateAccessCode = async (doctorId: string) => {
    try {
      setGeneratingCode(doctorId);
      
      // Check if doctor already has an access code in state
      if (accessCodes[doctorId]) {
        // Do not regenerate if code already exists
        toast.warning('This doctor already has a permanent access code.');
        setGeneratingCode(null);
        return;
      }
      
      // Double-check in the database to ensure no access code exists
      const accessCodesRef = collection(db, 'doctorAccessCodes');
      const q = query(
        accessCodesRef,
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'asc'), // Order by creation time, oldest first
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If code exists in database but not in state, update the state instead of generating new code
      if (!querySnapshot.empty) {
        const codeDoc = querySnapshot.docs[0];
        const codeData = codeDoc.data();
        
        setAccessCodes(prev => ({
          ...prev,
          [doctorId]: {
            id: codeDoc.id,
            code: codeData.code,
            doctorId,
            createdAt: codeData.createdAt?.toDate() || new Date(),
            isPermanent: true,
            isUsed: false
          }
        }));
        
        // Update the doctor in the state to include the access code
        const updatedDoctors = doctors.map(d => 
          d.id === doctorId ? { ...d, accessCode: codeData.code } : d
        );
        setDoctors(updatedDoctors);
        
        toast.info('Retrieved existing permanent access code');
        setGeneratingCode(null);
        return;
      }
      
      // Generate a new access code only if none exists
      const result = await createDoctorAccessCode(doctorId);
      
      // Update the access codes state
      setAccessCodes(prev => ({
        ...prev,
        [doctorId]: {
          id: result.id,
          code: result.code,
          doctorId,
          createdAt: new Date(),
          isPermanent: true,
          isUsed: false
        }
      }));
      
      // Update the doctor in the state to include the access code
      const updatedDoctors = doctors.map(d => 
        d.id === doctorId ? { ...d, accessCode: result.code } : d
      );
      setDoctors(updatedDoctors);
      
      toast.success('Access code generated successfully');
    } catch (error) {
      console.error('Error generating access code:', error);
      toast.error('Failed to generate access code');
    } finally {
      setGeneratingCode(null);
    }
  };

  const copyAccessCodeToClipboard = (code: string, doctorId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(doctorId);
    toast.success('Access code copied to clipboard');
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  const handleAccessCodeGenerated = (doctorId: string, code: string) => {
    // Update the access codes state
    setAccessCodes(prev => ({
      ...prev,
      [doctorId]: {
        id: 'temp-id', // This will be updated on next fetch
        code,
        doctorId,
        createdAt: new Date(),
        isPermanent: true,
        isUsed: false
      }
    }));
    
    // Update the doctor in the state to include the access code
    const updatedDoctors = doctors.map(d => 
      d.id === doctorId ? { ...d, accessCode: code } : d
    );
    setDoctors(updatedDoctors);
  };

  // Filter and search doctors
  const filteredDoctors = doctors.filter(doctor => {
    // Filter by search term
    const searchMatch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doctor.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Apply additional filters
    if (filter === 'verified') {
      return doctor.verified === true;
    }
    if (filter === 'unverified') {
      return doctor.verified === false;
    }
    if (filter === 'with-access-code') {
      return !!accessCodes[doctor.id];
    }
    if (filter === 'without-access-code') {
      return !accessCodes[doctor.id];
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Doctors Management" 
          description="Add, edit, and manage doctor accounts. Generate access codes for doctors to access their portal."
          icon={<Stethoscope className="w-8 h-8 text-primary" />}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <SearchBar onSearch={handleSearch} placeholder="Search doctors..." />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <FilterDropdown 
              options={[
                { value: 'all', label: 'All Doctors' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
                { value: 'with-access-code', label: 'With Access Code' },
                { value: 'without-access-code', label: 'Without Access Code' }
              ]}
              value={filter}
              onChange={handleFilterChange}
            />
            
            <Button 
              variant="primary" 
              onClick={() => {
                resetForm();
                setIsAddingDoctor(true);
              }}
              className="whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </div>
        </div>
        
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DoctorTable 
              doctors={filteredDoctors} 
              onEdit={startEditingDoctor} 
              onDelete={setShowDeleteDialog}
              onAccessCodeGenerated={handleAccessCodeGenerated}
            />
          )}
        </Card>
        
        {/* Add Doctor Form */}
        {isAddingDoctor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Add New Doctor</h2>
                  <button 
                    onClick={() => setIsAddingDoctor(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleAddDoctor}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={doctorForm.name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={doctorForm.email}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={doctorForm.phone}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Specialty
                        </label>
                        <input
                          type="text"
                          name="specialty"
                          value={doctorForm.specialty}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={doctorForm.department}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-muted rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={doctorForm.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 border border-muted rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingDoctor(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Doctor
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
        
        {/* Edit Doctor Form */}
        {isEditingDoctor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Edit Doctor</h2>
                  <button 
                    onClick={() => setIsEditingDoctor(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleEditDoctor}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={doctorForm.name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={doctorForm.email}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={doctorForm.phone}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Specialty
                        </label>
                        <input
                          type="text"
                          name="specialty"
                          value={doctorForm.specialty}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-muted rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={doctorForm.department}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-muted rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={doctorForm.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 border border-muted rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingDoctor(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Update Doctor
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <DeleteConfirmationDialog
            title="Delete Doctor"
            message="Are you sure you want to delete this doctor? This action cannot be undone."
            onCancel={() => setShowDeleteDialog(null)}
            onConfirm={() => {
              if (showDeleteDialog) {
                handleDeleteDoctor(showDeleteDialog);
                setShowDeleteDialog(null);
              }
            }}
            confirmText="Delete"
            cancelText="Cancel"
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default DoctorsManagement;
