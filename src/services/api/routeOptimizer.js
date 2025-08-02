class RouteOptimizer {
  constructor() {
    this.restrictedZones = [
      // School zones (example coordinates)
      { lat: 40.7589, lng: -73.9851, radius: 500, type: 'school', hours: '7-17' },
      // Construction zones
      { lat: 40.7505, lng: -73.9934, radius: 300, type: 'construction', hours: '24' }
    ];
  }

  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async optimizeRoute(startLocation, orders, trafficIncidents = []) {
    await this.delay();

    if (!orders || orders.length === 0) {
      return { stops: [], totalDistance: 0, estimatedTime: 0 };
    }

    // Check for active traffic incidents and update restricted zones
    const activeIncidents = await this.getActiveTrafficIncidents();
    this.updateRestrictedZonesForTraffic([...trafficIncidents, ...activeIncidents]);

    // Convert orders to delivery points
    const deliveryPoints = orders.map(order => ({
      orderId: order.Id,
      location: this.parseAddress(order.deliveryAddress),
      priority: order.priority,
      deliveryWindow: order.deliveryWindow,
      customer: order.customer,
      currentRoute: order.currentRoute // Track existing route for rerouting
    }));

    // Apply clustering for nearby deliveries
    const clusters = this.clusterDeliveries(deliveryPoints);
    
    // Optimize route within each cluster with traffic awareness
    const optimizedClusters = await Promise.all(
      clusters.map(cluster => this.optimizeClusterWithTraffic(startLocation, cluster, activeIncidents))
    );

    // Combine clusters into final route
    const finalRoute = this.combineOptimizedClusters(startLocation, optimizedClusters);
    
    // Calculate total metrics with traffic impact
    const totalDistance = this.calculateTotalDistance(startLocation, finalRoute.stops);
    const estimatedTime = this.calculateEstimatedTimeWithTraffic(totalDistance, finalRoute.stops.length, activeIncidents);

    return {
      stops: finalRoute.stops,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTime: Math.round(estimatedTime),
      clusters: optimizedClusters.length,
      avoidedZones: finalRoute.avoidedZones || [],
      trafficIncidents: activeIncidents,
      reroutedOrders: finalRoute.reroutedOrders || [],
      alternativeRoutes: finalRoute.alternativeRoutes || []
    };
  }

  clusterDeliveries(deliveryPoints, maxDistance = 2) { // 2km cluster radius
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < deliveryPoints.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [deliveryPoints[i]];
      visited.add(i);

      // Find nearby deliveries
      for (let j = i + 1; j < deliveryPoints.length; j++) {
        if (visited.has(j)) continue;

        const distance = this.calculateDistance(
          deliveryPoints[i].location,
          deliveryPoints[j].location
        );

        if (distance <= maxDistance) {
          cluster.push(deliveryPoints[j]);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  async optimizeCluster(startLocation, clusterPoints) {
    // Sort by priority and delivery window
    const sortedPoints = clusterPoints.sort((a, b) => {
      // Urgent deliveries first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      // Then by delivery window
      if (a.deliveryWindow && b.deliveryWindow) {
        return new Date(a.deliveryWindow.start) - new Date(b.deliveryWindow.start);
      }

      return 0;
    });

    // Apply nearest neighbor algorithm with traffic consideration
    const optimizedOrder = await this.nearestNeighborWithTraffic(startLocation, sortedPoints);
    
    return {
      points: optimizedOrder,
      startLocation,
      avoidedZones: this.checkRestrictedZones(optimizedOrder)
    };
  }

  async nearestNeighborWithTraffic(currentLocation, points) {
    const result = [];
    const remaining = [...points];
    let current = currentLocation;

    while (remaining.length > 0) {
      let nearest = null;
      let shortestDistance = Infinity;
      let bestIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const point = remaining[i];
        
        // Check if point is in restricted zone
        if (this.isInRestrictedZone(point.location)) {
          continue; // Skip restricted locations during certain hours
        }

        const distance = this.calculateDistanceWithTraffic(current, point.location);
        
        // Priority boost for urgent deliveries
        const adjustedDistance = point.priority === 'urgent' ? distance * 0.7 : distance;

        if (adjustedDistance < shortestDistance) {
          shortestDistance = adjustedDistance;
          nearest = point;
          bestIndex = i;
        }
      }

      if (nearest) {
        result.push(nearest);
        remaining.splice(bestIndex, 1);
        current = nearest.location;
      } else {
        // If all remaining points are restricted, add them anyway
        result.push(...remaining);
        break;
      }
    }

    return result;
  }

  combineOptimizedClusters(startLocation, optimizedClusters) {
    // Sort clusters by distance from start location
    const sortedClusters = optimizedClusters.sort((a, b) => {
      const distanceA = this.calculateDistance(startLocation, a.points[0]?.location);
      const distanceB = this.calculateDistance(startLocation, b.points[0]?.location);
      return distanceA - distanceB;
    });

    const allStops = [];
    const avoidedZones = [];

    for (const cluster of sortedClusters) {
      allStops.push(...cluster.points);
      if (cluster.avoidedZones) {
        avoidedZones.push(...cluster.avoidedZones);
      }
    }

    return { stops: allStops, avoidedZones };
  }

  calculateDistance(point1, point2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

calculateDistanceWithTraffic(point1, point2, trafficIncidents = []) {
    const baseDistance = this.calculateDistance(point1, point2);
    
    // Base traffic conditions based on time of day
    const hour = new Date().getHours();
    let trafficMultiplier = 1;

    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      trafficMultiplier = 1.4; // Rush hour
    } else if (hour >= 11 && hour <= 14) {
      trafficMultiplier = 1.2; // Lunch traffic
    } else if (hour >= 22 || hour <= 6) {
      trafficMultiplier = 0.8; // Low traffic
    }

    // Check for traffic incidents affecting this route segment
    const incidentImpact = this.calculateIncidentImpact(point1, point2, trafficIncidents);
    trafficMultiplier *= (1 + incidentImpact);

    return baseDistance * trafficMultiplier;
  }

  calculateTotalDistance(startLocation, stops) {
    if (!stops || stops.length === 0) return 0;

    let totalDistance = 0;
    let currentLocation = startLocation;

    for (const stop of stops) {
      totalDistance += this.calculateDistance(currentLocation, stop.location);
      currentLocation = stop.location;
    }

    return totalDistance;
  }

  calculateEstimatedTime(distance, numberOfStops) {
    // Assume average speed of 25 km/h in city traffic
    const travelTime = (distance / 25) * 60; // Convert to minutes
    
    // Add time for each delivery stop (5 minutes average)
    const stopTime = numberOfStops * 5;
    
    return travelTime + stopTime;
  }

  isInRestrictedZone(location) {
    const currentHour = new Date().getHours();

    for (const zone of this.restrictedZones) {
      const distance = this.calculateDistance(location, zone);
      
      if (distance <= zone.radius / 1000) { // Convert radius to km
        if (zone.hours === '24') {
          return true; // Always restricted
        }
        
        const [startHour, endHour] = zone.hours.split('-').map(Number);
        if (currentHour >= startHour && currentHour <= endHour) {
          return true;
        }
      }
    }

    return false;
  }

  checkRestrictedZones(points) {
    const avoidedZones = [];
    
    for (const point of points) {
      for (const zone of this.restrictedZones) {
        const distance = this.calculateDistance(point.location, zone);
        
        if (distance <= zone.radius / 1000) {
          avoidedZones.push({
            type: zone.type,
            location: zone,
            affectedOrder: point.orderId
          });
        }
      }
    }

    return avoidedZones;
  }

  parseAddress(address) {
    // In real implementation, this would use geocoding API
    // For now, return mock coordinates
    const mockCoordinates = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    };

    return mockCoordinates;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get turn-by-turn directions
  async getDirections(from, to) {
    await this.delay(200);

    // Mock directions - in real app would use Google Maps/Mapbox API
    const distance = this.calculateDistance(from, to);
    const estimatedTime = (distance / 25) * 60; // minutes

    return {
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(estimatedTime),
      steps: [
        { instruction: "Head north on Main St", distance: 0.3, duration: 1 },
        { instruction: "Turn right on Oak Ave", distance: 0.8, duration: 2 },
        { instruction: "Continue straight for 2 blocks", distance: 0.4, duration: 1 },
        { instruction: "Arrive at destination on the right", distance: 0, duration: 0 }
      ]
    };
};
  }

  // Traffic incident detection and management
  async getActiveTrafficIncidents() {
    await this.delay(200);
    
    // Simulate real-time traffic incident detection
    const incidents = [
      {
        id: 'INC001',
        type: 'accident',
        location: { lat: 40.7580, lng: -73.9855 },
        severity: 'high',
        radius: 800, // meters
        delay: 15, // minutes additional delay
        description: 'Multi-vehicle accident blocking 2 lanes',
        estimatedClearance: new Date(Date.now() + 45 * 60000), // 45 minutes
        alternativeRoutes: ['route_a', 'route_b']
      },
      {
        id: 'INC002',
        type: 'construction',
        location: { lat: 40.7505, lng: -73.9934 },
        severity: 'medium',
        radius: 500,
        delay: 8,
        description: 'Lane closure for emergency repairs',
        estimatedClearance: new Date(Date.now() + 2 * 60 * 60000), // 2 hours
        alternativeRoutes: ['route_c']
      }
    ];

    // Filter active incidents (not cleared yet)
    return incidents.filter(incident => 
      incident.estimatedClearance > new Date()
    );
  }

  updateRestrictedZonesForTraffic(incidents) {
    // Add traffic incidents to restricted zones temporarily
    const trafficZones = incidents.map(incident => ({
      ...incident.location,
      radius: incident.radius,
      type: 'traffic_incident',
      hours: '24', // Active until cleared
      severity: incident.severity,
      delay: incident.delay,
      incidentId: incident.id
    }));

    // Merge with existing restricted zones
    this.restrictedZones = [
      ...this.restrictedZones.filter(zone => zone.type !== 'traffic_incident'),
      ...trafficZones
    ];
  }

  calculateIncidentImpact(point1, point2, incidents) {
    let totalImpact = 0;

    for (const incident of incidents) {
      // Check if route segment passes near incident
      const distanceToIncident = Math.min(
        this.calculateDistance(point1, incident.location),
        this.calculateDistance(point2, incident.location)
      );

      if (distanceToIncident <= incident.radius / 1000) { // Convert radius to km
        // Calculate impact based on severity and distance
        const impactFactor = incident.severity === 'high' ? 0.8 : 
                           incident.severity === 'medium' ? 0.4 : 0.2;
        
        const distanceFactor = 1 - (distanceToIncident / (incident.radius / 1000));
        totalImpact += impactFactor * distanceFactor;
      }
    }

    return Math.min(totalImpact, 2.0); // Cap at 200% additional time
  }

  async optimizeClusterWithTraffic(startLocation, clusterPoints, incidents) {
    // Enhanced cluster optimization with traffic awareness
    const sortedPoints = clusterPoints.sort((a, b) => {
      // Urgent deliveries first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      // Avoid traffic-impacted routes for time-sensitive deliveries
      const aTrafficImpact = this.calculateIncidentImpact(startLocation, a.location, incidents);
      const bTrafficImpact = this.calculateIncidentImpact(startLocation, b.location, incidents);
      
      if (a.priority === 'urgent' || b.priority === 'urgent') {
        return aTrafficImpact - bTrafficImpact;
      }

      // Then by delivery window
      if (a.deliveryWindow && b.deliveryWindow) {
        return new Date(a.deliveryWindow.start) - new Date(b.deliveryWindow.start);
      }

      return 0;
    });

    // Apply traffic-aware nearest neighbor algorithm
    const optimizedOrder = await this.nearestNeighborWithTraffic(startLocation, sortedPoints, incidents);
    
    return {
      points: optimizedOrder,
      startLocation,
      avoidedZones: this.checkRestrictedZones(optimizedOrder),
      trafficReroutes: this.identifyReroutedDeliveries(clusterPoints, optimizedOrder)
    };
  }

  async rerouteForTrafficIncident(orderId, currentRoute, incidentLocation, severity = 'high') {
    await this.delay(300);

    // Generate alternative route avoiding incident area
    const avoidanceRadius = severity === 'high' ? 1.5 : 
                           severity === 'medium' ? 1.0 : 0.5; // km

    const alternativeRoute = await this.calculateAlternativeRoute(
      currentRoute.startLocation,
      currentRoute.destination,
      incidentLocation,
      avoidanceRadius
    );

    const additionalTime = this.calculateRerouteDelay(currentRoute, alternativeRoute);
    const additionalDistance = alternativeRoute.totalDistance - currentRoute.totalDistance;

    return {
      orderId,
      originalRoute: currentRoute,
      alternativeRoute,
      rerouteReason: 'traffic_incident',
      incidentLocation,
      additionalTime: Math.round(additionalTime),
      additionalDistance: Math.round(additionalDistance * 100) / 100,
      estimatedDelay: Math.max(additionalTime - 5, 0), // Account for time saved avoiding traffic
      timestamp: new Date().toISOString(),
      approved: false // Requires dispatcher approval for significant delays
    };
  }

  async calculateAlternativeRoute(start, destination, avoidLocation, avoidanceRadius) {
    // Simulate alternative route calculation
    const detourFactor = 1.2; // 20% longer route to avoid incident
    const baseDistance = this.calculateDistance(start, destination);
    
    return {
      stops: [
        { location: start, instruction: "Start route" },
        { 
          location: this.calculateDetourPoint(start, destination, avoidLocation, avoidanceRadius),
          instruction: "Detour around traffic incident"
        },
        { location: destination, instruction: "Arrive at destination" }
      ],
      totalDistance: baseDistance * detourFactor,
      estimatedTime: this.calculateEstimatedTime(baseDistance * detourFactor, 1),
      avoidedIncidents: [avoidLocation]
    };
  }

  calculateDetourPoint(start, destination, avoid, radius) {
    // Calculate a point that maintains distance from incident
    const midpoint = {
      lat: (start.lat + destination.lat) / 2,
      lng: (start.lng + destination.lng) / 2
    };

    // Offset perpendicular to the incident
    const offset = radius / 111; // Rough conversion to degrees
    return {
      lat: midpoint.lat + (Math.random() - 0.5) * offset,
      lng: midpoint.lng + (Math.random() - 0.5) * offset
    };
  }

  calculateRerouteDelay(originalRoute, alternativeRoute) {
    return alternativeRoute.estimatedTime - originalRoute.estimatedTime;
  }

  identifyReroutedDeliveries(originalOrder, optimizedOrder) {
    const rerouted = [];
    
    for (let i = 0; i < originalOrder.length; i++) {
      const originalIndex = originalOrder.findIndex(p => p.orderId === optimizedOrder[i]?.orderId);
      if (originalIndex !== -1 && originalIndex !== i) {
        rerouted.push({
          orderId: optimizedOrder[i].orderId,
          originalPosition: originalIndex,
          newPosition: i,
          reason: 'traffic_optimization'
        });
      }
    }
    
    return rerouted;
  }

  calculateEstimatedTimeWithTraffic(distance, numberOfStops, incidents = []) {
    // Base calculation
    let travelTime = (distance / 25) * 60; // 25 km/h average city speed
    const stopTime = numberOfStops * 5; // 5 minutes per stop

    // Add delay for traffic incidents
    const incidentDelay = incidents.reduce((total, incident) => {
      return total + (incident.delay || 0);
    }, 0);

    return travelTime + stopTime + incidentDelay;
  }
}

export const routeOptimizer = new RouteOptimizer();