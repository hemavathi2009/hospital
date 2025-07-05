import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import {
  Calendar,
  MapPin,
  User,
  Stethoscope,
  Award,
  Languages,
  BookOpen,
  Clock,
  Check,
  Star,
  Heart,
} from 'lucide-react';

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
  education?: string[];
  languages?: string[];
  availability?: {
    [key: string]: string[];
  };
  verified?: boolean;
  createdAt?: any;
}

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (doctor: Doctor) => void;
}

const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onBookAppointment,
}) => {
  const [activeTab, setActiveTab] = useState('about');
  const navigate = useNavigate();

  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Doctor header with gradient background */}
        <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-8 pb-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-4 md:mb-0 md:mr-6">
              {doctor.image ? (
                <img 
                  src={doctor.image} 
                  alt={`Dr. ${doctor.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-1">Dr. {doctor.name}</h2>
              <p className="text-white/80 text-xl mb-3">{doctor.specialty}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {doctor.department && (
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                    {doctor.department}
                  </Badge>
                )}
                {doctor.rating && (
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(doctor.rating || 4.5) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                      />
                    ))}
                    <span className="ml-2">({doctor.rating})</span>
                  </div>
                )}
                {doctor.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{doctor.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Doctor content */}
        <div className="bg-white rounded-t-3xl -mt-12 relative z-10 p-8">
          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'about' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('about')}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                About
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'expertise' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('expertise')}
            >
              <div className="flex items-center">
                <Stethoscope className="w-4 h-4 mr-2" />
                Expertise
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'education' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('education')}
            >
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Education
              </div>
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Bio */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Biography</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {doctor.bio || `Dr. ${doctor.name} is a dedicated healthcare professional specializing in ${doctor.specialty}. With ${doctor.experience || 'years of'} experience, they are committed to providing excellent patient care and staying at the forefront of medical advancements in their field.`}
                  </p>
                </div>
                
                {/* Experience */}
                {doctor.experience && (
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Experience</h3>
                    <div className="flex items-center">
                      <div className="mr-3 mt-1">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground">{doctor.experience}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Languages */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages ? (
                      doctor.languages.map((language, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {language}
                        </Badge>
                      ))
                    ) : (
                      <>
                        <Badge variant="secondary" className="px-3 py-1">English</Badge>
                        <Badge variant="secondary" className="px-3 py-1">Spanish</Badge>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'expertise' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">Areas of Expertise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doctor.specialty}</p>
                      <p className="text-sm text-muted-foreground">Primary Specialty</p>
                    </div>
                  </div>
                  
                  {doctor.department && (
                    <div className="flex items-start p-4 border border-border rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Stethoscope className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{doctor.department}</p>
                        <p className="text-sm text-muted-foreground">Department</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start p-4 border border-border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Patient Care</p>
                      <p className="text-sm text-muted-foreground">Focused on patient wellbeing</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'education' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">Education & Training</h3>
                <ul className="space-y-4">
                  {doctor.education ? (
                    doctor.education.map((edu, index) => (
                      <li key={index} className="flex items-start">
                        <div className="mr-3 mt-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground">{edu}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start">
                        <div className="mr-3 mt-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground">M.D., University Medical School</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-3 mt-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground">Residency, General Hospital</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-3 mt-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground">Fellowship in {doctor.specialty}</p>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">Certifications</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground">Board Certified in {doctor.specialty}</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground">Advanced Cardiac Life Support (ACLS)</p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
          
          {/* CTA Buttons */}
          <DialogFooter className="flex sm:justify-center gap-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                onClose();
                onBookAppointment(doctor);
              }}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorDetailModal;
