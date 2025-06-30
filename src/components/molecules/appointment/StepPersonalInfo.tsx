import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, FileCheck, AlertCircle } from 'lucide-react';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import { AppointmentData } from '../../../pages/AppointmentBooking';
import { Checkbox } from '../../ui/checkbox';
import { FormField, Form, FormControl, FormItem, FormLabel, FormMessage } from '../../ui/form';

interface StepPersonalInfoProps {
  formData: AppointmentData;
  onSubmit: (data: Partial<AppointmentData>) => void;
  onBack: () => void;
}

// Form validation schema using Zod - Updated with more comprehensive validation
const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().min(6, 'Phone number is required')
    .regex(/^[0-9+\s()-]{6,20}$/, 'Please enter a valid phone number'),
  message: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  isNewPatient: z.boolean().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

type FormData = z.infer<typeof personalInfoSchema>;

const StepPersonalInfo: React.FC<StepPersonalInfoProps> = ({
  formData,
  onSubmit,
  onBack
}) => {
  // React Hook Form with Zod validation
  const form = useForm<FormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      message: formData.message || '',
      insuranceProvider: formData.insuranceProvider || '',
      insuranceNumber: formData.insuranceNumber || '',
      isNewPatient: formData.isNewPatient || false,
      acceptTerms: false
    }
  });

  const { formState: { errors, isSubmitting } } = form;

  const onFormSubmit: SubmitHandler<FormData> = (data) => {
    onSubmit(data);
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
          <h2 className="text-2xl font-bold text-foreground mb-1">Your Details</h2>
          <p className="text-muted-foreground">
            Please provide your personal information
          </p>
        </div>
      </div>

      <Form {...form}>
        <motion.form 
          onSubmit={form.handleSubmit(onFormSubmit)}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
          noValidate
        >
          {/* Personal Information */}
          <div className="p-6 border border-border rounded-xl bg-muted/5">
            <h3 className="text-lg font-medium text-foreground flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-primary" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your first name"
                          error={errors.firstName?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your last name"
                          error={errors.lastName?.message}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          error={errors.email?.message}
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="Enter your phone number"
                          error={errors.phone?.message}
                          icon={<Phone className="w-4 h-4" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </div>
          </div>
          
          {/* Medical Information */}
          <motion.div variants={itemVariants} className="p-6 border border-border rounded-xl bg-muted/5">
            <h3 className="text-lg font-medium text-foreground flex items-center mb-4">
              <FileCheck className="w-5 h-5 mr-2 text-primary" />
              Medical Information
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your insurance provider"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your insurance number"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isNewPatient"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer text-sm text-muted-foreground">
                      I am a new patient
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
          
          {/* Additional Information */}
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Please provide any additional information that may be helpful for your visit"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>
          
          {/* Terms and Conditions */}
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm cursor-pointer">
                      I accept the terms and conditions
                    </FormLabel>
                    {errors.acceptTerms && (
                      <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </motion.div>
          
          {/* Notes */}
          <motion.div variants={itemVariants} className="flex items-start p-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Please Note:</p>
              <p>Personal information is collected solely for appointment scheduling and medical purposes. 
              Your data is protected in accordance with healthcare privacy regulations.</p>
            </div>
          </motion.div>
          
          {/* Submit Button */}
          <motion.div variants={itemVariants} className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : 'Continue'}
            </Button>
          </motion.div>
        </motion.form>
      </Form>
    </div>
  );
};

export default StepPersonalInfo;
