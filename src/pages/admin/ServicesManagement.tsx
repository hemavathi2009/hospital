import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
// Update the import path below to match the actual location and filename of AdminLayout
// For example, if the file is named 'AdminLayout.tsx' in 'layouts', keep as is.
// If the folder or filename is different, update accordingly, e.g.:
import AdminLayout from '../../components/layouts/AdminLayout';
// or
// import AdminLayout from '../../components/layouts/AdminLayout.tsx';
// Update the import path below to match the actual location and filename of PageHeader
// For example, if the file is named 'PageHeader.tsx' in 'molecules', keep as is.
// If the file is named 'pageHeader.tsx' or 'PageHeader/index.tsx', update accordingly, e.g.:
// import PageHeader from '../../components/molecules/pageHeader';
// import PageHeader from '../../components/molecules/PageHeader/index';
// import PageHeader from '../../components/molecules/PageHeader'; // <-- Update this path if needed
import PageHeader from '../../components/molecules/PageHeader'; // <-- Update this path if your file is named 'PageHeader.tsx'
import Button from '../../components/atoms/Button';
import ServiceCard from '../../components/admin/services/ServiceCard';
import ServiceFormDrawer from '../../components/admin/services/ServiceFormDrawer';
import DeleteConfirmDialog from '../../components/admin/services/DeleteConfirmDialog';
// Update the path below if the actual file is named differently or located elsewhere, e.g. LoadingSpinner.tsx or loading-spinner.tsx
import LoadingSpinner from '../../components/atoms/LoadingSpinner'; // Remove .tsx extension
// If the file is named 'loading-spinner.tsx', use:
// import LoadingSpinner from '../../components/atoms/loading-spinner';
import { Service } from '../../types/service';
import { getAllServices, deleteService, reorderServices } from '../../lib/serviceFirebase';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const ServicesManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [reordering, setReordering] = useState(false);

  // Fetch all services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getAllServices();
        setServices(data);
      } catch (err) {
        setError('Failed to load services. Please try again later.');
        toast.error('Error loading services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Handle opening the form for adding a new service
  const handleAddService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  // Handle opening the form for editing a service
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  // Handle service deletion
  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    
    try {
      await deleteService(serviceToDelete.id);
      setServices(services.filter(s => s.id !== serviceToDelete.id));
      toast.success('Service deleted successfully');
    } catch (err) {
      toast.error('Failed to delete service');
    } finally {
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  // Handle form closing/cancel
  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedService(null);
  };

  // Handle service added or updated
  const handleServiceSaved = (updatedService: Service) => {
    if (selectedService) {
      // Update existing service
      setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
      toast.success('Service updated successfully');
    } else {
      // Add new service
      setServices([...services, updatedService]);
      toast.success('Service added successfully');
    }
    setIsFormOpen(false);
    setSelectedService(null);
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;
    
    const reordered = Array.from(services);
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);
    
    // Update the UI immediately for smooth UX
    setServices(reordered);
    
    // Update the order in the database
    try {
      setReordering(true);
      await reorderServices(reordered);
      toast.success('Services reordered successfully');
    } catch (err) {
      toast.error('Failed to update service order');
      // Revert to the original order on error
      const data = await getAllServices();
      setServices(data);
    } finally {
      setReordering(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Services Management"
        description="Add, edit, and manage hospital services displayed on the website"
        actions={
          <Button
            onClick={handleAddService}
            variant="primary"
            size="lg"
            disabled={isFormOpen}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Service
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-error/10 rounded-xl">
          <p className="text-error font-medium">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {reordering && (
            <div className="bg-primary/10 rounded-lg p-3 mb-6 flex items-center">
              <LoadingSpinner size="sm" className="text-primary mr-3" />
              <p className="text-sm text-primary font-medium">Updating service order...</p>
            </div>
          )}
          
          {services.length === 0 ? (
            <div className="p-12 text-center bg-muted/30 rounded-xl border border-border">
              <h3 className="text-xl font-semibold mb-3">No services found</h3>
              <p className="text-muted-foreground mb-6">
                Add your first service to display it on the website.
              </p>
              <Button onClick={handleAddService} variant="primary">
                <Plus className="w-5 h-5 mr-2" />
                Add First Service
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="services-list">
                {(provided) => (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {services.map((service, index) => (
                      <Draggable 
                        key={service.id} 
                        draggableId={service.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'z-50' : ''}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ServiceCard
                                service={service}
                                onEdit={() => handleEditService(service)}
                                onDelete={() => handleDeleteClick(service)}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </motion.div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </>
      )}

      <ServiceFormDrawer
        isOpen={isFormOpen}
        onClose={handleFormClose}
        service={selectedService}
        onSave={handleServiceSaved}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        service={serviceToDelete}
      />
    </AdminLayout>
  );
};

export default ServicesManagement;
