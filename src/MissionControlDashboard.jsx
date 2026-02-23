import { useState, useEffect } from 'react';
import { Users, Activity, Zap, CheckSquare, AlertCircle } from 'lucide-react';
import apiClient from './services/api.js';

/* ─── Components ─────────────────────────────────────────────────────────── */

function MetricCard({ title, value, icon: Icon, color = '#06B6D4' }) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 sm:p-4 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs m-0 mb-1 truncate">{title}</p>
          <p className="text-[#F9FAFB] text-base sm:text-xl font-bold m-0 truncate" style={{ color }}>{value}</p>
        </div>
        <Icon size={20} className="sm:w-6 sm:h-6 flex-shrink-0" style={{ color: color, opacity: 0.7 }} />
      </div>
    </div>
  );
}

export default function MissionControlDashboard({ tasks }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [openClawStatus, setOpenClawStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, openClaw] = await Promise.all([
        apiClient.getDashboard(),
        apiClient.getOpenClawStatus().catch(() => ({ connected: false }))
      ]);

      setDashboardData(dashboard);
      setOpenClawStatus(openClaw);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#9CA3AF] text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#EF4444] text-sm">Error: {error}</div>
      </div>
    );
  }

  const metrics = {
    totalTasks: dashboardData?.total_tasks || 0,
    completedToday: dashboardData?.completed_today || 0,
    activeAgents: openClawStatus?.connected ? 1 : 0,
    systemUptime: openClawStatus?.connected ? 'Connected' : 'Disconnected'
  };

  const taskStats = dashboardData?.task_stats || {};

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-3 sm:p-4 min-w-0">
      {/* Mission Statement Header */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] p-4 sm:p-6 rounded-xl min-w-0">
          <div className="flex items-center gap-3 mb-3 sm:mb-4 min-w-0">
            <Zap size={24} className="text-white flex-shrink-0" />
            <h1 className="text-white text-lg sm:text-xl font-bold m-0 truncate">Mission Control</h1>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-lg p-3 sm:p-4 min-w-0">
            <h2 className="text-white text-base sm:text-lg font-semibold mb-2 m-0">Mission Statement</h2>
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed m-0">
              An autonomous network of AI agents that operates around the clock, 
              executing tasks and generating value continuously at a highly cost-efficient rate.
            </p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
        <MetricCard 
          title="Total Tasks" 
          value={metrics.totalTasks} 
          icon={CheckSquare}
          color="#06B6D4"
        />
        <MetricCard 
          title="Completed Today" 
          value={metrics.completedToday} 
          icon={Activity}
          color="#10B981"
        />
        <MetricCard 
          title="OpenClaw Status" 
          value={openClawStatus?.connected ? 'Connected' : 'Offline'} 
          icon={Zap}
          color={openClawStatus?.connected ? '#10B981' : '#EF4444'}
        />
        <MetricCard 
          title="Processing" 
          value={taskStats.in_progress || 0} 
          icon={Activity}
          color="#F59E0B"
        />
      </div>

      {/* OpenClaw Connection Status */}
      <div className="mb-4 sm:mb-6 min-w-0">
        <div className="flex items-center gap-3 mb-3 sm:mb-4 min-w-0">
          <Zap size={20} className="text-[#F59E0B] flex-shrink-0" />
          <h3 className="text-[#F9FAFB] text-base sm:text-lg font-semibold m-0 truncate">OpenClaw Connection</h3>
        </div>
        
        {openClawStatus?.connected ? (
          <div className="bg-[#111111] border border-[#10B981] rounded-lg p-3 sm:p-4 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 min-w-0">
              <div className="w-3 h-3 rounded-full bg-[#10B981] flex-shrink-0" />
              <span className="text-[#F9FAFB] font-medium text-sm sm:text-base truncate">Connected to OpenClaw</span>
              <span className="text-xs rounded px-2 py-0.5 font-medium bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 flex-shrink-0">
                Active
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm min-w-0">
              <div className="min-w-0">
                <span className="text-[#9CA3AF]">Endpoint:</span>
                <p className="text-[#F9FAFB] m-0 truncate">{openClawStatus.endpoint}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Version:</span>
                <p className="text-[#F9FAFB] m-0">{openClawStatus.version || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Tasks Sent:</span>
                <p className="text-[#F9FAFB] m-0">{openClawStatus.total_openclaw_tasks || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#F59E0B] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={16} className="text-[#F59E0B]" />
              <span className="text-[#F9FAFB] font-medium">OpenClaw Not Connected</span>
            </div>
            <p className="text-[#9CA3AF] text-sm mb-3 m-0">
              Connect your OpenClaw instance to start processing tasks automatically.
            </p>
            <button
              onClick={() => window.location.hash = '#settings'}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              Configure OpenClaw
            </button>
          </div>
        )}
      </div>

      {/* Active Tasks Summary */}
      <div className="mb-4 min-w-0">
        <h3 className="text-[#F9FAFB] text-base sm:text-lg font-semibold mb-3 sm:mb-4 m-0">Task Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {['backlog', 'new', 'in_progress', 'built'].map(status => {
            const count = taskStats[status] || 0;
            const colors = {
              'backlog': '#4B5563',
              'new': '#06B6D4', 
              'in_progress': '#F59E0B',
              'built': '#10B981'
            };
            
            const labels = {
              'backlog': 'Backlog',
              'new': 'New',
              'in_progress': 'In Progress',
              'built': 'Completed'
            };
            
            return (
              <div key={status} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-2 sm:p-3 min-w-0">
                <div className="text-center min-w-0">
                  <div 
                    className="text-xl sm:text-2xl font-bold mb-1 truncate"
                    style={{ color: colors[status] }}
                  >
                    {count}
                  </div>
                  <div className="text-[#9CA3AF] text-[10px] sm:text-xs truncate">{labels[status]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {dashboardData?.recent_activity?.length > 0 && (
        <div className="mb-4 min-w-0">
          <h3 className="text-[#F9FAFB] text-base sm:text-lg font-semibold mb-3 sm:mb-4 m-0">Recent Activity</h3>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
            {dashboardData.recent_activity.slice(0, 5).map((task, index) => (
              <div 
                key={task.id} 
                className={`p-2 sm:p-3 min-w-0 ${index > 0 ? 'border-t border-[#2A2A2A]' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 
                        task.status === 'built' ? '#10B981' :
                        task.status === 'in_progress' ? '#F59E0B' :
                        task.status === 'new' ? '#06B6D4' : '#4B5563'
                      }}
                    />
                    <span className="text-[#F9FAFB] text-sm truncate">{task.title}</span>
                  </div>
                  <span className="text-[#9CA3AF] text-xs flex-shrink-0 ml-2">
                    {new Date(task.updated_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="text-center text-[#4B5563] text-xs mt-4">
        Mission Control System • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}