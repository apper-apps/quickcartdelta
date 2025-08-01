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

  async optimizeRoute(startLocation, orders) {
    await this.delay();

    if (!orders || orders.length === 0) {
      return { stops: [], totalDistance: 0, estimatedTime: 0 };
    }

    // Convert orders to delivery points
    const deliveryPoints = orders.map(order => ({
      orderId: order.Id,
      location: this.parseAddress(order.deliveryAddress),
      priority: order.priority,
      deliveryWindow: order.deliveryWindow,
      customer: order.customer
    }));

    // Apply clustering for nearby deliveries
    const clusters = this.clusterDeliveries(deliveryPoints);
    
    // Optimize route within each cluster
    const optimizedClusters = await Promise.all(
      clusters.map(cluster => this.optimizeCluster(startLocation, cluster))
    );

    // Combine clusters into final route
    const finalRoute = this.combineOptimizedClusters(startLocation, optimizedClusters);
    
    // Calculate total metrics
    const totalDistance = this.calculateTotalDistance(startLocation, finalRoute.stops);
    const estimatedTime = this.calculateEstimatedTime(totalDistance, finalRoute.stops.length);

    return {
      stops: finalRoute.stops,
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      estimatedTime: Math.round(estimatedTime),
      clusters: optimizedClusters.length,
      avoidedZones: finalRoute.avoidedZones || []
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

  calculateDistanceWithTraffic(point1, point2) {
    const baseDistance = this.calculateDistance(point1, point2);
    
    // Simulate traffic conditions based on time of day
    const hour = new Date().getHours();
    let trafficMultiplier = 1;

    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      trafficMultiplier = 1.4; // Rush hour
    } else if (hour >= 11 && hour <= 14) {
      trafficMultiplier = 1.2; // Lunch traffic
    } else if (hour >= 22 || hour <= 6) {
      trafficMultiplier = 0.8; // Low traffic
    }

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
  }
}

export const routeOptimizer = new RouteOptimizer();