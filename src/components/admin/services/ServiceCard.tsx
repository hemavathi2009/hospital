import React from 'react';
import { motion } from 'framer-motion';
import { 
  Edit2, Trash2, Eye, EyeOff, Clock, 
  GripVertical, ExternalLink, Info 
} from 'lucide-react';
import Button from '../../atoms/Button';
import Card from '../../atoms/Card';
import Badge from '../../atoms/Badge';
import { Service } from '../../../types/service';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: any;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  dragHandleProps
}) => {
  return (
    <Card premium className="h-full overflow-hidden group">
      {/* Drag Handle */}
      {dragHandleProps && (
        <div 
          className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab bg-gradient-to-b from-black/30 to-transparent z-10"
          {...dragHandleProps}
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>
      )}
      
      {/* Card Header with Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {service.imageUrl ? (
          <img 
            src={service.imageUrl} 
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
              <Info className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
        )}
        
        {/* Overlay with Service Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
          <div className="p-4 w-full">
            <div className="flex items-center">
              {/* Service Icon */}
              <div className="w-10 h-10 rounded-md bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center mr-3 overflow-hidden">
                {service.iconUrl ? (
                  <img 
                    src={service.iconUrl} 
                    alt="" 
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary/20 rounded-sm"></div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-white flex-1 truncate">
                {service.name}
              </h3>
            </div>
            
            {/* Status badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {service.visible ? (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Visible
                </Badge>
              ) : (
                <Badge variant="error" size="sm" className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Hidden
                </Badge>
              )}
              
              {service.available24h && (
                <Badge variant="info" size="sm" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  24/7
                </Badge>
              )}
              
              {service.category && (
                <Badge variant="secondary" size="sm">
                  {service.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <p className="text-muted-foreground text-sm line-clamp-2">
          {service.shortDescription || service.description}
        </p>
        
        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs uppercase text-muted-foreground font-medium mb-2">Features</h4>
            <ul className="space-y-1">
              {service.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="text-xs flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 mr-2"></span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {service.features.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{service.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-2 flex items-center justify-between mt-auto border-t border-border">
        <div className="text-xs text-muted-foreground">
          Order: <span className="font-medium">{service.order}</span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={onEdit}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <a
            href={`/services?highlight=${service.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-gray-500 hover:text-gray-600 hover:bg-gray-50 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;
