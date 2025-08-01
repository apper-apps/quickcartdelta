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
  const [earningsView, setEarningsView] = useState(false);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-sm text-gray-600">Track your delivery performance and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={earningsView ? 'ghost' : 'primary'}
            onClick={() => setEarningsView(false)}
          >
            Performance
          </Button>
          <Button
            size="sm"
            variant={earningsView ? 'primary' : 'ghost'}
            onClick={() => setEarningsView(true)}
          >
            Earnings
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
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

      {metrics && !earningsView && (
        <>
          {/* Mobile-First Performance Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-lg w-fit mx-auto mb-2">
                  <ApperIcon name="Package" size={20} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-xl font-bold">{metrics.totalDeliveries}</p>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-lg w-fit mx-auto mb-2">
                  <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Delivered</p>
                <p className="text-xl font-bold text-green-600">{metrics.delivered}</p>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-center">
                <div className="bg-yellow-100 p-2 rounded-lg w-fit mx-auto mb-2">
                  <ApperIcon name="Clock" size={20} className="text-yellow-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Avg Time</p>
                <p className="text-xl font-bold text-yellow-600">{(metrics.averageDeliveryTime || 8.2).toFixed(1)}m</p>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-center">
                <div className="bg-purple-100 p-2 rounded-lg w-fit mx-auto mb-2">
                  <ApperIcon name="Star" size={20} className="text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <p className="text-xl font-bold text-purple-600">{(metrics.customerRating || 4.6).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Success Rate</span>
                <span className={`font-bold ${getStatusColor(metrics.successRate)}`}>
                  {metrics.successRate.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.successRate}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">On-Time Rate</span>
                <span className="font-bold text-blue-600">
                  {metrics.delivered > 0 ? Math.round((metrics.onTimeDeliveries / metrics.delivered) * 100) : 0}%
                </span>
              </div>

              {metrics.delivered > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${(metrics.onTimeDeliveries / metrics.delivered) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Incentive Progress */}
          {metrics.incentiveProgress && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ApperIcon name="Target" size={20} className="text-orange-600" />
                Bonus Progress
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Next Bonus</span>
                  <span className="font-bold text-orange-600">
                    {metrics.incentiveProgress.current}/{metrics.incentiveProgress.target}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${(metrics.incentiveProgress.current / metrics.incentiveProgress.target) * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 font-medium">
                    {metrics.incentiveProgress.progressText || `${metrics.incentiveProgress.target - metrics.incentiveProgress.current} more for ₹${metrics.incentiveProgress.reward} bonus!`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {metrics && earningsView && (
        <>
          {/* Earnings Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Earnings Summary ({period})</h3>
            
            {metrics.earnings ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">Base Pay</p>
                    <p className="text-2xl font-bold text-green-800">₹{metrics.earnings.basePay}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Delivery Earnings</p>
                    <p className="text-2xl font-bold text-blue-800">₹{metrics.earnings.deliveryEarnings}</p>
                    <p className="text-xs text-blue-600">({metrics.delivered} × ₹35)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Total Bonuses</p>
                    <p className="text-2xl font-bold text-purple-800">₹{metrics.earnings.bonuses.total}</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total Earnings</span>
                    <span className="text-2xl font-bold text-green-700">
                      ₹{metrics.earnings.totalEarnings}
                    </span>
                  </div>
                </div>

                {/* Bonus Breakdown */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-3">Bonus Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">On-Time Bonus ({metrics.onTimeDeliveries} deliveries)</span>
                      <span className="font-medium text-green-600">₹{metrics.earnings.bonuses.onTime}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Customer Rating Bonus</span>
                      <span className="font-medium text-blue-600">₹{metrics.earnings.bonuses.customerRating}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Efficiency Bonus</span>
                      <span className="font-medium text-purple-600">₹{metrics.earnings.bonuses.efficiency}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Base Pay</p>
                  <p className="text-2xl font-bold text-green-800">₹1,200</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Bonuses</p>
                  <p className="text-2xl font-bold text-blue-800">₹350</p>
                  <p className="text-xs text-blue-600">(on-time incentive)</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 mb-1">Deductions</p>
                  <p className="text-2xl font-bold text-gray-800">₹0</p>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Goals */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Delivery Target</span>
                  <span className="font-semibold">{Math.min(metrics.delivered * 7, 50)}/50</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((metrics.delivered * 7 / 50) * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Rating Goal</span>
                  <span className="font-semibold">{(metrics.customerRating || 4.6).toFixed(1)}/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((metrics.customerRating || 4.6) / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Items */}
      {metrics && !earningsView && (
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
      )}
    </div>
  );
};

export default DeliveryMetrics;