import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import { 
  Calendar, 
  FileText, 
  Clock, 
  User, 
  Download, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Pill,
  FileBarChart,
  Settings,
  Edit,
  Save,
  X,
  Plus,
  Heart,
  Clipboard,
  UserCog,
  Bell,
  BarChart2,
  Activity,
  Shield
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import Footer from '../components/organisms/Footer';

// Define types for better type safety
type Appointment = {
  id: string;
  doctor?: string;
  doctorEmail?: string;
  department?: string;
  date?: string;
  time?: string;
  reason?: string;
  status?: string;
  notes?: string;
  createdAt?: any;
  [key: string]: any;
};

type MedicalRecord = {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  attachmentUrl?: string;
};

type Prescription = {
  id: string;
  date: string;
  doctor: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  notes?: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  date: any;
  read: boolean;
  type: 'appointment' | 'reminder' | 'message' | 'system';
  relatedId?: string;
};

type HealthMetric = {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: any;
  notes?: string;
};

type PatientProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  preferredLanguage?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  [key: string]: any;
};

const PatientPortal = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingHealthMetric, setAddingHealthMetric] = useState(false);
  const [metricForm, setMetricForm] = useState({
    type: 'weight',
    value: '',
    unit: 'kg',
    notes: ''
  });
  
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: '',
    insuranceProvider: '',
    insuranceNumber: '',
    preferredLanguage: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: ''
  });

  useEffect(() => {
    if (!currentUser) {
      // Redirect to signin page for patient login
      navigate('/signin?userType=patient');
      return;
    }
    
    // Check if user is a patient or admin (admins can access all portals)
    if (userRole && userRole !== 'patient' && userRole !== 'admin') {
      toast.error('Access denied. This portal is for patients only.');
      navigate('/signin?userType=patient');
      return;
    }
    
    // Verify that the patient exists
    const verifyPatientAccess = async () => {
      try {
        if (userRole === 'admin') {
          // Admin can always access
          fetchUserAppointments();
          fetchPatientProfile();
          fetchMedicalRecords();
          fetchPrescriptions();
          fetchNotifications();
          fetchHealthMetrics();
          return;
        }
        
        // For patients, verify that they have an account
        const patientsRef = collection(db, 'patients');
        const q = query(patientsRef, where('email', '==', currentUser?.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Create a basic patient profile if not found
          const patientsCollectionRef = collection(db, 'patients');
          const newPatientRef = doc(patientsCollectionRef);
          const newPatientData = {
            email: currentUser.email,
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(newPatientRef, newPatientData);
          toast.info('Welcome! Please complete your profile information.');
        }
        
        // Patient is verified, proceed to fetch data
        fetchUserAppointments();
        fetchPatientProfile();
        fetchMedicalRecords();
        fetchPrescriptions();
        fetchNotifications();
        fetchHealthMetrics();
      } catch (error) {
        console.error('Error verifying patient access:', error);
        toast.error('An error occurred while verifying your access.');
        navigate('/signin?userType=patient');
      }
    };
    
    verifyPatientAccess();
  }, [currentUser, userRole, navigate]);

  const fetchUserAppointments = async () => {
    try {
      setLoading(true);
      
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef, 
        where('email', '==', currentUser.email),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const userAppointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      setAppointments(userAppointments);
      console.log('User appointments loaded:', userAppointments.length);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientProfile = async () => {
    try {
      if (!currentUser?.email) return;
      
      // Try to find existing patient profile
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create a basic patient profile if not found
        const patientsCollectionRef = collection(db, 'patients');
        const newPatientRef = doc(patientsCollectionRef);
        const newPatientData = {
          email: currentUser.email,
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(newPatientRef, newPatientData);
        toast.info('Welcome! Please complete your profile information.');
        
        const patientData = {
          id: newPatientRef.id,
          ...newPatientData
        } as PatientProfile;
        
        setPatientProfile(patientData);
        setProfileForm({
          firstName: patientData.firstName || '',
          lastName: patientData.lastName || '',
          phone: '',
          address: '',
          birthDate: '',
          gender: '',
          bloodType: '',
          allergies: '',
          medications: '',
          conditions: '',
          insuranceProvider: '',
          insuranceNumber: '',
          preferredLanguage: '',
          emergencyContactName: '',
          emergencyContactRelationship: '',
          emergencyContactPhone: ''
        });
        
        return;
      }
      
      const patientData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as PatientProfile;
      
      setPatientProfile(patientData);
      setProfileForm({
        firstName: patientData.firstName || '',
        lastName: patientData.lastName || '',
        phone: patientData.phone || '',
        address: patientData.address || '',
        birthDate: patientData.birthDate || '',
        gender: patientData.gender || '',
        bloodType: patientData.bloodType || '',
        allergies: patientData.allergies ? patientData.allergies.join(', ') : '',
        medications: patientData.medications ? patientData.medications.join(', ') : '',
        conditions: patientData.conditions ? patientData.conditions.join(', ') : '',
        insuranceProvider: patientData.insuranceProvider || '',
        insuranceNumber: patientData.insuranceNumber || '',
        preferredLanguage: patientData.preferredLanguage || '',
        emergencyContactName: patientData.emergencyContact?.name || '',
        emergencyContactRelationship: patientData.emergencyContact?.relationship || '',
        emergencyContactPhone: patientData.emergencyContact?.phone || ''
      });
      
      console.log('Patient profile loaded:', patientData);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      toast.error('Failed to load your profile');
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      if (!currentUser?.email) return;
      
      const recordsRef = collection(db, 'medicalRecords');
      const q = query(
        recordsRef, 
        where('patientEmail', '==', currentUser.email),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      
      setMedicalRecords(records);
      console.log('Medical records loaded:', records.length);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to load medical records');
    }
  };

  const fetchPrescriptions = async () => {
    try {
      if (!currentUser?.email) return;
      
      const prescriptionsRef = collection(db, 'prescriptions');
      const q = query(
        prescriptionsRef, 
        where('patientEmail', '==', currentUser.email),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const userPrescriptions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prescription[];
      
      setPrescriptions(userPrescriptions);
      console.log('Prescriptions loaded:', userPrescriptions.length);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!currentUser?.email) return;
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('patientEmail', '==', currentUser.email),
        orderBy('date', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const userNotifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(userNotifications);
      
      // Check for unread notifications
      const unreadCount = userNotifications.filter(notif => !notif.read).length;
      setHasUnreadNotifications(unreadCount > 0);
      
      console.log('Notifications loaded:', userNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      if (!currentUser?.email) return;
      
      const metricsRef = collection(db, 'healthMetrics');
      const q = query(
        metricsRef, 
        where('patientEmail', '==', currentUser.email),
        orderBy('date', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const userMetrics = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HealthMetric[];
      
      setHealthMetrics(userMetrics);
      console.log('Health metrics loaded:', userMetrics.length);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  // Handle notification click (mark as read)
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: new Date()
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Check if there are still unread notifications
      const unreadCount = notifications.filter(notif => notif.id !== notificationId && !notif.read).length;
      setHasUnreadNotifications(unreadCount > 0);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    if (patientProfile) {
      setProfileForm({
        firstName: patientProfile.firstName || '',
        lastName: patientProfile.lastName || '',
        phone: patientProfile.phone || '',
        address: patientProfile.address || '',
        birthDate: patientProfile.birthDate || '',
        gender: patientProfile.gender || '',
        bloodType: patientProfile.bloodType || '',
        allergies: patientProfile.allergies ? patientProfile.allergies.join(', ') : '',
        medications: patientProfile.medications ? patientProfile.medications.join(', ') : '',
        conditions: patientProfile.conditions ? patientProfile.conditions.join(', ') : '',
        insuranceProvider: patientProfile.insuranceProvider || '',
        insuranceNumber: patientProfile.insuranceNumber || '',
        preferredLanguage: patientProfile.preferredLanguage || '',
        emergencyContactName: patientProfile.emergencyContact?.name || '',
        emergencyContactRelationship: patientProfile.emergencyContact?.relationship || '',
        emergencyContactPhone: patientProfile.emergencyContact?.phone || ''
      });
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      
      // Prepare data
      const profileData = {
        ...profileForm,
        id: patientProfile?.id || currentUser.uid,
        allergies: profileForm.allergies.split(',').map(a => a.trim()),
        medications: profileForm.medications ? profileForm.medications.split(',').map(med => med.trim()) : [],
        conditions: profileForm.conditions ? profileForm.conditions.split(',').map(cond => cond.trim()) : [],
        emergencyContact: {
          name: profileForm.emergencyContactName,
          relationship: profileForm.emergencyContactRelationship,
          phone: profileForm.emergencyContactPhone
        }
      };
      
      // Update profile in Firestore
      await updateDoc(doc(db, 'patients', currentUser.uid), profileData);
      
      setPatientProfile(profileData);
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | undefined): "primary" | "secondary" | "success" | "warning" | "error" | "info" => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return String(dateString);
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.date && new Date(apt.date) >= new Date() && apt.status !== 'completed'
  );

  const pastAppointments = appointments.filter(apt => 
    apt.date && (new Date(apt.date) < new Date() || apt.status === 'completed')
  );

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    try {
      if (!patientProfile?.id) return;
      
      // Process allergies from comma-separated string to array
      const allergiesArray = profileForm.allergies
        ? profileForm.allergies.split(',').map(item => item.trim())
        : [];
      
      // Process medications and conditions
      const medicationsArray = profileForm.medications
        ? profileForm.medications.split(',').map(item => item.trim())
        : [];
      
      const conditionsArray = profileForm.conditions
        ? profileForm.conditions.split(',').map(item => item.trim())
        : [];
      
      // Create emergency contact object
      const emergencyContact = {
        name: profileForm.emergencyContactName,
        relationship: profileForm.emergencyContactRelationship,
        phone: profileForm.emergencyContactPhone
      };
      
      // Update the patient document in Firestore
      const patientRef = doc(db, 'patients', patientProfile.id);
      
      const updatedData = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        address: profileForm.address,
        birthDate: profileForm.birthDate,
        gender: profileForm.gender,
        bloodType: profileForm.bloodType,
        allergies: allergiesArray,
        medications: medicationsArray,
        conditions: conditionsArray,
        insuranceProvider: profileForm.insuranceProvider,
        insuranceNumber: profileForm.insuranceNumber,
        preferredLanguage: profileForm.preferredLanguage,
        emergencyContact,
        updatedAt: new Date()
      };
      
      await updateDoc(patientRef, updatedData);
      
      // Update local state
      setPatientProfile({
        ...patientProfile,
        id: patientProfile.id,
        ...updatedData
      });
      
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAddHealthMetric = async () => {
    try {
      if (!metricForm.value || !metricForm.type) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const newMetric = {
        type: metricForm.type,
        value: parseFloat(metricForm.value),
        unit: metricForm.unit,
        notes: metricForm.notes,
        patientEmail: currentUser.email,
        patientId: patientProfile?.id,
        date: new Date(),
        createdAt: serverTimestamp()
      };
      
      const metricsRef = collection(db, 'healthMetrics');
      const docRef = await addDoc(metricsRef, newMetric);
      
      // Update local state
      setHealthMetrics([
        {
          id: docRef.id,
          ...newMetric
        } as HealthMetric,
        ...healthMetrics
      ]);
      
      // Reset form
      setMetricForm({
        type: 'weight',
        value: '',
        unit: 'kg',
        notes: ''
      });
      
      setAddingHealthMetric(false);
      toast.success('Health metric added successfully');
    } catch (error) {
      console.error('Error adding health metric:', error);
      toast.error('Failed to add health metric');
    }
  };

  // Handle health metric form changes
  const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMetricForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Render health metrics tab
  const renderHealthMetrics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Health Metrics
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setAddingHealthMetric(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Metric
        </Button>
      </div>
      {/* Add Metric Form */}
      {addingHealthMetric && (
        <Card premium className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Add New Health Metric</h4>
            <Button variant="ghost" size="sm" onClick={() => setAddingHealthMetric(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Metric Type</label>
              <select
                name="type"
                value={metricForm.type}
                onChange={handleMetricChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="weight">Weight</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="blood_sugar">Blood Sugar</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="temperature">Temperature</option>
                <option value="oxygen">Oxygen Saturation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="number"
                step="0.01"
                name="value"
                value={metricForm.value}
                onChange={handleMetricChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="Enter value"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input
                type="text"
                name="unit"
                value={metricForm.unit}
                onChange={handleMetricChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="kg, mmHg, bpm, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={metricForm.notes}
                onChange={handleMetricChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="Optional notes"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              className="mr-2"
              onClick={() => setAddingHealthMetric(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleAddHealthMetric}
            >
              Save Metric
            </Button>
          </div>
        </Card>
      )}
      {/* Metrics List */}
      <div className="space-y-4">
        {healthMetrics.length > 0 ? (
          healthMetrics.map((metric) => (
            <Card key={metric.id} premium className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="text-lg font-semibold text-foreground mr-3">
                      {metric.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(metric.date.seconds ? metric.date.seconds * 1000 : metric.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary mr-2">{metric.value}</span>
                    <span className="text-muted-foreground">{metric.unit}</span>
                  </div>
                  
                  {metric.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{metric.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card premium className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Activity className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground mb-1">No health metrics recorded</p>
              <p className="text-muted-foreground mb-4">Track your health data to monitor your progress</p>
              <Button 
                variant="outline"
                onClick={() => setAddingHealthMetric(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Metric
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
  
  // This function was removed as it was a duplicate of renderNotifications

  // Render tab components
  const renderAppointments = () => (
    <div className="space-y-8">
      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary" />
          Upcoming Appointments
        </h3>
        <div className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} premium className="p-6 bg-primary/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-lg font-semibold text-foreground mr-3">
                        Dr. {appointment.doctor}
                      </h4>
                      <Badge variant={getStatusColor(appointment.status)} size="sm">
                        {appointment.status || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{appointment.department}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-primary" />
                        {formatDate(appointment.date)}
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">Upcoming</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {appointment.time}
                      </div>
                    </div>
                    {appointment.reason && (
                      <div className="mt-3 bg-muted/50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card premium className="p-8 text-center">
              <div className="flex flex-col items-center">
                <Calendar className="w-16 h-16 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-foreground mb-1">No upcoming appointments</p>
                <p className="text-muted-foreground mb-4">You don't have any scheduled appointments</p>
                <Button 
                  onClick={() => navigate('/appointment-booking')}
                  className="mt-2"
                >
                  Book an Appointment
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-amber-500" />
          Past Appointments & History
        </h3>
        <div className="space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <Card key={appointment.id} premium className="p-6 bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-lg font-semibold text-foreground mr-3">
                        Dr. {appointment.doctor}
                      </h4>
                      <Badge variant={getStatusColor(appointment.status)} size="sm">
                        {appointment.status || 'completed'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{appointment.department}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-amber-500" />
                        {formatDate(appointment.date)}
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">Past</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {appointment.time}
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-2 bg-muted/50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-foreground mb-1">Doctor's Notes:</p>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card premium className="p-8 text-center">
              <div className="flex flex-col items-center">
                <Clock className="w-16 h-16 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-foreground mb-1">No past appointments</p>
                <p className="text-muted-foreground">Your appointment history will appear here</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderMedicalRecords = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <FileBarChart className="w-5 h-5 mr-2 text-primary" />
          Medical Records
        </h3>
      </div>
      
      <div className="space-y-4">
        {medicalRecords.length > 0 ? (
          medicalRecords.map((record) => (
            <Card key={record.id} premium className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h4 className="text-lg font-semibold text-foreground mr-3">
                      {record.diagnosis}
                    </h4>
                    <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
                  </div>
                  <p className="text-muted-foreground mb-2">Dr. {record.doctor}</p>
                  
                  <div className="mt-3 space-y-3">
                    <div className="bg-muted/50 p-3 rounded-xl">
                      <p className="text-sm font-medium text-foreground mb-1">Treatment:</p>
                      <p className="text-sm text-muted-foreground">{record.treatment}</p>
                    </div>
                    
                    {record.notes && (
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-foreground mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {record.attachmentUrl && (
                  <div className="ml-4">
                    <a 
                      href={record.attachmentUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card premium className="p-8 text-center">
            <div className="flex flex-col items-center">
              <FileBarChart className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground mb-1">No medical records found</p>
              <p className="text-muted-foreground">Your medical history will appear here once available</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Pill className="w-5 h-5 mr-2 text-primary" />
          Prescriptions
        </h3>
      </div>
      
      <div className="space-y-4">
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <Card key={prescription.id} premium className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h4 className="text-lg font-semibold text-foreground mr-3">
                      Prescription
                    </h4>
                    <span className="text-sm text-muted-foreground">{formatDate(prescription.date)}</span>
                  </div>
                  <p className="text-muted-foreground mb-4">Dr. {prescription.doctor}</p>
                  
                  <div className="space-y-4">
                    <h5 className="text-base font-medium flex items-center">
                      <Pill className="w-4 h-4 mr-2 text-primary" />
                      Medications
                    </h5>
                    
                    <div className="divide-y divide-muted-foreground/20">
                      {prescription.medications.map((med, index) => (
                        <div key={index} className="py-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{med.name}</span>
                            <span>{med.dosage}</span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            <div>Frequency: {med.frequency}</div>
                            <div>Duration: {med.duration}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {prescription.notes && (
                      <div className="mt-3 bg-muted/50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-foreground mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  <Button variant="outline" size="sm" className="mb-2">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card premium className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Pill className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground mb-1">No prescriptions found</p>
              <p className="text-muted-foreground">Your prescriptions will appear here once available</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-foreground flex items-center">
          <User className="w-6 h-6 mr-2 text-primary" />
          My Health Profile
        </h3>
        {!editingProfile ? (
          <Button 
            onClick={() => setEditingProfile(true)} 
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/5"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              onClick={() => setEditingProfile(false)} 
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={saveProfile} 
              variant="primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      {editingProfile ? (
        <div className="grid grid-cols-1 gap-8">
          <Card premium className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full -z-0"></div>
            
            <h4 className="text-lg font-semibold mb-6 flex items-center relative z-10">
              <User className="w-5 h-5 mr-2 text-primary" />
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-sm font-medium mb-1">First Name*</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name*</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full p-2.5 border border-input rounded-md bg-muted/20 text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="birthDate"
                  value={profileForm.birthDate}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={profileForm.gender}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
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
                  value={profileForm.bloodType}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
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
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Language</label>
                <select
                  name="preferredLanguage"
                  value={profileForm.preferredLanguage}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="">Select Language</option>
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="chinese">Chinese</option>
                  <option value="hindi">Hindi</option>
                  <option value="arabic">Arabic</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </Card>
          
          <Card premium className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-accent/5 to-transparent rounded-bl-full -z-0"></div>
            
            <h4 className="text-lg font-semibold mb-6 flex items-center relative z-10">
              <Shield className="w-5 h-5 mr-2 text-accent" />
              Health Information
            </h4>
            
            <div className="grid grid-cols-1 gap-6 relative z-10">
              <div>
                <label className="block text-sm font-medium mb-1">Allergies (comma separated)</label>
                <input
                  type="text"
                  name="allergies"
                  value={profileForm.allergies}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Penicillin, Peanuts, Latex"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Medications (comma separated)</label>
                <input
                  type="text"
                  name="medications"
                  value={profileForm.medications}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Lisinopril, Metformin, Atorvastatin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Medical Conditions (comma separated)</label>
                <input
                  type="text"
                  name="conditions"
                  value={profileForm.conditions}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Hypertension, Diabetes, Asthma"
                />
              </div>
            </div>
          </Card>
          
          <Card premium className="p-8 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full -z-0"></div>
            
            <h4 className="text-lg font-semibold mb-6 flex items-center relative z-10">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Emergency Contact
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={profileForm.emergencyContactName}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={profileForm.emergencyContactRelationship}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Spouse, Parent, Child, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={profileForm.emergencyContactPhone}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </Card>
          
          <Card premium className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-secondary/5 to-transparent rounded-bl-full -z-0"></div>
            
            <h4 className="text-lg font-semibold mb-6 flex items-center relative z-10">
              <Shield className="w-5 h-5 mr-2 text-secondary" />
              Insurance Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-sm font-medium mb-1">Insurance Provider</label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={profileForm.insuranceProvider}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="BlueCross BlueShield, Aetna, Kaiser, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Insurance ID/Policy Number</label>
                <input
                  type="text"
                  name="insuranceNumber"
                  value={profileForm.insuranceNumber}
                  onChange={handleProfileChange}
                  className="w-full p-2.5 border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 bg-background rounded-xl p-6 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {patientProfile?.photoURL ? (
                  <img 
                    src={patientProfile.photoURL} 
                    alt={`${patientProfile.firstName} ${patientProfile.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold">
                {patientProfile?.firstName} {patientProfile?.lastName}
              </h3>
              <p className="text-muted-foreground mt-1">{currentUser?.email}</p>
              
              <div className="mt-6 w-full">
                <Button
                  variant="outline"
                  className="w-full border-primary/50 text-primary hover:bg-primary/5"
                  onClick={() => setEditingProfile(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 mt-6 border-t pt-6">
              {patientProfile?.phone && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{patientProfile.phone}</p>
                  </div>
                </div>
              )}
              
              {patientProfile?.address && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>{patientProfile.address}</p>
                  </div>
                </div>
              )}
              
              {patientProfile?.emergencyContact?.name && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Heart className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p>{patientProfile.emergencyContact.name} ({patientProfile.emergencyContact.relationship})</p>
                    <p className="text-sm text-muted-foreground">{patientProfile.emergencyContact.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3">
            <div className="bg-background rounded-xl p-6 border border-border/40 shadow-sm mb-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Personal Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</h5>
                  <p className="font-medium">{patientProfile?.birthDate || 'Not provided'}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Gender</h5>
                  <p className="font-medium capitalize">{patientProfile?.gender || 'Not provided'}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Blood Type</h5>
                  <p className="font-medium">{patientProfile?.bloodType || 'Not provided'}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Preferred Language</h5>
                  <p className="font-medium capitalize">{patientProfile?.preferredLanguage || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background rounded-xl p-6 border border-border/40 shadow-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Insurance Information
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Provider</h5>
                    <p className="font-medium">{patientProfile?.insuranceProvider || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Policy Number</h5>
                    <p className="font-medium">{patientProfile?.insuranceNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background rounded-xl p-6 border border-border/40 shadow-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Health Information
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Allergies</h5>
                    <p className="font-medium">{patientProfile?.allergies?.join(', ') || 'None'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Medications</h5>
                    <p className="font-medium">{patientProfile?.medications?.join(', ') || 'None'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Conditions</h5>
                    <p className="font-medium">{patientProfile?.conditions?.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Bell className="w-5 h-5 mr-2 text-primary" />
          Notifications
        </h3>
      </div>
      
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              premium 
              className={`p-5 ${!notification.read ? 'bg-primary/5' : ''}`}
            >
              <div 
                className="flex items-start cursor-pointer" 
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="text-lg font-semibold text-foreground mr-3">
                      {notification.title}
                    </h4>
                    <Badge variant={notification.read ? 'secondary' : 'primary'} size="sm">
                      {notification.read ? 'Read' : 'New'}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-2">{notification.message}</p>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {notification.date && 
                      new Date(
                        typeof notification.date === 'object' && notification.date.seconds 
                          ? notification.date.seconds * 1000 
                          : notification.date
                      ).toLocaleString()
                    }
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card premium className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Bell className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground mb-1">No notifications</p>
              <p className="text-muted-foreground">You don't have any notifications at the moment</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'metrics', label: 'Health Metrics', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="section-padding flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendering patient portal UI
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Enhanced Hero Section with luxury visuals and animated elements */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Enhanced background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Gradient overlay and pattern */}
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-10"></div>
          
          {/* Animated blobs with enhanced morphing effects */}
          <div className="absolute top-[15%] left-[8%] w-72 h-72 rounded-full bg-accent/15 mix-blend-overlay animate-blob-morph animation-delay-2000"></div>
          <div className="absolute bottom-[15%] right-[8%] w-80 h-80 rounded-full bg-secondary/20 mix-blend-overlay animate-blob-morph"></div>
          <div className="absolute top-[55%] right-[18%] w-48 h-48 rounded-full bg-white/10 mix-blend-overlay animate-blob-morph animation-delay-4000"></div>
          
          {/* Enhanced abstract shapes with better animations */}
          <div className="absolute bottom-[28%] left-[18%] w-36 h-36 border-2 border-white/10 rounded-lg rotate-45 animate-float-slow"></div>
          <div className="absolute top-[28%] right-[28%] w-28 h-28 border border-accent/20 rounded-full animate-pulse-glow"></div>
          
          {/* Additional decorative elements */}
          <div className="absolute top-[40%] left-[25%] w-16 h-16 rounded-md bg-gradient-to-tr from-accent/10 to-transparent rotate-12 animate-float-slow animation-delay-3000"></div>
          <div className="absolute bottom-[35%] right-[22%] w-20 h-20 border-2 border-dashed border-white/10 rounded-full animate-spin-slow"></div>
        </div>
        
        <div className="container-hospital relative z-10">
          <div className="max-w-5xl mx-auto text-center text-white py-10">
            {/* Status badge with improved styling and personalization */}
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-8 shadow-glow">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse mr-2.5"></div>
              <span>
                {currentUser ? (
                  <>Welcome back, <span className="font-semibold">{patientProfile?.firstName || currentUser.displayName?.split(' ')[0] || 'Patient'}</span></>
                ) : 'Your Health Dashboard'}
              </span>
            </div>
            
            {/* Main heading with enhanced typography and animation */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Your Personal <span className="text-gradient bg-gradient-to-r from-accent via-white to-accent bg-clip-text text-transparent">Healthcare Hub</span>
            </motion.h1>
            
            {/* Enhanced subheading with animation */}
            <motion.p 
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Seamlessly manage your health journey with personalized care, real-time updates, and secure access to your medical information.
            </motion.p>
            
            {/* Quick stats cards with improved visual styling */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Upcoming appointment card */}
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center space-x-4 hover:bg-white/15 transition-all duration-300 border border-white/5 shadow-glow"
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80">Upcoming</h3>
                  <p className="text-white font-semibold">
                    {appointments.length > 0 
                      ? new Date(appointments[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                      : 'No appointments'}
                  </p>
                </div>
              </motion.div>
              
              {/* Records count card */}
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center space-x-4 hover:bg-white/15 transition-all duration-300 border border-white/5 shadow-glow"
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80">Medical Records</h3>
                  <p className="text-white font-semibold">{medicalRecords.length} Records</p>
                </div>
              </motion.div>
              
              {/* Notifications card */}
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center space-x-4 hover:bg-white/15 transition-all duration-300 border border-white/5 shadow-glow"
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80">Notifications</h3>
                  <p className="text-white font-semibold">
                    {notifications.filter(n => !n.read).length > 0 
                      ? `${notifications.filter(n => !n.read).length} Unread` 
                      : 'All caught up'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Main content section */}
      <section className="container-hospital py-10">
        <div className="mb-8">
          <div className="flex overflow-x-auto space-x-4 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "hover:bg-muted"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                <span>{tab.label}</span>
                {tab.id === "notifications" && hasUnreadNotifications && (
                  <span className="w-2 h-2 bg-accent rounded-full ml-2"></span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Tab Content */}
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'records' && renderMedicalRecords()}
            {activeTab === 'prescriptions' && renderPrescriptions()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'notifications' && renderNotifications()}
            {activeTab === 'metrics' && renderHealthMetrics()}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default PatientPortal;
