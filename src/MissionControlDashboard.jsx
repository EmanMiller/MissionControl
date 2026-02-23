import { useState } from 'react';
import { Users, Activity, Zap, CheckSquare } from 'lucide-react';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const AGENTS_DATA = [
  {
    id: '1',
    name: 'Marcus',
    status: 'active',
    lastActivity: '2 minutes ago', 
    currentTask: 'Monitoring system metrics',
    completedTasks: 47
  },
  {
    id: '2',
    name: 'Research Agent',
    status: 'active',
    lastActivity: '5 minutes ago',
    currentTask: 'Market analysis report', 
    completedTasks: 23
  },
  {
    id: '3',
    name: 'Content Agent',
    status: 'idle',
    lastActivity: '1 hour ago',
    currentTask: 'Awaiting new content requests',
    completedTasks: 31
  }
];

const SYSTEM_METRICS = {
  totalTasks: 156,
  completedToday: 23,
  activeAgents: 2,
  systemUptime: '7d 14h 23m'
};

/* ─── Components ─────────────────────────────────────────────────────────── */

function MetricCard({ title, value, icon: Icon, color = '#06B6D4' }) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#9CA3AF] text-xs m-0 mb-1">{title}</p>
          <p className="text-[#F9FAFB] text-xl font-bold m-0" style={{ color }}>{value}</p>
        </div>
        <Icon size={24} style={{ color: color, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function AgentCard({ agent }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'idle': return '#F59E0B';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span 
        className="text-xs rounded px-2 py-0.5 font-medium"
        style={{ 
          background: `${color}20`, 
          color,
          border: `1px solid ${color}40`
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#06B6D4] transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStatusColor(agent.status) }}
          />
          <span className="text-[#F9FAFB] font-medium">{agent.name}</span>
          {getStatusBadge(agent.status)}
        </div>
        <span className="text-[#9CA3AF] text-xs">{agent.lastActivity}</span>
      </div>

      <div className="mb-2">
        <span className="text-[#9CA3AF] text-xs">Current Task:</span>
        <p className="text-[#F9FAFB] text-sm m-0">{agent.currentTask}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[#9CA3AF] text-xs">Completed: {agent.completedTasks}</span>
        <div className="w-16 bg-[#2A2A2A] rounded-full h-2">
          <div 
            className="h-2 rounded-full"
            style={{ 
              width: `${Math.min((agent.completedTasks / 50) * 100, 100)}%`,
              background: '#06B6D4'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MissionControlDashboard({ tasks }) {
  const [agents] = useState(AGENTS_DATA);
  const [metrics] = useState(SYSTEM_METRICS);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0A0A0A] p-4">
      {/* Mission Statement Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={24} className="text-white" />
            <h1 className="text-white text-xl font-bold m-0">Mission Control</h1>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-lg p-4">
            <h2 className="text-white text-lg font-semibold mb-2 m-0">Mission Statement</h2>
            <p className="text-white/90 text-sm leading-relaxed m-0">
              An autonomous network of AI agents that operates around the clock, 
              executing tasks and generating value continuously at a highly cost-efficient rate.
            </p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
          title="Active Agents" 
          value={metrics.activeAgents} 
          icon={Users}
          color="#8B5CF6"
        />
        <MetricCard 
          title="System Uptime" 
          value={metrics.systemUptime} 
          icon={Zap}
          color="#F59E0B"
        />
      </div>

      {/* Agent Network */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users size={20} className="text-[#8B5CF6]" />
          <h3 className="text-[#F9FAFB] text-lg font-semibold m-0">Agent Network</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Active Tasks Summary */}
      <div className="mb-4">
        <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">Task Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Backlog', 'New', 'In Progress', 'Built'].map(status => {
            const count = tasks?.filter(t => t.status === status).length || 0;
            const colors = {
              'Backlog': '#4B5563',
              'New': '#06B6D4', 
              'In Progress': '#F59E0B',
              'Built': '#10B981'
            };
            
            return (
              <div key={status} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: colors[status] }}
                  >
                    {count}
                  </div>
                  <div className="text-[#9CA3AF] text-xs">{status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="text-center text-[#4B5563] text-xs mt-4">
        Mission Control System • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}