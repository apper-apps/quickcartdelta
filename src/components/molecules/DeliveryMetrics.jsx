import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deliveryService } from "@/services/api/deliveryService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Button from "@/components/atoms/Button";

const DeliveryMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryMetrics('current-driver', period);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    if (status >= 95) return 'text-green-600';
    if (status >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadMetrics} />;

return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'primary' : 'ghost'}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {metrics && (
        <>
          {/* Performance Analytics Table */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Key Performance Metrics</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Display Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4 px-4 font-medium">On-time Rate</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {metrics.delivered > 0 ? Math.round((metrics.onTimeDeliveries / metrics.delivered) * 100) : 0}%
                        </span>
                        <span className="text-green-600 text-sm flex items-center">
                          <ApperIcon name="TrendingUp" size={14} className="mr-1" />
                          (▲{metrics.onTimeRateTrend || 2}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Daily Deliveries</td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-bold">
                        {metrics.delivered}/30 target
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min((metrics.delivered / 30) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Avg. Time/Drop</td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-bold">
                        {(metrics.averageDeliveryTime || 8.2).toFixed(1)} min
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Customer Rating</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-lg ${star <= Math.floor(metrics.customerRating || 4.6) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-lg font-bold">
                          ({(metrics.customerRating || 4.6).toFixed(1)}/5)
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ApperIcon name="Package" size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                  <p className="text-2xl font-bold">{metrics.totalDeliveries}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.delivered}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <ApperIcon name="Truck" size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.failed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className={`font-bold ${getStatusColor(metrics.successRate)}`}>
                    {metrics.successRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.successRate}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Delivery Time</span>
                  <span className="font-bold">{formatTime(metrics.averageDeliveryTime)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">On-Time Deliveries</span>
                  <span className="font-bold text-green-600">
                    {metrics.onTimeDeliveries}/{metrics.delivered}
                  </span>
                </div>

                {metrics.delivered > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                      style={{ width: `${(metrics.onTimeDeliveries / metrics.delivered) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Satisfaction</h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`${star <= Math.floor(metrics.customerRating || 4.6) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-2xl font-bold">{(metrics.customerRating || 4.6).toFixed(1)}/5.0</p>
                  <p className="text-sm text-gray-600">Average Customer Rating</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>5 stars</span>
                    <span>68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>4 stars</span>
                    <span>24%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>3 stars</span>
                    <span>6%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals & Achievements */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Goals & Achievements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-4xl mb-2 ${metrics.delivered >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  🏆
                </div>
                <p className="font-medium">Daily Goal</p>
                <p className="text-sm text-gray-600">{metrics.delivered}/30 deliveries</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((metrics.delivered / 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-4xl mb-2 ${metrics.successRate >= 95 ? 'text-green-600' : 'text-gray-400'}`}>
                  🎯
                </div>
                <p className="font-medium">Quality Goal</p>
                <p className="text-sm text-gray-600">{metrics.successRate.toFixed(1)}%/95% success</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(metrics.successRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-4xl mb-2 ${metrics.averageDeliveryTime <= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                  ⚡
                </div>
                <p className="font-medium">Speed Goal</p>
                <p className="text-sm text-gray-600">Avg {formatTime(metrics.averageDeliveryTime)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-600 h-2 rounded-full" 
                    style={{ width: `${Math.max(100 - (metrics.averageDeliveryTime / 60) * 100, 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-3">
              {metrics.successRate < 95 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ApperIcon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Improve Success Rate</p>
                    <p className="text-sm text-yellow-700">
                      Your success rate is {metrics.successRate.toFixed(1)}%. Consider reviewing delivery procedures.
                    </p>
                  </div>
                </div>
              )}

              {metrics.averageDeliveryTime > 45 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <ApperIcon name="Clock" size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Optimize Delivery Time</p>
                    <p className="text-sm text-blue-700">
                      Average delivery time is {formatTime(metrics.averageDeliveryTime)}. Consider route optimization.
                    </p>
                  </div>
                </div>
              )}

              {metrics.delivered >= 10 && metrics.successRate >= 95 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <ApperIcon name="CheckCircle" size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Excellent Performance!</p>
                    <p className="text-sm text-green-700">
                      You're meeting all delivery goals. Keep up the great work!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryMetrics;