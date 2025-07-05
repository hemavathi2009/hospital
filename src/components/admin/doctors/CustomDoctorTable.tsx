import React, { useState } from 'react';
import { Edit, Trash2, Check, XCircle, Clock, Key, Clipboard, ClipboardCheck } from 'lucide-react';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { createDoctorAccessCode } from '../../../utils/accessCodes';
import { toast } from 'sonner';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  department?: string;
  bio?: string;
  verified?: boolean;
  availability?: Record<string, string[]>;
  accessCode?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

interface DoctorTableProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
  onAccessCodeGenerated?: (doctorId: string, code: string) => void;
}

const DoctorTable: React.FC<DoctorTableProps> = ({ 
  doctors, 
  onEdit, 
  onDelete, 
  onAccessCodeGenerated 
}) => {
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [doctorCodes, setDoctorCodes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      // Firestore timestamp
      return timestamp.toDate().toLocaleDateString();
    }
    // Regular date
    return new Date(timestamp).toLocaleDateString();
  };

  const handleGenerateAccessCode = async (doctorId: string) => {
    try {
      setGeneratingCode(doctorId);
      
      // Generate a permanent access code for the doctor
      const result = await createDoctorAccessCode(doctorId);
      
      // Update the local state
      setDoctorCodes(prev => ({
        ...prev,
        [doctorId]: result.code
      }));
      
      // Notify parent component
      if (onAccessCodeGenerated) {
        onAccessCodeGenerated(doctorId, result.code);
      }
      
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

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-muted/30">
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Doctor</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Specialty</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Department</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Created</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Access Code</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr 
              key={doctor.id}
              className="border-b border-border hover:bg-muted/20 transition-colors"
            >
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {doctor.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground flex items-center">
                      Dr. {doctor.name}
                      {doctor.verified && (
                        <Check className="w-4 h-4 ml-1 text-primary" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{doctor.phone || 'No phone'}</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-foreground">{doctor.email}</td>
              <td className="p-4 text-foreground">{doctor.specialty || 'Not specified'}</td>
              <td className="p-4 text-foreground">{doctor.department || 'General'}</td>
              <td className="p-4">
                <Badge 
                  variant={doctor.verified ? 'success' : 'error'}
                  className="flex items-center gap-1"
                >
                  {doctor.verified ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {doctor.verified ? 'Verified' : 'Unverified'}
                </Badge>
              </td>
              <td className="p-4 text-muted-foreground text-sm">
                {formatDate(doctor.createdAt)}
              </td>
              <td className="p-4">
                {(doctorCodes[doctor.id] || doctor.accessCode) ? (
                  <div>
                    <div className="flex items-center space-x-1">
                      <code className="bg-muted/30 px-2 py-1 rounded text-sm font-mono">
                        {doctorCodes[doctor.id] || doctor.accessCode}
                      </code>
                      <button
                        onClick={() => copyAccessCodeToClipboard(doctorCodes[doctor.id] || doctor.accessCode as string, doctor.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy to clipboard"
                      >
                        {copied === doctor.id ? (
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
                    onClick={() => handleGenerateAccessCode(doctor.id)}
                    disabled={generatingCode === doctor.id}
                    title="Generate a permanent access code for this doctor"
                  >
                    {generatingCode === doctor.id ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      <>
                        <Key className="w-3 h-3 mr-2" />
                        Generate Code
                      </>
                    )}
                  </Button>
                )}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(doctor)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(doctor.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {doctors.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-muted-foreground">
                No doctors found. Add a new doctor to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorTable;
