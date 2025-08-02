import React, { useState, useEffect } from 'react';
import { routeOptimizer } from '@/services/api/routeOptimizer';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

const DeliveryMap = ({ 
  orders, 
  driverLocation, 
  optimizedRoute, 
  selectedOrder, 
  onOrderSelect,
  teamData,
  isTeamView = false,
  selectedZone,
  onZoneSelect,
  compact = false
}) => {
  const [directions, setDirections] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapView, setMapView] = useState(isTeamView ? 'heatmap' : 'overview'); // overview, turn-by-turn, heatmap
  const [heatmapFilter, setHeatmapFilter] = useState('performance'); // performance, density, delays

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
    setMapView(isTeamView ? 'heatmap' : 'overview');
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

  const getHeatmapColor = (zone, filter) => {
    switch (filter) {
      case 'performance':
        if (zone.performance >= 90) return 'bg-green-500';
        if (zone.performance >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
      case 'density':
        const density = zone.deliveryDensity;
        if (density === 'very-high') return 'bg-red-600';
        if (density === 'high') return 'bg-orange-500';
        if (density === 'medium') return 'bg-yellow-500';
        return 'bg-green-500';
      case 'delays':
        if (zone.bottlenecks >= 3) return 'bg-red-600';
        if (zone.bottlenecks >= 1) return 'bg-yellow-500';
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const renderHeatmap = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Delivery Heatmap</h3>
        <div className="flex gap-2">
          {['performance', 'density', 'delays'].map(filter => (
            <Button
              key={filter}
              size="sm"
              variant={heatmapFilter === filter ? 'primary' : 'ghost'}
              onClick={() => setHeatmapFilter(filter)}
              className="text-xs"
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {heatmapFilter === 'performance' ? 'Performance' :
             heatmapFilter === 'density' ? 'Delivery Density' :
             'Delays & Bottlenecks'}:
          </span>
          <div className="flex items-center gap-3">
            {heatmapFilter === 'performance' && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>90%+</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>70-89%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>&lt;70%</span>
                </div>
              </>
            )}
            {heatmapFilter === 'density' && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Very High</span>
                </div>
              </>
            )}
            {heatmapFilter === 'delays' && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>No Issues</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Minor Delays</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Major Issues</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mock Map with Heatmap Zones */}
      <div className={`bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden ${compact ? 'h-48' : 'h-80'}`}>
        <div className="absolute inset-0 p-4">
          <div className="text-center mb-4">
            <ApperIcon name="Map" size={compact ? 24 : 32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Interactive Team Heatmap</p>
          </div>
          
          {/* Zone Representation */}
          <div className="grid grid-cols-3 gap-2 h-full">
            {teamData?.zones?.slice(0, 6).map((zone, index) => (
              <div
                key={zone.Id}
                className={`${getHeatmapColor(zone, heatmapFilter)} rounded-lg cursor-pointer transition-all duration-200 hover:opacity-80 relative overflow-hidden ${
                  selectedZone?.Id === zone.Id ? 'ring-2 ring-white ring-offset-2' : ''
                }`}
                onClick={() => onZoneSelect && onZoneSelect(zone)}
                style={{ opacity: 0.7 }}
              >
                <div className="absolute inset-0 p-2 flex flex-col justify-between text-white text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{zone.name}</span>
                    {zone.bottlenecks > 0 && (
                      <span className="bg-white/20 rounded-full px-1">⚠</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div>{zone.activeOrders} orders</div>
                    <div>{zone.performance}% rate</div>
                  </div>
                </div>
                
                {/* Pulse animation for urgent zones */}
                {zone.bottlenecks >= 3 && (
                  <div className="absolute inset-0 bg-red-500 rounded-lg animate-pulse opacity-20"></div>
                )}
              </div>
            ))}
          </div>

          {/* Driver Locations */}
          {teamData?.drivers?.map((driver, index) => (
            <div
              key={driver.Id}
              className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`,
              }}
              title={`${driver.name} - ${driver.status}`}
            >
              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full ${
                driver.status === 'active' ? 'bg-green-400' :
                driver.status === 'break' ? 'bg-yellow-400' :
                driver.status === 'delayed' ? 'bg-red-400' : 'bg-gray-400'
              } opacity-50 animate-ping`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Details */}
      {selectedZone && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-lg">{selectedZone.name} Zone Details</h4>
            <Button
              size="sm"
              variant="ghost"
              icon="X"
              onClick={() => onZoneSelect && onZoneSelect(null)}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Performance</p>
              <p className="font-medium text-lg">{selectedZone.performance}%</p>
            </div>
            <div>
              <p className="text-gray-500">Active Orders</p>
              <p className="font-medium text-lg">{selectedZone.activeOrders}</p>
            </div>
            <div>
              <p className="text-gray-500">Avg Delivery</p>
              <p className="font-medium text-lg">{selectedZone.avgDeliveryTime}min</p>
            </div>
            <div>
              <p className="text-gray-500">On-Time Rate</p>
              <p className="font-medium text-lg">{selectedZone.onTimeRate}%</p>
            </div>
          </div>

          {selectedZone.bottlenecks > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ApperIcon name="AlertTriangle" size={16} className="text-red-500" />
                <span className="font-medium text-red-800">
                  {selectedZone.bottlenecks} Bottleneck{selectedZone.bottlenecks !== 1 ? 's' : ''} Detected
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" icon="Zap">
                  Priority Dispatch
                </Button>
                <Button size="sm" variant="ghost" icon="Users">
                  Add Support
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{teamData?.zones?.filter(z => z.performance >= 90).length || 0}</p>
            <p className="text-sm text-gray-600">High Performance</p>
          </div>
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{teamData?.zones?.filter(z => z.bottlenecks > 0).length || 0}</p>
            <p className="text-sm text-gray-600">With Issues</p>
          </div>
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{teamData?.drivers?.filter(d => d.status === 'active').length || 0}</p>
            <p className="text-sm text-gray-600">Active Drivers</p>
          </div>
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{teamData?.zones?.reduce((sum, zone) => sum + zone.activeOrders, 0) || 0}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
        </div>
      )}
    </div>
  );

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
          onClick={() => setMapView(isTeamView ? 'heatmap' : 'overview')}
        >
          Back to {isTeamView ? 'Heatmap' : 'Overview'}
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
            onClick={() => setMapView(isTeamView ? 'heatmap' : 'overview')}
          >
            Go to {isTeamView ? 'Heatmap' : 'Overview'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className={compact ? '' : 'max-w-4xl mx-auto'}>
      {mapView === 'heatmap' ? renderHeatmap() : 
       mapView === 'overview' ? renderOverview() : renderTurnByTurn()}
    </div>
  );
};

export default DeliveryMap;