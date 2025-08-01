import React, { useState, useEffect } from 'react';
import { routeOptimizer } from '@/services/api/routeOptimizer';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

const DeliveryMap = ({ orders, driverLocation, optimizedRoute, selectedOrder, onOrderSelect }) => {
  const [directions, setDirections] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapView, setMapView] = useState('overview'); // overview, turn-by-turn

  const startNavigation = async (order) => {
    if (!driverLocation) {
      toast.error('Location required for navigation');
      return;
    }

    try {
      const destination = routeOptimizer.parseAddress(order.deliveryAddress);
      const directionsData = await routeOptimizer.getDirections(driverLocation, destination);
      
      setDirections(directionsData);
      setCurrentStep(0);
      setIsNavigating(true);
      setMapView('turn-by-turn');
      onOrderSelect(order);
      
      toast.success('Navigation started');
    } catch (error) {
      toast.error('Failed to get directions');
    }
  };

  const nextStep = () => {
    if (directions && currentStep < directions.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDirections(null);
    setCurrentStep(0);
    setMapView('overview');
  };

  const openExternalMap = (order) => {
    const address = encodeURIComponent(order.deliveryAddress);
    
    // Detect platform and open appropriate map app
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/android/i.test(userAgent)) {
      // Android - prefer Google Maps
      window.open(`https://maps.google.com/?q=${address}`, '_blank');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      // iOS - prefer Apple Maps, fallback to Google Maps
      window.open(`https://maps.apple.com/?q=${address}`, '_blank');
    } else {
      // Desktop - Google Maps
      window.open(`https://maps.google.com/?q=${address}`, '_blank');
    }
    
    toast.success('Opening external map app...');
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Delivery Overview</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            icon="Navigation"
            onClick={() => setMapView('turn-by-turn')}
            disabled={!selectedOrder}
          >
            Turn-by-Turn
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="RotateCcw"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Mock Map Display */}
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <ApperIcon name="Map" size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Interactive Map View</p>
          <p className="text-sm text-gray-400">
            {driverLocation ? 'Driver location detected' : 'Location access required'}
          </p>
        </div>
      </div>

      {/* Route Summary */}
      {optimizedRoute && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Optimized Route</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Total Distance</p>
              <p className="font-medium">{optimizedRoute.totalDistance} km</p>
            </div>
            <div>
              <p className="text-blue-600">Estimated Time</p>
              <p className="font-medium">{optimizedRoute.estimatedTime} min</p>
            </div>
            <div>
              <p className="text-blue-600">Stops</p>
              <p className="font-medium">{optimizedRoute.stops.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery List */}
      <div className="space-y-3">
        <h4 className="font-semibold">Upcoming Deliveries</h4>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No deliveries scheduled</p>
        ) : (
          orders.map((order, index) => (
            <div
              key={order.Id}
              className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                selectedOrder?.Id === order.Id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-lg">{order.priority === 'urgent' ? '🔴' : '🟢'}</span>
                  <div>
                    <p className="font-medium">Order #{order.Id}</p>
                    <p className="text-sm text-gray-600">{order.customer?.name}</p>
                  </div>
                </div>
                <Badge variant={order.deliveryStatus?.replace('_', '-')}>
                  {order.deliveryStatus?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{order.deliveryAddress}</p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon="Navigation"
                  onClick={(e) => {
                    e.stopPropagation();
                    startNavigation(order);
                  }}
                >
                  Navigate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="ExternalLink"
                  onClick={(e) => {
                    e.stopPropagation();
                    openExternalMap(order);
                  }}
                >
                  External Map
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTurnByTurn = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          size="sm"
          variant="ghost"
          icon="ArrowLeft"
          onClick={() => setMapView('overview')}
        >
          Back to Overview
        </Button>
        {isNavigating && (
          <Button
            size="sm"
            variant="danger"
            icon="Square"
            onClick={stopNavigation}
          >
            Stop Navigation
          </Button>
        )}
      </div>

      {selectedOrder && (
        <div className="bg-primary text-white rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <ApperIcon name="Navigation" size={24} />
            <div>
              <h3 className="font-semibold">Navigating to Order #{selectedOrder.Id}</h3>
              <p className="text-primary-100">{selectedOrder.customer?.name}</p>
            </div>
          </div>
          <p className="text-primary-100">{selectedOrder.deliveryAddress}</p>
        </div>
      )}

      {directions ? (
        <div className="space-y-4">
          {/* Route Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Distance</p>
                <p className="font-medium">{directions.distance} km</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium">{directions.duration} min</p>
              </div>
            </div>
          </div>

          {/* Current Step */}
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {currentStep + 1}
              </div>
              <h4 className="font-semibold text-lg">Current Instruction</h4>
            </div>
            <p className="text-lg mb-4">{directions.steps[currentStep]?.instruction}</p>
            
            {directions.steps[currentStep]?.distance > 0 && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Distance: {directions.steps[currentStep].distance} km</span>
                <span>Time: {directions.steps[currentStep].duration} min</span>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              icon="ChevronLeft"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500">
              Step {currentStep + 1} of {directions.steps.length}
            </span>
            <Button
              variant="primary"
              icon="ChevronRight"
              onClick={nextStep}
              disabled={currentStep === directions.steps.length - 1}
            >
              Next
            </Button>
          </div>

          {/* All Steps */}
          <div className="space-y-2">
            <h4 className="font-semibold">All Directions</h4>
            {directions.steps.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  index === currentStep
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <p className={index === currentStep ? 'font-medium' : ''}>{step.instruction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ApperIcon name="Navigation" size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Navigation</h3>
          <p className="text-gray-500 mb-4">Select an order from the overview to start navigation</p>
          <Button
            variant="primary"
            onClick={() => setMapView('overview')}
          >
            Go to Overview
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {mapView === 'overview' ? renderOverview() : renderTurnByTurn()}
    </div>
  );
};

export default DeliveryMap;