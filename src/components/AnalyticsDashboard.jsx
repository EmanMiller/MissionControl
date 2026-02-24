import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Clock, CheckCircle, AlertCircle, Users, Target } from 'lucide-react';
import apiClient from '../services/api.js';

function AnalyticsDashboard({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeframe]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const data = await apiClient.getDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-[#0A0A0A] overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1A1A1A] rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-[#1A1A1A] rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-[#1A1A1A] rounded-lg"></div>
              <div className="h-80 bg-[#1A1A1A] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 p-6 bg-[#0A0A0A] overflow-y-auto">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertCircle size={48} className="text-[#EF4444] mx-auto mb-4" />
          <h3 className="text-[#F9FAFB] text-lg font-medium mb-2">Failed to load analytics</h3>
          <p className="text-[#9CA3AF] text-sm mb-6">There was an error loading your analytics data</p>
          <button
            onClick={loadAnalytics}
            className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, recentActivity, agentPerformance } = analytics;

  return (
    <div className="flex-1 p-6 bg-[#0A0A0A] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[#F9FAFB] text-2xl font-semibold mb-2">Analytics Dashboard</h2>
            <p className="text-[#9CA3AF] text-sm">Monitor your agent fleet performance and task completion metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Agents"
            value={summary.totalAgents}
            change={`${summary.activeAgents} active`}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Task Completion"
            value={`${summary.completionRate}%`}
            change={`${summary.completedTasks}/${summary.totalTasks} tasks`}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Active Tasks"
            value={summary.pendingTasks}
            change={`${summary.totalTasks} total`}
            icon={Activity}
            color="orange"
          />
          <MetricCard
            title="Agent Efficiency"
            value={`${Math.round((summary.activeAgents / Math.max(summary.totalAgents, 1)) * 100)}%`}
            change={`${summary.activeAgents}/${summary.totalAgents} working`}
            icon={Target}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Chart */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#F9FAFB] text-lg font-semibold">Task Activity</h3>
              <BarChart3 size={20} className="text-[#9CA3AF]" />
            </div>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((day, index) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-20 text-[#9CA3AF] text-sm">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#10B981]"
                            style={{ 
                              width: `${Math.max((day.completed / Math.max(day.created, 1)) * 100, 2)}%` 
                            }}
                          />
                        </div>
                        <span className="text-[#F9FAFB] text-sm font-medium min-w-0">
                          {day.completed}/{day.created}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp size={48} className="text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#9CA3AF] text-sm">No recent activity data</p>
              </div>
            )}
          </div>

          {/* Top Performing Agents */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#F9FAFB] text-lg font-semibold">Agent Performance</h3>
              <Users size={20} className="text-[#9CA3AF]" />
            </div>
            {agentPerformance && agentPerformance.length > 0 ? (
              <div className="space-y-4">
                {agentPerformance.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[#F9FAFB] text-sm font-medium truncate">{agent.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getAgentStatusColor(agent.status)}`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                        <span>{agent.type}</span>
                        <span>{agent.completed_tasks}/{agent.total_tasks} tasks completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={48} className="text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#9CA3AF] text-sm">No agents created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-[#06B6D4] bg-[#06B6D4]/20',
    green: 'text-[#10B981] bg-[#10B981]/20',
    orange: 'text-[#F59E0B] bg-[#F59E0B]/20',
    purple: 'text-[#8B5CF6] bg-[#8B5CF6]/20',
    red: 'text-[#EF4444] bg-[#EF4444]/20',
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <h3 className="text-[#F9FAFB] text-2xl font-bold mb-1">{value}</h3>
        <p className="text-[#9CA3AF] text-sm">{title}</p>
        {change && (
          <p className="text-[#6B7280] text-xs mt-2">{change}</p>
        )}
      </div>
    </div>
  );
}

function getAgentStatusColor(status) {
  switch (status) {
    case 'working': return 'text-[#F59E0B] bg-[#F59E0B]/20';
    case 'idle': return 'text-[#10B981] bg-[#10B981]/20';
    case 'error': return 'text-[#EF4444] bg-[#EF4444]/20';
    case 'offline': return 'text-[#6B7280] bg-[#6B7280]/20';
    default: return 'text-[#6B7280] bg-[#6B7280]/20';
  }
}

export default AnalyticsDashboard;