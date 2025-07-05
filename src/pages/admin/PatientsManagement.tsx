import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { createAccessCode } from '../../utils/accessCodes';
import PageHeader from '../../components/admin/PageHeader';
import { SearchBar } from '../../components/admin/SearchBar';
import { FilterDropdown } from '../../components/admin/FilterDropdown';
import { DeleteConfirmationDialog } from '../../components/admin/DeleteConfirmationDialog';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Card from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import {
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Trash2,
  Edit,
  X,
  Save,
  Clipboard,
  ClipboardCheck,
  KeyRound,
  RefreshCw
} from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

interface AccessCode {
  id: string;
  code: string;
  patientId: string;
  createdAt: any;
  expiresAt?: any; // Made optional
  isUsed?: boolean; // Made optional
  usedAt?: any;
  isPermanent?: boolean; // Added for permanent codes
}

const PatientsManagement: React.FC = () => {
  const { userRole } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [accessCodes, setAccessCodes] = useState<Record<string, AccessCode>>({});
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    bloodType: ''
  });

  useEffect(() => {
    // Redirect if not admin
    if (userRole && userRole !== 'admin') {
      toast.error('Access denied. Only administrators can view this page.');
      window.location.href = '/';
      return;
    }
    
    fetchPatients();
  }, [userRole]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const patientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(patientsList);
      
      // Fetch access codes for each patient
      await fetchAccessCodes(patientsList);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
      setLoading(false);
    }
  };

  const fetchAccessCodes = async (patientsList: Patient[]) => {
    try {
      const accessCodesRef = collection(db, 'accessCodes');
      const codes: Record<string, AccessCode> = {};
      
      // For each patient, get their OLDEST access code (first created, not most recent)
      for (const patient of patientsList) {
        const q = query(
          accessCodesRef, 
          where('patientId', '==', patient.id),
          orderBy('createdAt', 'asc'), // Order by creation time, oldest first
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const codeDoc = querySnapshot.docs[0];
          const codeData = codeDoc.data() as Omit<AccessCode, 'id'>;
          
          // All codes are now permanent
          codes[patient.id] = {
            id: codeDoc.id,
            ...codeData,
            // Ensure the object has the right properties even for legacy data
            isUsed: false,
            expiresAt: null,
            isPermanent: true
          } as AccessCode;
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
    setPatientForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: '',
      bloodType: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!patientForm.firstName || !patientForm.lastName || !patientForm.email) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientForm.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Check if patient with same email already exists
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('email', '==', patientForm.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error('A patient with this email already exists');
        return;
      }
      
      setLoading(true);
      
      // Create patient document
      const newPatientRef = await addDoc(patientsRef, {
        ...patientForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Generate access code for the new patient
      await handleGenerateAccessCode(newPatientRef.id);
      
      // Refresh patients list
      await fetchPatients();
      
      setIsAddingPatient(false);
      resetForm();
      toast.success('Patient added successfully with permanent access code');
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditingPatient) return;
    
    try {
      if (!patientForm.firstName || !patientForm.lastName || !patientForm.email) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientForm.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Check if another patient with same email already exists
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('email', '==', patientForm.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty && querySnapshot.docs[0].id !== isEditingPatient) {
        toast.error('Another patient with this email already exists');
        return;
      }
      
      setLoading(true);
      
      // Update patient document
      const patientRef = doc(db, 'patients', isEditingPatient);
      await updateDoc(patientRef, {
        ...patientForm,
        updatedAt: serverTimestamp()
      });
      
      // Refresh patients list
      await fetchPatients();
      
      setIsEditingPatient(null);
      resetForm();
      toast.success('Patient updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      setLoading(true);
      
      // Delete patient document
      await deleteDoc(doc(db, 'patients', patientId));
      
      // Refresh patients list
      await fetchPatients();
      
      setShowDeleteDialog(null);
      toast.success('Patient deleted successfully');
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPatient = (patient: Patient) => {
    setPatientForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      gender: patient.gender || '',
      bloodType: patient.bloodType || ''
    });
    setIsEditingPatient(patient.id);
  };

  const handleGenerateAccessCode = async (patientId: string) => {
    try {
      setGeneratingCode(patientId);
      
      // Check if patient already has an access code in state
      if (accessCodes[patientId]) {
        // Do not regenerate if code already exists
        toast.warning('This patient already has a permanent access code.');
        setGeneratingCode(null);
        return;
      }
      
      // Double-check in the database to ensure no access code exists
      const accessCodesRef = collection(db, 'accessCodes');
      const q = query(
        accessCodesRef,
        where('patientId', '==', patientId),
        orderBy('createdAt', 'asc'), // Order by creation time, oldest first
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If code exists in database but not in state, update the state instead of generating new code
      if (!querySnapshot.empty) {
        const codeDoc = querySnapshot.docs[0];
        const codeData = codeDoc.data() as Omit<AccessCode, 'id'>;
        
        setAccessCodes(prev => ({
          ...prev,
          [patientId]: {
            id: codeDoc.id,
            ...codeData,
            isPermanent: true,
            isUsed: false
          } as AccessCode
        }));
        
        toast.info('Retrieved existing permanent access code');
        setGeneratingCode(null);
        return;
      }
      
      // Generate a new access code only if none exists
      const result = await createAccessCode(patientId);
      
      // Update the access codes state
      setAccessCodes(prev => ({
        ...prev,
        [patientId]: {
          id: result.id,
          code: result.code,
          patientId,
          createdAt: new Date(),
          isPermanent: true,
          isUsed: false
        }
      }));
      
      toast.success('Access code generated successfully');
    } catch (error) {
      console.error('Error generating access code:', error);
      toast.error('Failed to generate access code');
    } finally {
      setGeneratingCode(null);
    }
  };

  const copyAccessCodeToClipboard = (code: string, patientId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(patientId);
    
    // Reset copied state after 3 seconds
    setTimeout(() => {
      setCopied(null);
    }, 3000);
    
    toast.success('Access code copied to clipboard');
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      (patient.phone && patient.phone.includes(searchTerm))
    );
  });

  // Filter based on selected filter
  const filteredAndSortedPatients = filteredPatients.filter(patient => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      const createdAt = patient.createdAt?.toDate();
      if (createdAt) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }
    }
    if (filter === 'with-access-code') {
      return !!accessCodes[patient.id];
    }
    if (filter === 'without-access-code') {
      return !accessCodes[patient.id];
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Patients Management" 
          description="Add, edit, and manage patient accounts. Generate access codes for patients to access their portal."
          icon={<User className="w-8 h-8 text-primary" />}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <SearchBar onSearch={handleSearch} placeholder="Search patients..." />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <FilterDropdown 
              options={[
                { value: 'all', label: 'All Patients' },
                { value: 'recent', label: 'Added Recently' },
                { value: 'with-access-code', label: 'With Access Code' },
                { value: 'without-access-code', label: 'Without Access Code' }
              ]}
              value={filter}
              onChange={handleFilterChange}
            />
            
            <Button 
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsAddingPatient(true);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>
        
        {/* Add Patient Form */}
        {isAddingPatient && (
          <Card premium className="mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Patient</h3>
              <button onClick={() => setIsAddingPatient(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPatient}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name*</label>
                  <Input
                    name="firstName"
                    value={patientForm.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name*</label>
                  <Input
                    name="lastName"
                    value={patientForm.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address*</label>
                  <Input
                    type="email"
                    name="email"
                    value={patientForm.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={patientForm.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    name="birthDate"
                    value={patientForm.birthDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    value={patientForm.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Type</label>
                  <select
                    name="bloodType"
                    value={patientForm.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingPatient(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Patient
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        {/* Edit Patient Form */}
        {isEditingPatient && (
          <Card premium className="mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Patient</h3>
              <button onClick={() => setIsEditingPatient(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditPatient}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name*</label>
                  <Input
                    name="firstName"
                    value={patientForm.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name*</label>
                  <Input
                    name="lastName"
                    value={patientForm.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address*</label>
                  <Input
                    type="email"
                    name="email"
                    value={patientForm.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={patientForm.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    name="birthDate"
                    value={patientForm.birthDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    value={patientForm.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Type</label>
                  <select
                    name="bloodType"
                    value={patientForm.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPatient(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        {/* Patients List */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Patient</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                  <th className="px-4 py-3 text-left font-medium">Access Code</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2">Loading patients...</p>
                    </td>
                  </tr>
                ) : filteredAndSortedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      <p>No patients found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setIsAddingPatient(true);
                          resetForm();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Patient
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {patient.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            {patient.email}
                          </div>
                          {patient.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              {patient.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {patient.birthDate && (
                            <div className="flex items-center text-sm">
                              <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              {new Date(patient.birthDate).toLocaleDateString()}
                            </div>
                          )}
                          {patient.gender && (
                            <div className="flex items-center text-sm capitalize">
                              <User className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              {patient.gender}
                            </div>
                          )}
                          {patient.bloodType && (
                            <div className="flex items-center text-sm">
                              <Heart className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              Blood Type: {patient.bloodType}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {accessCodes[patient.id] ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center">
                              <Badge variant="secondary" className="mr-2 font-mono">
                                {accessCodes[patient.id].code}
                              </Badge>
                              <button
                                onClick={() => copyAccessCodeToClipboard(accessCodes[patient.id].code, patient.id)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Copy to clipboard"
                              >
                                {copied === patient.id ? (
                                  <ClipboardCheck className="w-4 h-4 text-success" />
                                ) : (
                                  <Clipboard className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="text-xs">
                              <Badge variant="success" className="text-white">Permanent</Badge>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateAccessCode(patient.id)}
                            disabled={generatingCode === patient.id}
                            title="Generate a permanent access code for this patient"
                          >
                            {generatingCode === patient.id ? (
                              <div className="flex items-center">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                Generating...
                              </div>
                            ) : (
                              <>
                                <KeyRound className="w-3.5 h-3.5 mr-2" />
                                Generate Code
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => startEditingPatient(patient)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Edit Patient"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteDialog(patient.id)}
                            className="p-1 text-muted-foreground hover:text-error"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {/* Removed regenerate access code button to ensure codes are permanent */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          title="Delete Patient"
          message="Are you sure you want to delete this patient? This action cannot be undone and will remove all patient data."
          onConfirm={() => handleDeletePatient(showDeleteDialog)}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </AdminLayout>
  );
};

export default PatientsManagement;
