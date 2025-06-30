import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Facility } from '../types/facility';

const sampleFacilities: Omit<Facility, 'id'>[] = [
  {
    name: 'Advanced Imaging Center',
    shortDescription: 'State-of-the-art diagnostic imaging services',
    description: 'Our Advanced Imaging Center offers comprehensive diagnostic services with the latest technology. From MRIs and CT scans to ultrasounds and X-rays, our facility delivers precise diagnostic results to help physicians make accurate diagnoses and treatment plans.',
    category: 'Diagnostics',
    features: [
      'Same-day appointments',
      'Digital results delivery',
      'Expert radiologists',
      'Painless procedures',
      'Quick turnaround time'
    ],
    equipment: [
      'MRI 3T Scanner',
      'Multi-slice CT Scanner',
      'Digital X-ray',
      '4D Ultrasound',
      'PET-CT Scanner'
    ],
    staffCount: 28,
    available24h: false,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Emergency Trauma Center',
    shortDescription: 'Critical care available 24/7 for emergencies',
    description: 'Our Emergency Trauma Center is equipped to handle any medical emergency, from minor injuries to life-threatening conditions. With a team of specialized emergency physicians and trauma surgeons available around the clock, we provide immediate care when you need it most.',
    category: 'Emergency',
    features: [
      'No appointment needed',
      'Rapid triage',
      'Trauma specialists',
      'Critical care units',
      'Helicopter landing pad'
    ],
    equipment: [
      'Advanced life support systems',
      'Trauma resuscitation equipment',
      'Bedside ultrasound',
      'Rapid infusers',
      'Mobile X-ray units'
    ],
    staffCount: 62,
    available24h: true,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cardiac Catheterization Lab',
    shortDescription: 'Specialized center for heart diagnostics and treatments',
    description: 'The Cardiac Catheterization Lab at MediCare+ provides advanced diagnostic and interventional procedures for heart conditions. Our specialized team uses minimally invasive techniques to diagnose and treat coronary artery disease, heart valve problems, and other cardiac issues.',
    category: 'Cardiology',
    features: [
      'Minimally invasive procedures',
      'Advanced cardiac imaging',
      'Stent placement',
      'Balloon angioplasty',
      'Heart rhythm evaluations'
    ],
    equipment: [
      'Biplane angiography system',
      'Intravascular ultrasound',
      'Fractional flow reserve',
      'Cardiac pacemakers',
      'Implantable defibrillators'
    ],
    staffCount: 34,
    available24h: true,
    image: 'https://images.unsplash.com/photo-1631815585553-7babdcc66cc9?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Physical Rehabilitation Center',
    shortDescription: 'Comprehensive rehabilitation services for recovery',
    description: 'Our Physical Rehabilitation Center supports patients recovering from surgery, injury, or illness. With specialized equipment and expert therapists, we develop personalized treatment plans to help patients regain strength, mobility, and independence through physical therapy, occupational therapy, and speech therapy.',
    category: 'Rehabilitation',
    features: [
      'Personalized treatment plans',
      'Aquatic therapy pool',
      'Sports medicine',
      'Neurological rehabilitation',
      'Post-operative recovery'
    ],
    equipment: [
      'Anti-gravity treadmill',
      'Hydrotherapy pool',
      'Robotic gait training',
      'Therapeutic ultrasound',
      'Motion analysis technology'
    ],
    staffCount: 42,
    available24h: false,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Surgical Suite',
    shortDescription: 'Advanced operating rooms for all surgical needs',
    description: 'Our Surgical Suite features state-of-the-art operating rooms equipped for a wide range of procedures, from minimally invasive surgeries to complex operations. With the latest surgical technology and a dedicated team of surgeons, anesthesiologists, and nurses, we ensure the highest standards of care for surgical patients.',
    category: 'Surgery',
    features: [
      'Minimally invasive options',
      'Robotic surgery capability',
      'Same-day surgery',
      'Specialized surgical teams',
      'Advanced anesthesia monitoring'
    ],
    equipment: [
      'da Vinci Surgical System',
      'Hybrid operating rooms',
      'Laparoscopic equipment',
      'Intraoperative imaging',
      'Computer-assisted navigation'
    ],
    staffCount: 55,
    available24h: true,
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const importSampleFacilities = async () => {
  try {
    for (const facility of sampleFacilities) {
      await addDoc(collection(db, 'facilities'), facility);
    }
    return `Successfully imported ${sampleFacilities.length} sample facilities`;
  } catch (error) {
    console.error('Error importing sample facilities:', error);
    throw error;
  }
};
