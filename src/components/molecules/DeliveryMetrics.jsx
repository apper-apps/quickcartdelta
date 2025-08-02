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
const [analytics, setAnalytics] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState([]);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryMetrics('current-driver', period);
      setMetrics(data);
setError(null);
      
      // Load analytics data
      await loadAnalyticsData();
      
      // Load agent performance data
      await loadAgentPerformance();
      
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const settlement = await deliveryService.getCodSettlement();
      const teamMetrics = await deliveryService.getTeamMetrics();
      
      setAnalytics({
        totalOutstanding: 42800,
        todayCollection: 18900,
        codMetrics: teamMetrics.codMetrics,
        settlement
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const loadAgentPerformance = async () => {
    try {
      const drivers = await deliveryService.getTeamDrivers();
      const performanceData = drivers.map(driver => ({
        id: driver.Id,
        name: driver.name,
        codAccuracy: driver.complianceScore || Math.floor(Math.random() * 10) + 90, // 90-100%
        avgDelay: Math.floor(Math.random() * 40) + 10, // 10-50 minutes
        deliveriesCompleted: driver.completedToday || 0,
        rating: driver.rating || 4.5,
        zone: driver.zone,
        status: driver.status
      }));
      
      setAgentPerformance(performanceData);
    } catch (error) {
      console.error('Failed to load agent performance:', error);
    }
  };

  const refreshAnalytics = async () => {
    try {
      setLoading(true);
      await loadAnalyticsData();
      await loadAgentPerformance();
      toast.success('Analytics data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      analytics,
      agentPerformance,
      generatedAt: new Date().toISOString(),
      reportType: 'Analytics & Reporting'
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported successfully');
  };

  const getPerformanceAlert = (metric, value, threshold, comparison) => {
    if (comparison === 'less' && value < threshold) {
      return { color: 'text-yellow-600', icon: '🟡', message: 'Training Needed' };
    } else if (comparison === 'greater' && value > threshold) {
      return { color: 'text-red-600', icon: '🔴', message: 'Route Review' };
    }
    return { color: 'text-green-600', icon: '🟢', message: 'Good Performance' };
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

          {/* Performance Reports Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ApperIcon name="FileText" size={20} className="text-indigo-600" />
                Performance Reports
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon="RefreshCw" 
                  onClick={refreshAnalytics}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="Download"
                  onClick={exportReport}
                >
                  Export Report
                </Button>
              </div>
            </div>

            {/* Weekly Efficiency Rankings */}
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <ApperIcon name="Trophy" size={18} className="text-yellow-600" />
                Weekly Efficiency Rankings
              </h4>
              
              {agentPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Rank</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Driver</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Efficiency Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Deliveries</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Avg Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Success Rate</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-800">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agentPerformance
                        .map(agent => ({
                          ...agent,
                          efficiencyScore: Math.round(((100 - agent.avgDelay) + agent.codAccuracy + (agent.rating * 20)) / 3)
                        }))
                        .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
                        .map((agent, index) => (
                          <tr key={agent.id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${
                                  index === 0 ? 'text-yellow-600' :
                                  index === 1 ? 'text-gray-500' :
                                  index === 2 ? 'text-amber-600' : 'text-gray-400'
                                }`}>
                                  #{index + 1}
                                </span>
                                {index < 3 && (
                                  <span className="text-lg">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.zone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${
                                  agent.efficiencyScore >= 90 ? 'text-green-600' :
                                  agent.efficiencyScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {agent.efficiencyScore}
                                </span>
                                <div className={`w-16 h-2 rounded-full ${
                                  agent.efficiencyScore >= 90 ? 'bg-green-200' :
                                  agent.efficiencyScore >= 80 ? 'bg-yellow-200' : 'bg-red-200'
                                }`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      agent.efficiencyScore >= 90 ? 'bg-green-500' :
                                      agent.efficiencyScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${agent.efficiencyScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium">{agent.deliveriesCompleted}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${
                                agent.avgDelay <= 20 ? 'text-green-600' :
                                agent.avgDelay <= 30 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {agent.avgDelay}m
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${getStatusColor(agent.codAccuracy)}`}>
                                {agent.codAccuracy}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span className={`text-sm ${
                                  Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {Math.random() > 0.5 ? '↗' : '↘'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Math.random() > 0.5 ? 'Improving' : 'Declining'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ApperIcon name="Trophy" size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No ranking data available</p>
                </div>
              )}
            </div>

            {/* Customer Feedback Analysis */}
            <div>
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <ApperIcon name="MessageSquare" size={18} className="text-purple-600" />
                Customer Feedback Analysis
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feedback Summary */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <h5 className="font-medium text-purple-800 mb-3">Overall Satisfaction</h5>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-700">4.7</p>
                        <div className="flex justify-center gap-1 mt-1">
                          {[1,2,3,4,5].map(star => (
                            <ApperIcon 
                              key={star} 
                              name="Star" 
                              size={16} 
                              className={`${star <= 4.7 ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-6">5★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">68%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-6">4★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">22%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-6">3★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '7%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">7%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-6">2★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '2%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">2%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-6">1★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: '1%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">1%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-3">Feedback Trends</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Response Rate</span>
                        <span className="font-bold text-blue-800">78%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Avg Response Time</span>
                        <span className="font-bold text-blue-800">2.3 days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Weekly Growth</span>
                        <span className="font-bold text-green-600">+12%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Feedback Themes */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-3">Positive Feedback</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Fast delivery times</span>
                        <span className="text-xs text-green-600">(89%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Professional service</span>
                        <span className="text-xs text-green-600">(82%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Accurate COD handling</span>
                        <span className="text-xs text-green-600">(75%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Good communication</span>
                        <span className="text-xs text-green-600">(68%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                    <h5 className="font-medium text-red-800 mb-3">Areas for Improvement</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700">Delivery time delays</span>
                        <span className="text-xs text-red-600">(18%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700">Package handling</span>
                        <span className="text-xs text-red-600">(12%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700">Location accuracy</span>
                        <span className="text-xs text-red-600">(8%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700">COD discrepancies</span>
                        <span className="text-xs text-red-600">(5%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics & Reporting Section */}
          <div className="space-y-6">
            {/* Live COD Tracking */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ApperIcon name="TrendingUp" size={20} className="text-blue-600" />
                  Live COD Tracking
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="RefreshCw"
                    onClick={refreshAnalytics}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="Download"
                    onClick={exportReport}
                  >
                    Export Report
                  </Button>
                </div>
              </div>

              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Outstanding */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-700 mb-1">Total Outstanding</p>
                        <p className="text-3xl font-bold text-red-800">Rs. {analytics.totalOutstanding.toLocaleString()}</p>
                        <p className="text-xs text-red-600 mt-1">Pending collections</p>
                      </div>
                      <ApperIcon name="AlertCircle" size={32} className="text-red-500" />
                    </div>
                  </div>

                  {/* Today's Collection */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1">Today's Collection</p>
                        <p className="text-3xl font-bold text-green-800">Rs. {analytics.todayCollection.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">Successfully collected</p>
                      </div>
                      <ApperIcon name="CheckCircle" size={32} className="text-green-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              )}

              {/* COD Analytics Summary */}
              {analytics?.codMetrics && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">COD Analytics Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Collection Rate</p>
                      <p className="font-bold text-blue-800">{analytics.codMetrics.codCollectionRate}%</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Average Value</p>
                      <p className="font-bold text-blue-800">₹{analytics.codMetrics.avgCodValue}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Total Orders</p>
                      <p className="font-bold text-blue-800">{analytics.codMetrics.totalCodOrders}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">GPS Verification</p>
                      <p className="font-bold text-blue-800">{analytics.codMetrics.gpsVerificationRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Agent Performance */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <ApperIcon name="Users" size={20} className="text-purple-600" />
                Agent Performance
              </h3>

              {agentPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">COD Accuracy</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Avg. Delay</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Deliveries</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agentPerformance.map((agent) => {
                        const codAlert = getPerformanceAlert('cod', agent.codAccuracy, 98, 'less');
                        const delayAlert = getPerformanceAlert('delay', agent.avgDelay, 25, 'greater');
                        
                        return (
                          <tr key={agent.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.zone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{agent.codAccuracy}%</span>
                                {agent.codAccuracy < 98 && (
                                  <span className={codAlert.color}>{codAlert.icon}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{agent.avgDelay} min</span>
                                {agent.avgDelay > 25 && (
                                  <span className={delayAlert.color}>{delayAlert.icon}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium">{agent.deliveriesCompleted}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{agent.rating}</span>
                                <ApperIcon name="Star" size={14} className="text-yellow-500 fill-current" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                agent.status === 'active' ? 'bg-green-100 text-green-800' :
                                agent.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {agent.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {agent.codAccuracy < 98 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  🟡 Training Needed
                                </span>
                              )}
                              {agent.avgDelay > 25 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  🔴 Route Review
                                </span>
                              )}
                              {agent.codAccuracy >= 98 && agent.avgDelay <= 25 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  🟢 Good Performance
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ApperIcon name="Users" size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No agent performance data available</p>
                </div>
              )}
            </div>

            {/* Performance Insights */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ApperIcon name="BarChart3" size={20} className="text-indigo-600" />
                Performance Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ApperIcon name="TrendingUp" size={16} className="text-green-600" />
                    <p className="text-sm font-medium text-green-800">High Performers</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {agentPerformance.filter(a => a.codAccuracy >= 98 && a.avgDelay <= 25).length}
                  </p>
                  <p className="text-xs text-green-600">agents meeting all targets</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ApperIcon name="AlertTriangle" size={16} className="text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">Need Training</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {agentPerformance.filter(a => a.codAccuracy < 98).length}
                  </p>
                  <p className="text-xs text-yellow-600">agents below COD accuracy</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ApperIcon name="Clock" size={16} className="text-red-600" />
                    <p className="text-sm font-medium text-red-800">Route Issues</p>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {agentPerformance.filter(a => a.avgDelay > 25).length}
                  </p>
                  <p className="text-xs text-red-600">agents with high delays</p>
                </div>
              </div>
            </div>
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