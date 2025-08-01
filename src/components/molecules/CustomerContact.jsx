import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';

const CustomerContact = ({ order, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const messageTemplates = [
    {
      id: 'on_way',
      title: 'On My Way',
      message: `Hi ${order.customer?.name}, I'm on my way with your order #${order.Id}! ETA: 10 minutes.`,
      icon: 'Truck'
    },
    {
      id: 'arrived',
      title: 'Arrived',
      message: `Hi ${order.customer?.name}, I've arrived with your order #${order.Id}. I'm at your door!`,
      icon: 'MapPin'
    },
    {
      id: 'cant_find',
      title: 'Can\'t Find Address',
      message: `Hi ${order.customer?.name}, I'm having trouble finding your address for order #${order.Id}. Please call me back or provide additional directions.`,
      icon: 'AlertCircle'
    },
    {
      id: 'delayed',
      title: 'Running Late',
      message: `Hi ${order.customer?.name}, I'm running a few minutes late with your order #${order.Id} due to traffic. New ETA: 15 minutes. Thanks for your patience!`,
      icon: 'Clock'
    },
    {
      id: 'delivery_attempt',
      title: 'Delivery Attempt',
      message: `Hi ${order.customer?.name}, I attempted to deliver your order #${order.Id} but no one was available. Please call me to reschedule or provide delivery instructions.`,
      icon: 'Phone'
    }
  ];

  const handleCall = () => {
    if (order.customer?.phone) {
      window.open(`tel:${order.customer.phone}`);
      toast.success('Opening phone dialer...');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleSMS = (template) => {
    if (order.customer?.phone) {
      const message = encodeURIComponent(template.message);
      window.open(`sms:${order.customer.phone}?body=${message}`);
      toast.success('Opening SMS app...');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleWhatsApp = (template) => {
    if (order.customer?.phone) {
      const message = encodeURIComponent(template.message);
      const phone = order.customer.phone.replace(/[^\d]/g, ''); // Remove non-digits
      window.open(`https://wa.me/${phone}?text=${message}`);
      toast.success('Opening WhatsApp...');
    } else {
      toast.error('No phone number available');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customer Contact</h2>
          <Button variant="ghost" size="sm" icon="X" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Order #{order.Id}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{order.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{order.customer?.phone || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="success"
            icon="Phone"
            onClick={handleCall}
            disabled={!order.customer?.phone}
            className="w-full"
          >
            Call Customer
          </Button>
          <Button
            variant="primary"
            icon="MessageSquare"
            onClick={() => {
              if (messageTemplates[0]) {
                handleSMS(messageTemplates[0]);
              }
            }}
            disabled={!order.customer?.phone}
            className="w-full"
          >
            Quick SMS
          </Button>
          <Button
            variant="secondary"
            icon="MessageCircle"
            onClick={() => {
              if (messageTemplates[0]) {
                handleWhatsApp(messageTemplates[0]);
              }
            }}
            disabled={!order.customer?.phone}
            className="w-full"
          >
            WhatsApp
          </Button>
        </div>

        {/* Message Templates */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Message Templates</h3>
          <div className="space-y-3">
            {messageTemplates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start gap-3">
                  <ApperIcon 
                    name={template.icon} 
                    size={20} 
                    className="text-primary mt-1 flex-shrink-0" 
                  />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{template.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.message}</p>
                    
                    {selectedTemplate === template.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="MessageSquare"
                          onClick={() => handleSMS(template)}
                          disabled={!order.customer?.phone}
                        >
                          Send SMS
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="MessageCircle"
                          onClick={() => handleWhatsApp(template)}
                          disabled={!order.customer?.phone}
                        >
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="Copy"
                          onClick={() => {
                            navigator.clipboard.writeText(template.message);
                            toast.success('Message copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
            <h4 className="font-semibold text-red-800">Emergency Contact</h4>
          </div>
          <p className="text-sm text-red-700 mb-3">
            If you encounter any safety issues or emergencies during delivery:
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              icon="Phone"
              onClick={() => window.open('tel:911')}
            >
              Call 911
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon="Shield"
              onClick={() => window.open('tel:+1-800-SUPPORT')}
            >
              Dispatch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerContact;