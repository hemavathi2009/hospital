import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../../atoms/Button';
import { Service } from '../../../types/service';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: Service | null;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  service
}) => {
  if (!service) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-xl shadow-lg w-full max-w-md relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-error/10 p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Delete Service
                </h3>
                <p className="text-muted-foreground mt-1">
                  Are you sure you want to delete this service? This action cannot be undone.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Service Details */}
            <div className="p-6 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                {service.iconUrl && (
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    <img
                      src={service.iconUrl}
                      alt=""
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{service.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {service.shortDescription || service.description.substring(0, 60) + '...'}
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This will remove the service from your website and all related appointments will be affected.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-muted/10">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={onConfirm}
              >
                Delete Service
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmDialog;
