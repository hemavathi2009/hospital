import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, QrCode, Copy, Check, Smartphone, AlertTriangle, Upload, X, FileText, Image, File } from 'lucide-react';
import Button from '../../atoms/Button';
import { AppointmentData } from '../../../pages/AppointmentBooking';

interface StepPaymentProps {
  appointmentData: AppointmentData;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * Generates a UPI QR code URL using the provided parameters
 * @param upiId The UPI ID to receive payment
 * @param amount The payment amount
 * @param payeeName The name of the payee
 * @param transactionRef The transaction reference
 * @returns A URL that renders a QR code when loaded
 */
const generateUpiQrCode = (
  upiId: string,
  amount: number,
  payeeName: string = 'MediCare+',
  transactionRef: string = '',
  description: string = 'Appointment Payment'
) => {
  // Format UPI payment URL according to UPI deep link specifications
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${encodeURIComponent(transactionRef)}`;
  
  // Options for QR code generation
  const qrOptions = 'chs=300x300&chld=L|0';
  
  // Use Google Chart API to generate the QR code
  return `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(upiUrl)}&${qrOptions}`;
};

const StepPayment: React.FC<StepPaymentProps> = ({
  appointmentData,
  onComplete,
  onBack
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'upi'>('qr');
  const [copied, setCopied] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);
  
  // New state variables for payment proof upload
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // UPI payment details
  const upiId = "9392521026@axl";
  // Calculate appointment fee - could be based on doctor or department
  const appointmentFee = 500; // In rupees
  
  // Generate transaction reference using appointment data
  const transactionRef = `APPT-${appointmentData.doctor?.substring(0, 5)}-${Date.now()}`;
  
  // Generate description for the payment
  const paymentDescription = `Appointment with Dr. ${appointmentData.doctorName}`;
  
  // Create QR code URL with all parameters
  const qrCodeUrl = generateUpiQrCode(
    upiId,
    appointmentFee,
    'MediCare+',
    transactionRef,
    paymentDescription
  );
  
  // Function to handle UPI ID copying
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Function to handle verification of payment (in a real app would involve actual verification)
  const handleVerifyPayment = () => {
    // Here you would typically verify the payment with a backend API
    // For now, we'll just simulate verification
    if (!paymentProof || !transactionId.trim()) {
      setUploadError("Please upload payment proof and enter transaction ID");
      return;
    }
    
    setPaymentVerified(true);
    setUploadError(null);
  };
  
  // Handle payment proof file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!file.type.match('image.*') && !file.type.match('application/pdf')) {
      setUploadError('Please upload an image or PDF file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size should be less than 5MB');
      return;
    }
    
    setPaymentProof(file);
    
    // Create preview for image files
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just show an icon
      setPaymentProofPreview(null);
    }
  };
  
  // Remove uploaded file
  const handleRemoveFile = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Payment</h2>
          <p className="text-muted-foreground">
            Complete your payment to confirm your appointment
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Payment Summary */}
        <motion.div variants={itemVariants} className="p-6 border border-border rounded-xl bg-muted/10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Summary</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Appointment with Dr. {appointmentData.doctorName}</span>
              <span className="font-medium">₹{appointmentFee}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Date & Time</span>
              <span>{appointmentData.date} at {appointmentData.time}</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-medium text-foreground">Total Amount</span>
              <span className="font-bold text-foreground">₹{appointmentFee}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Payment Method Selector */}
        <motion.div variants={itemVariants} className="flex items-center justify-center space-x-4 p-4">
          <Button
            variant={paymentMethod === 'qr' ? 'primary' : 'outline'}
            onClick={() => setPaymentMethod('qr')}
            className="flex-1 md:flex-initial"
          >
            <QrCode className="w-5 h-5 mr-2" />
            QR Code
          </Button>
          <Button
            variant={paymentMethod === 'upi' ? 'primary' : 'outline'}
            onClick={() => setPaymentMethod('upi')}
            className="flex-1 md:flex-initial"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            UPI ID
          </Button>
        </motion.div>
        
        {/* QR Code Payment */}
        {paymentMethod === 'qr' && (
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col items-center justify-center p-6 border border-border rounded-xl bg-white"
          >
            <div className="text-center mb-6">
              <h4 className="font-medium text-foreground mb-2">Scan QR Code to Pay</h4>
              <p className="text-sm text-muted-foreground">Use any UPI app to scan and pay</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-border mb-6 relative">
              {!qrCodeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-64 h-64 object-contain"
                onLoad={() => setQrCodeLoaded(true)}
                style={{ opacity: qrCodeLoaded ? 1 : 0.3 }}
              />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-foreground">Amount: ₹{appointmentFee}</p>
              <p className="text-xs text-muted-foreground mt-1">UPI ID: {upiId}</p>
              <p className="text-xs text-success mt-2">Transaction Reference: {transactionRef}</p>
            </div>

            <div className="flex gap-4 justify-center mt-2">
              <div className="flex flex-wrap gap-2 justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%282020%29.svg/150px-Paytm_Logo_%282020%29.svg.png" alt="Paytm" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/150px-Google_Pay_Logo.svg.png" alt="Google Pay" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/150px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-6" />
              </div>
            </div>
          </motion.div>
        )}
        
        {/* UPI ID Payment */}
        {paymentMethod === 'upi' && (
          <motion.div 
            variants={itemVariants} 
            className="p-6 border border-border rounded-xl bg-white"
          >
            <div className="text-center mb-6">
              <h4 className="font-medium text-foreground mb-2">Pay using UPI ID</h4>
              <p className="text-sm text-muted-foreground">Open any UPI app and pay to this ID</p>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="bg-muted/10 p-4 rounded-lg flex items-center justify-between w-full max-w-md">
                <div className="font-medium text-foreground">{upiId}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUpiId}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Amount: ₹{appointmentFee}</p>
              <div className="flex items-center justify-center mt-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-8" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%282020%29.svg/150px-Paytm_Logo_%282020%29.svg.png" alt="Paytm" className="h-8" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/150px-Google_Pay_Logo.svg.png" alt="Google Pay" className="h-8" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/150px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-8" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* NEW: Payment Proof Upload - Required Section */}
        <motion.div 
          variants={itemVariants} 
          className="p-6 border border-border rounded-xl bg-white"
        >
          <div className="text-center mb-4">
            <h4 className="font-medium text-foreground mb-2">Upload Payment Proof <span className="text-red-500">*</span></h4>
            <p className="text-sm text-muted-foreground">
              Please upload a screenshot or receipt of your completed payment
            </p>
          </div>
          
          {/* Transaction ID input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter your payment transaction ID"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              required
            />
          </div>
          
          {!paymentProof ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-foreground font-medium">Click to upload payment proof</p>
              <p className="text-sm text-muted-foreground mt-1">
                Support JPG, PNG, PDF (Max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select File
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {paymentProof.type.match('image.*') ? (
                    <Image className="w-5 h-5 text-primary mr-2" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary mr-2" />
                  )}
                  <span className="text-foreground font-medium">{paymentProof.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Preview for image files */}
              {paymentProofPreview && (
                <div className="mt-2 border border-border rounded-lg overflow-hidden">
                  <img 
                    src={paymentProofPreview} 
                    alt="Payment proof" 
                    className="max-h-48 mx-auto object-contain"
                  />
                </div>
              )}
              
              {/* For PDF files */}
              {paymentProof.type === 'application/pdf' && (
                <div className="mt-2 p-3 bg-muted/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="w-5 h-5 text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">PDF Document</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(paymentProof.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Error message */}
          {uploadError && (
            <div className="mt-2 text-sm text-red-500">
              {uploadError}
            </div>
          )}
        </motion.div>
        
        {/* Payment Notice */}
        <motion.div variants={itemVariants} className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Payment Instructions:</p>
            <p>After completing your payment, upload the payment proof and enter the transaction ID. Your appointment will be confirmed once the payment is verified.</p>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-end gap-4">
          {!paymentVerified ? (
            <>
              <Button
                variant="outline"
                onClick={handleVerifyPayment}
              >
                I've Completed Payment
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={onComplete}
            >
              <Check className="w-5 h-5 mr-2" />
              Continue to Confirmation
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StepPayment;
