import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';

const ProofOfDelivery = ({ order, onComplete, onCancel }) => {
  const [signature, setSignature] = useState('');
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useState(() => {
    // Get current location for geotagging
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, []);

  // Signature pad functionality
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Convert canvas to data URL
      const canvas = canvasRef.current;
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  // Photo capture
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto({
          file,
          dataUrl: e.target.result,
          timestamp: new Date().toISOString(),
          location
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const takePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleComplete = () => {
    if (!signature && !photo) {
      toast.error('Please provide either a signature or photo as proof of delivery');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter the name of the person who received the delivery');
      return;
    }

    const proofData = {
      signature,
      photo,
      notes: notes.trim(),
      receivedBy: customerName.trim(),
      location,
      timestamp: new Date().toISOString(),
      deliveryType: 'hand_to_customer'
    };

    onComplete(proofData);
    toast.success('Delivery completed successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Proof of Delivery</h2>
          <Button variant="ghost" size="sm" icon="X" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Order #{order.Id}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{order.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Items</p>
              <p className="font-medium">{order.items?.length || 0} items</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium">${order.total?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Received By */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Received By (Required) *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter name of person who received the delivery"
            className="input-field"
            required
          />
        </div>

        {/* Digital Signature */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Signature
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border border-gray-300 rounded-lg w-full cursor-crosshair"
              style={{ maxHeight: '200px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">Sign above</p>
              <Button
                size="sm"
                variant="ghost"
                icon="RotateCcw"
                onClick={clearSignature}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Photo Capture */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Photo
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {photo ? (
              <div className="relative">
                <img
                  src={photo.dataUrl}
                  alt="Delivery proof"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="danger"
                  icon="Trash2"
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
                {location && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    📍 Geotagged
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="Camera" size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Take a photo of the delivered package</p>
                <Button
                  variant="primary"
                  icon="Camera"
                  onClick={takePhoto}
                >
                  Take Photo
                </Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
        </div>

        {/* Delivery Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about the delivery..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Location Info */}
        {location && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ApperIcon name="MapPin" size={16} className="text-green-600" />
              <span className="text-sm text-green-800 font-medium">Location Captured</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
            <p className="text-xs text-green-700">
              {new Date(location.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            icon="CheckCircle"
            onClick={handleComplete}
            disabled={!signature && !photo}
          >
            Complete Delivery
          </Button>
        </div>

        {/* Requirements Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ApperIcon name="Info" size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Proof of Delivery Requirements</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Name of person who received the delivery (required)</li>
                <li>• Digital signature OR photo (at least one required)</li>
                <li>• Location data is automatically captured when available</li>
                <li>• All data is timestamped for verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofOfDelivery;