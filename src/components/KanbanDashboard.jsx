import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  LayoutDashboard, FileText, CheckSquare, Users, Calendar,
  FolderOpen, BookOpen, User, Building, Settings,
  Plus, Filter, MoreHorizontal, Activity, Clock, Tag,
  X, Search, RefreshCw, MapPin, Phone, Monitor, CheckCircle,
  AlertCircle, Info, Timer
} from 'lucide-react';
import apiClient from '../services/api.js';
import VoxelOffice3D from './VoxelOffice3D.jsx';
import socketService from '../services/socket.js';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import AgentAssignmentModal from './AgentAssignmentModal.jsx';

/* ─── Sidebar Navigation ────────────────────────────────────────────────── */

const NAVIGATION_ITEMS = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, active: true },
  { id: 'agents', label: 'Team', icon: Users },
  { id: 'manage-agents', label: 'Manage Agents', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare }
];

const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#6B7280' },
  { id: 'new', title: 'New', color: '#06B6D4' },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B' },
  { id: 'built', title: 'Completed', color: '#10B981' }
];

/* ─── Toast Notification Component ──────────────────────────────────────── */

function Toast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle size={20} className="text-[#10B981]" />;
      case 'error': return <AlertCircle size={20} className="text-[#EF4444]" />;
      case 'info': return <Info size={20} className="text-[#06B6D4]" />;
      default: return <Info size={20} className="text-[#06B6D4]" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-[#10B981]/10 border-[#10B981]/20';
      case 'error': return 'bg-[#EF4444]/10 border-[#EF4444]/20';
      case 'info': return 'bg-[#06B6D4]/10 border-[#06B6D4]/20';
      default: return 'bg-[#06B6D4]/10 border-[#06B6D4]/20';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 flex items-start gap-3 min-w-80 max-w-md shadow-lg backdrop-blur-sm`}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-[#F9FAFB] font-medium text-sm">{notification.title}</h4>
        {notification.message && (
          <p className="text-[#9CA3AF] text-xs mt-1">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(notification.id)}
        className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ToastContainer({ notifications, onClose }) {
  if (!notifications || notifications.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast
            notification={notification}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Components ─────────────────────────────────────────────────────────── */

function AgentManagementView({ agents, setAgents, loadAgents, user, addNotification }) {
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Real-time agent updates
  useEffect(() => {
    const cleanup = socketService.on('agent-updated', (data) => {
      console.log('🔄 Agent update received:', data);
      
      switch (data.type) {
        case 'created':
          setAgents(prev => [data.agent, ...prev]);
          break;
          
        case 'status-updated':
          setAgents(prev => prev.map(agent => 
            agent.id === data.agentId 
              ? { ...agent, status: data.status, current_task_id: data.currentTaskId }
              : agent
          ));
          break;
          
        case 'deleted':
          setAgents(prev => prev.filter(agent => agent.id !== data.agentId));
          break;
          
        default:
          // Full reload for other updates
          loadAgents();
      }
    });

    return cleanup;
  }, [setAgents, loadAgents]);

  async function handleSyncOpenClaw() {
    try {
      setSyncing(true);
      const result = await apiClient.syncOpenClawAgents();
      
      // Reload agents to show synced ones
      await loadAgents();
      
      addNotification({
        type: 'success',
        title: 'Agents synced successfully',
        message: result.message || `Synced ${result.synced} agents from OpenClaw`
      });
    } catch (error) {
      console.error('Sync failed:', error);
      addNotification({
        type: 'error',
        title: 'Sync failed',
        message: error.message || 'Failed to sync agents from OpenClaw'
      });
    } finally {
      setSyncing(false);
    }
  }

  async function createAgent(agentData) {
    try {
      setLoading(true);
      const response = await apiClient.createAgent(agentData);
      if (response.agent) {
        await loadAgents(); // Reload the agent list
        setShowAddAgent(false);
        toast.success('Agent created successfully');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error(error?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  }

  async function updateAgentStatus(agentId, newStatus) {
    try {
      await apiClient.updateAgentStatus(agentId, newStatus);
      await loadAgents(); // Refresh the list
      toast.success('Agent status updated');
    } catch (error) {
      console.error('Failed to update agent status:', error);
      toast.error(error?.message || 'Failed to update agent status');
    }
  }

  async function deleteAgent(agentId) {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await apiClient.deleteAgent(agentId);
      await loadAgents(); // Refresh the list
      toast.success('Agent deleted');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast.error(error?.message || 'Failed to delete agent');
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'text-[#F59E0B] bg-[#F59E0B]/20';
      case 'idle': return 'text-[#10B981] bg-[#10B981]/20';
      case 'error': return 'text-[#EF4444] bg-[#EF4444]/20';
      case 'offline': return 'text-[#6B7280] bg-[#6B7280]/20';
      default: return 'text-[#6B7280] bg-[#6B7280]/20';
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0A0A0A] overflow-x-hidden min-w-0">
      <div className="max-w-6xl mx-auto min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2">Agent Fleet</h2>
            <p className="text-[#9CA3AF] text-sm">Manage and monitor your AI agents</p>
          </div>
          <button
            onClick={() => setShowAddAgent(true)}
            className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={18} />
            Add Agent
          </button>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-[#06B6D4] rounded-full" />
            <p className="text-[#9CA3AF] mt-2">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-[#6B7280] mx-auto mb-4" />
            <h3 className="text-[#F9FAFB] text-lg font-medium mb-2">No agents yet</h3>
            <p className="text-[#9CA3AF] text-sm mb-6">Create your first AI agent to get started</p>
            <button
              onClick={() => setShowAddAgent(true)}
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[#F9FAFB] font-semibold text-lg truncate">{agent.name}</h3>
                    <p className="text-[#9CA3AF] text-sm capitalize mt-1">{agent.type}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                    <div className="relative">
                      <button className="text-[#9CA3AF] hover:text-[#F9FAFB] p-1">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Task */}
                {agent.current_task_title && (
                  <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
                    <p className="text-[#9CA3AF] text-xs mb-1">Current Task</p>
                    <p className="text-[#F9FAFB] text-sm font-medium truncate">{agent.current_task_title}</p>
                  </div>
                )}

                {/* Performance Stats */}
                {agent.performance_stats && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[#9CA3AF] text-xs font-medium">Performance</p>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-[#1A1A1A] rounded p-2">
                        <p className="text-[#F9FAFB] text-lg font-semibold">{agent.performance_stats.tasksCompleted || 0}</p>
                        <p className="text-[#9CA3AF] text-xs">Tasks</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded p-2">
                        <p className="text-[#F9FAFB] text-lg font-semibold">{agent.performance_stats.successRate || 0}%</p>
                        <p className="text-[#9CA3AF] text-xs">Success</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Capabilities */}
                {agent.capabilities && agent.capabilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[#9CA3AF] text-xs font-medium mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((capability, idx) => (
                        <span key={idx} className="bg-[#06B6D4]/20 text-[#06B6D4] text-xs px-2 py-1 rounded">
                          {capability}
                        </span>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <span className="text-[#6B7280] text-xs px-2 py-1">
                          +{agent.capabilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {agent.status === 'idle' ? (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'working')}
                      className="flex-1 bg-[#10B981]/20 text-[#10B981] px-3 py-2 rounded text-sm font-medium hover:bg-[#10B981]/30 transition-colors"
                    >
                      Activate
                    </button>
                  ) : agent.status === 'working' ? (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'idle')}
                      className="flex-1 bg-[#F59E0B]/20 text-[#F59E0B] px-3 py-2 rounded text-sm font-medium hover:bg-[#F59E0B]/30 transition-colors"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'idle')}
                      className="flex-1 bg-[#6B7280]/20 text-[#6B7280] px-3 py-2 rounded text-sm font-medium hover:bg-[#6B7280]/30 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="px-3 py-2 text-[#EF4444] hover:bg-[#EF4444]/20 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Agent Modal */}
        {showAddAgent && (
          <AgentCreateModal
            isOpen={showAddAgent}
            onClose={() => setShowAddAgent(false)}
            onSubmit={createAgent}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function AgentCreateModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'general',
    capabilities: []
  });
  const [newCapability, setNewCapability] = useState('');

  const agentTypes = [
    { value: 'general', label: 'General Purpose' },
    { value: 'coding', label: 'Coding' },
    { value: 'research', label: 'Research' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'creative', label: 'Creative' },
    { value: 'support', label: 'Support' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      ...formData,
      name: formData.name.trim()
    });
  };

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (capability) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold">Create New Agent</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agent Name */}
          <div>
            <label className="block text-[#9CA3AF] text-sm font-medium mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Research Assistant"
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
              required
            />
          </div>

          {/* Agent Type */}
          <div>
            <label className="block text-[#9CA3AF] text-sm font-medium mb-2">
              Agent Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors"
            >
              {agentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-[#9CA3AF] text-sm font-medium mb-2">
              Capabilities
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                placeholder="e.g. Web Scraping"
                className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
              />
              <button
                type="button"
                onClick={addCapability}
                className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.capabilities.map((capability, idx) => (
                <span
                  key={idx}
                  className="bg-[#06B6D4]/20 text-[#06B6D4] text-xs px-2 py-1 rounded flex items-center gap-1"
                >
                  {capability}
                  <button
                    type="button"
                    onClick={() => removeCapability(capability)}
                    className="text-[#06B6D4] hover:text-[#0891B2]"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#2A2A2A] text-[#9CA3AF] px-4 py-2 rounded-lg font-medium hover:bg-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-[#6B7280] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg max-w-md w-full my-auto max-h-[90vh] flex flex-col min-w-0">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#2A2A2A] flex-shrink-0">
          <h3 className="text-[#F9FAFB] font-semibold text-sm sm:text-base truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function TeamOfficeView({ user }) {
  const [agents, setAgents] = useState([]);
  const [openclawConnected, setOpenclawConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAgentsAndStatus();
  }, []);

  async function loadAgentsAndStatus() {
    try {
      // Check if OpenClaw is configured and connected
      const config = await apiClient.getOpenClawConfig();
      const isConnected = config?.endpoint && config.endpoint !== '';
      setOpenclawConnected(isConnected);

      // Build dynamic agents array based on system state
      const dynamicAgents = [];
      
      // Always add user avatar
      dynamicAgents.push({
        id: 'user',
        name: 'Emmanuel Miller',
        role: 'Human',
        status: 'active',
        color: 0xF59E0B, // Orange/Gold for human
        type: 'human'
      });

      // Main Agent (OpenClaw instance) - shown when connected
      if (isConnected) {
        dynamicAgents.push({
          id: 'main-agent',
          name: 'OpenClaw',
          role: 'Main Agent',
          status: 'active',
          color: 0x06B6D4, // Cyan - matches brand
          type: 'main'
        });
      }

      // Fetch and add OpenClaw agents
      try {
        const syncedAgents = await apiClient.getAgents();
        if (syncedAgents?.agents?.length > 0) {
          syncedAgents.agents.forEach(agent => {
            dynamicAgents.push({
              id: agent.id,
              name: agent.name,
              role: `${agent.type} Agent`,
              status: agent.status || 'idle',
              color: getAgentColor(agent.type),
              type: 'agent'
            });
          });
        } else if (isConnected) {
          // Auto-sync if no agents but connected
          const syncResult = await apiClient.syncOpenClawAgents();
          if (syncResult.synced > 0) {
            const refreshedAgents = await apiClient.getAgents();
            refreshedAgents.agents.forEach(agent => {
              dynamicAgents.push({
                id: agent.id,
                name: agent.name,
                role: `${agent.type} Agent`,
                status: agent.status || 'idle',
                color: getAgentColor(agent.type),
                type: 'agent'
              });
            });
          }
        }
      } catch (agentError) {
        console.log('Agent sync skipped:', agentError.message);
      }

      // Add some default agents for demo purposes if none exist
      if (dynamicAgents.length === 1) { // Only user
        dynamicAgents.push({
          id: 'codex',
          name: 'Codex',
          role: 'Code Agent',
          status: 'idle',
          color: 0x8B5CF6, // Purple for coding
          type: 'agent'
        });
      }

      setAgents(dynamicAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setOpenclawConnected(false);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }

  function getAgentColor(type) {
    const colors = {
      'coding': 0x8B5CF6, // Purple
      'research': 0x10B981, // Green
      'general': 0x06B6D4, // Cyan
      'analysis': 0xF59E0B, // Orange
      'creative': 0xEC4899, // Pink
      'system': 0x6B7280, // Gray
    };
    return colors[type?.toLowerCase()] || 0x06B6D4;
  }

  async function handleSyncOpenClaw() {
    try {
      setSyncing(true);
      const result = await apiClient.syncOpenClawAgents();
      
      // Reload agents for the 3D view
      await loadAgentsAndStatus();
      
      console.log('Agents synced:', result.message || `Synced ${result.synced} agents from OpenClaw`);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0A0A0A] overflow-x-hidden min-w-0">
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#F9FAFB] text-lg sm:text-xl font-semibold mb-2">Team</h2>
              <p className="text-[#9CA3AF] text-xs sm:text-sm">Your AI agents and their current status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncOpenClaw}
                disabled={syncing}
                className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[#0A0A0A] border border-[#2A2A2A] text-[#06B6D4] px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync OpenClaw'}
              </button>
            </div>
          </div>
        </div>

        {/* 3D Voxel Office Scene */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 overflow-hidden">
          <VoxelOffice3D user={user} agents={agents} />
          
          {/* Character Name Labels */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-8 text-xs text-[#9CA3AF]">
            <div className="text-center">
              <div className="w-3 h-3 bg-[#F59E0B] rounded mx-auto mb-1"></div>
              <span>{user.name}</span>
            </div>
            {agents.map((agent) => (
              <div key={agent.id} className="text-center">
                <div 
                  className="w-3 h-3 rounded mx-auto mb-1"
                  style={{ backgroundColor: `#${agent.color.toString(16).padStart(6, '0')}` }}
                ></div>
                <span>{agent.name}</span>
              </div>
            ))}
          </div>

          {/* Agent Status Panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `#${agent.color.toString(16).padStart(6, '0')}` }}
                  ></div>
                  <h4 className="text-[#F9FAFB] font-medium">{agent.name}</h4>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      agent.status === 'active' 
                        ? 'bg-[#10B981]/20 text-[#10B981]' 
                        : 'bg-[#6B7280]/20 text-[#6B7280]'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <p className="text-[#9CA3AF] text-sm">{agent.role || ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  async function loadCalendarEvents() {
    try {
      setLoading(true);
      // TODO: Integrate with OpenClaw agent's schedule
      setEvents([]);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0A0A0A] overflow-x-hidden min-w-0">
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[#F9FAFB] text-lg sm:text-xl font-semibold mb-2">Calendar</h2>
              <p className="text-[#9CA3AF] text-xs sm:text-sm">OpenClaw agent schedule and planned tasks</p>
            </div>
            <button
              onClick={loadCalendarEvents}
              className="flex items-center justify-center gap-2 bg-[#374151] hover:bg-[#4B5563] text-white px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#06B6D4] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#9CA3AF]">Loading agent schedule...</p>
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg">
            <div className="p-4 border-b border-[#2A2A2A]">
              <h3 className="text-[#F9FAFB] font-medium">Today's Schedule</h3>
            </div>
            
            <div className="p-4">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="text-[#6B7280] mx-auto mb-4" />
                  <h4 className="text-[#F9FAFB] font-medium mb-2">No events scheduled</h4>
                  <p className="text-[#9CA3AF] text-sm">Your OpenClaw agent has no planned activities</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 bg-[#1A1A1A] rounded-lg min-w-0">
                      <div className="text-[#06B6D4] text-sm font-medium flex-shrink-0">
                        {event.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#F9FAFB] font-medium text-sm sm:text-base truncate">{event.title}</h4>
                        <p className="text-[#9CA3AF] text-xs sm:text-sm">{event.duration}</p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                        event.status === 'in_progress' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        event.status === 'upcoming' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' :
                        'bg-[#6B7280]/20 text-[#6B7280]'
                      }`}>
                        {event.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCreateForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    github_url: '',
    status: 'active',
    tags: ''
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Parse tags from text input
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      github_url: formData.github_url.trim() || null,
      tags: tags.length > 0 ? tags : null
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">Project Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          placeholder="Enter project name..."
          required
        />
      </div>

      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
          rows="3"
          placeholder="Describe the project..."
        />
      </div>

      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">GitHub Repository</label>
        <input
          type="url"
          value={formData.github_url}
          onChange={e => setFormData({...formData, github_url: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          placeholder="https://github.com/user/repo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">
            Tags <span className="text-[#6B7280]">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={e => setFormData({...formData, tags: e.target.value})}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
            placeholder="e.g. web, mobile, AI"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 sm:px-4 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Project
        </button>
      </div>
    </form>
  );
}

function ProjectsView({ user, addNotification }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const response = await apiClient.getProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      addNotification && addNotification({
        type: 'error',
        title: 'Failed to load projects',
        message: error.message || 'Could not load projects'
      });
    } finally {
      setLoading(false);
    }
  }

  async function createProject(projectData) {
    try {
      const response = await apiClient.createProject(projectData);
      if (response.project) {
        setProjects(prev => [response.project, ...prev]);
        setShowCreateModal(false);
        addNotification && addNotification({
          type: 'success',
          title: 'Project created',
          message: `${response.project.name} was created successfully`
        });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      addNotification && addNotification({
        type: 'error',
        title: 'Failed to create project',
        message: error.message || 'Could not create project'
      });
    }
  }

  async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await apiClient.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      addNotification && addNotification({
        type: 'success',
        title: 'Project deleted',
        message: 'Project was deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      addNotification && addNotification({
        type: 'error',
        title: 'Failed to delete project',
        message: error.message || 'Could not delete project'
      });
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0A0A0A] overflow-x-hidden min-w-0">
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[#F9FAFB] text-lg sm:text-xl font-semibold mb-2">Projects</h2>
              <p className="text-[#9CA3AF] text-xs sm:text-sm">Manage your active projects and initiatives</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#06B6D4] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#9CA3AF]">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <FolderOpen size={48} className="text-[#6B7280] mx-auto mb-4" />
            <h3 className="text-[#F9FAFB] font-medium mb-2">No projects</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">You haven't created any projects yet</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 hover:border-[#06B6D4]/50 transition-colors cursor-pointer min-w-0"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[#F9FAFB] font-semibold text-base sm:text-lg truncate">{project.name}</h3>
                    <p className="text-[#9CA3AF] text-xs sm:text-sm mt-1 line-clamp-2">{project.description}</p>
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" 
                         className="text-[#06B6D4] text-xs hover:underline mt-1 inline-block"
                         onClick={(e) => e.stopPropagation()}>
                        GitHub Repository
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full flex-shrink-0 w-fit ${
                      project.status === 'active' ? 'bg-[#10B981]/20 text-[#10B981]' :
                      project.status === 'planning' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                      project.status === 'completed' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' :
                      'bg-[#6B7280]/20 text-[#6B7280]'
                    }`}>
                      {project.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="text-[#EF4444] hover:text-[#DC2626] p-1 transition-colors"
                      title="Delete project"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-[#06B6D4]/20 text-[#06B6D4] text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="px-2 py-1 bg-[#6B7280]/20 text-[#6B7280] text-xs rounded-full">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#9CA3AF]">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      <CustomModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title="Project Details"
      >
        {selectedProject && (
          <div>
            <h4 className="text-[#F9FAFB] font-semibold text-lg mb-2">{selectedProject.name}</h4>
            <p className="text-[#9CA3AF] text-sm mb-4">{selectedProject.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[#9CA3AF] text-xs">Status</label>
                <p className="text-[#F9FAFB] capitalize">{selectedProject.status}</p>
              </div>
              <div>
                <label className="text-[#9CA3AF] text-xs">Progress</label>
                <p className="text-[#F9FAFB]">{selectedProject.progress}%</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-end gap-2">
              <button 
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
              >
                Close
              </button>
              <button className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm transition-colors">
                View Tasks
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Project Creation Modal */}
      <CustomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <ProjectCreateForm onSubmit={createProject} onCancel={() => setShowCreateModal(false)} />
      </CustomModal>
    </div>
  );
}

function ApprovalsView({ user }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      setLoading(true);
      // TODO: Add approvals API endpoint
      // For now, show placeholder approvals
      const mockApprovals = [];
      
      setApprovals(mockApprovals);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(id, action) {
    try {
      // TODO: Implement approval action
      console.log(`${action} approval ${id}`);
      loadApprovals();
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0A0A0A] overflow-x-hidden min-w-0">
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-[#F9FAFB] text-lg sm:text-xl font-semibold mb-2">Approvals</h2>
          <p className="text-[#9CA3AF] text-xs sm:text-sm">Review and approve agent actions and requests</p>
        </div>

        {loading ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#06B6D4] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#9CA3AF]">Loading approvals...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <CheckSquare size={48} className="text-[#6B7280] mx-auto mb-4" />
            <h3 className="text-[#F9FAFB] font-medium mb-2">No pending approvals</h3>
            <p className="text-[#9CA3AF] text-sm">Your agents are working autonomously without requiring approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[#F9FAFB] font-semibold text-sm sm:text-base truncate">{approval.title}</h3>
                    <p className="text-[#9CA3AF] text-xs sm:text-sm mt-1 line-clamp-2">{approval.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#6B7280]">
                      <span>Requested by {approval.agent}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{approval.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproval(approval.id, 'reject')}
                      className="px-3 py-1 bg-[#EF4444]/20 text-[#EF4444] text-sm rounded hover:bg-[#EF4444]/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, 'approve')}
                      className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] text-sm rounded hover:bg-[#10B981]/30 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ activeItem, onItemClick, onSignOut }) {
  return (
    <div className="w-60 bg-[#111111] border-r border-[#2A2A2A] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <h1 className="text-[#F9FAFB] font-semibold text-lg">Mission Control</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive 
                    ? 'bg-[#06B6D4] text-white' 
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F1F1F]'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* User Section */}
      <div className="p-3 border-t border-[#2A2A2A] space-y-1">
        <button
          onClick={() => onItemClick('settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F1F1F] transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
        >
          <User size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function StatsBar({ tasks }) {
  const thisWeek = tasks.filter(task => {
    const created = new Date(task.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created >= weekAgo;
  }).length;
  
  const inProgress = tasks.filter(task => task.status === 'in_progress').length;
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'built').length;
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8 px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2A2A2A] min-w-0 overflow-x-auto">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl sm:text-3xl font-bold text-[#10B981]">{thisWeek}</span>
        <span className="text-[#9CA3AF] text-xs sm:text-sm">This week</span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl sm:text-3xl font-bold text-[#F59E0B]">{inProgress}</span>
        <span className="text-[#9CA3AF] text-xs sm:text-sm">In progress</span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl sm:text-3xl font-bold text-[#06B6D4]">{total}</span>
        <span className="text-[#9CA3AF] text-xs sm:text-sm">Total</span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl sm:text-3xl font-bold text-[#8B5CF6]">{completion}%</span>
        <span className="text-[#9CA3AF] text-xs sm:text-sm">Completion</span>
      </div>
    </div>
  );
}

function TaskCard({ task, index, onAssignAgent, onDelete, onTaskClick, agents = [] }) {
  const getStatusColor = (status) => {
    const colors = {
      'backlog': '#6B7280',
      'new': '#06B6D4', 
      'in_progress': '#F59E0B',
      'built': '#10B981',
      'failed': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#EF4444',
      'medium': '#F59E0B', 
      'low': '#10B981'
    };
    return colors[priority] || '#F59E0B';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Parse tags from task description or dedicated tags field
  const tags = task.tags || (task.description?.match(/#\w+/g) || []).map(tag => tag.substring(1));

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={(e) => {
            // Only handle click if it's not on the delete button
            if (!e.target.closest('button') && onTaskClick) {
              onTaskClick(task);
            }
          }}
          className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 hover:border-[#3A3A3A] ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
        >
          {/* Task Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-[#F9FAFB] font-medium text-sm leading-tight flex-1">
              {task.title}
            </h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this task?')) {
                  onDelete(task.id);
                }
              }}
              className="flex-shrink-0 text-[#6B7280] hover:text-[#EF4444] transition-colors p-1 rounded hover:bg-[#2A2A2A]"
              title="Delete task"
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-[#9CA3AF] text-xs mb-3 leading-relaxed">
              {task.description.length > 100 
                ? task.description.substring(0, 100) + '...' 
                : task.description
              }
            </p>
          )}
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-[#06B6D4]/20 text-[#06B6D4] text-xs rounded-full flex items-center gap-1"
                >
                  <Tag size={8} />
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-1 bg-[#6B7280]/20 text-[#6B7280] text-xs rounded-full">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Time Estimate */}
          {task.estimated_hours && (
            <div className="flex items-center gap-1 mb-2 text-[#9CA3AF]">
              <Timer size={12} />
              <span className="text-xs">
                {task.estimated_hours < 1 
                  ? `${task.estimated_hours * 60}m`
                  : task.estimated_hours < 8 
                    ? `${task.estimated_hours}h`
                    : `${Math.ceil(task.estimated_hours / 8)}d`
                }
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Priority Dot */}
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
              
              {/* Agent/Assignee */}
              <span className="text-[#9CA3AF] text-xs">
                {task.status === 'in_progress' ? 'OpenClaw' : 'Agents'}
              </span>
            </div>
            
            {/* Time */}
            <span className="text-[#6B7280] text-xs">
              {formatTimeAgo(task.created_at)}
            </span>
          </div>

          {/* Agent Assignment Section */}
          {task.status !== 'built' && (
            <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
              {task.assigned_agent_id ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#06B6D4] rounded-full flex items-center justify-center">
                      <User size={10} className="text-white" />
                    </div>
                    <span className="text-[#F9FAFB] text-xs">
                      {agents.find(a => a.id === task.assigned_agent_id)?.name || 'Agent'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignAgent && onAssignAgent(task);
                    }}
                    className="text-[#9CA3AF] hover:text-[#F9FAFB] text-xs transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignAgent && onAssignAgent(task);
                  }}
                  className="w-full text-[#06B6D4] hover:text-[#0891B2] text-xs font-medium transition-colors flex items-center justify-center gap-1 py-1"
                >
                  <User size={12} />
                  Assign Agent
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ column, tasks, onAddTask, onAssignAgent, onDelete, onTaskClick, agents }) {
  const taskCount = tasks.length;
  
  return (
    <div className="flex-1 min-w-64 sm:min-w-80 max-w-xs sm:max-w-none">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="text-[#F9FAFB] font-medium text-xs sm:text-sm truncate">
            {column.title}
          </h2>
          <span className="bg-[#2A2A2A] text-[#9CA3AF] text-xs px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
            {taskCount}
          </span>
        </div>
        
        <button
          onClick={() => onAddTask(column.id)}
          className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors p-1 flex-shrink-0"
        >
          <Plus size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
      
      {/* Tasks */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-64 max-h-[calc(100vh-280px)] overflow-y-auto transition-colors rounded-lg kanban-column-scroll ${
              snapshot.isDraggingOver ? 'bg-[#0A0A0A] border border-[#06B6D4]' : ''
            }`}
          >
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-[#6B7280] text-sm">No tasks</span>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  index={index}
                  onAssignAgent={onAssignAgent}
                  onDelete={onDelete}
                  onTaskClick={onTaskClick}
                  agents={agents}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function ActivitySidebar({ tasks }) {
  const recentActivity = tasks
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return (
    <div className="hidden lg:block w-80 bg-[#111111] border-l border-[#2A2A2A] p-4 flex-shrink-0 overflow-y-auto min-w-0">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={16} className="text-[#9CA3AF]" />
        <h2 className="text-[#F9FAFB] font-medium text-sm">Live Activity</h2>
      </div>
      
      {recentActivity.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center mx-auto mb-3">
            <Activity size={20} className="text-[#6B7280]" />
          </div>
          <p className="text-[#6B7280] text-sm mb-1">No recent activity</p>
          <p className="text-[#4B5563] text-xs">Events will appear here as agents work</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentActivity.map((task) => (
            <div key={task.id} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">
                  {task.title.charAt(0)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[#F9FAFB] text-sm font-medium truncate">
                  {task.title}
                </p>
                <p className="text-[#9CA3AF] text-xs">
                  Status: {task.status.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#6B7280] text-xs">
                    {new Date(task.updated_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsContent({ user, onSignOut }) {
  const [openClawConfig, setOpenClawConfig] = useState({ endpoint: '', token: '' });
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOpenClawConfig();
  }, []);

  async function loadOpenClawConfig() {
    try {
      const config = await apiClient.getOpenClawConfig();
      const isConfigured = config.token === '***CONFIGURED***';
      setTokenConfigured(!!isConfigured);
      setOpenClawConfig({
        endpoint: config.endpoint || '',
        token: isConfigured ? '' : (config.token || '')
      });
    } catch (error) {
      console.error('Failed to load OpenClaw config:', error);
    }
  }

  async function testConnection() {
    if (!openClawConfig.endpoint) {
      toast.error('Please enter an OpenClaw endpoint first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await apiClient.testOpenClawConnection(
        openClawConfig.endpoint,
        openClawConfig.token?.trim() || (tokenConfigured ? '***CONFIGURED***' : null)
      );
      setTestResult(result);
      if (result?.success) toast.success('Connection successful');
      else toast.error(result?.error || 'Connection failed');
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      toast.error(error?.message || 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  }

  async function saveConfig() {
    if (!openClawConfig.endpoint) {
      toast.error('Please enter an OpenClaw endpoint');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.saveOpenClawConfig(
        openClawConfig.endpoint,
        openClawConfig.token?.trim() || (tokenConfigured ? '***CONFIGURED***' : null)
      );
      toast.success('OpenClaw configuration saved');
      setTokenConfigured(true);
      setTestResult(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-3 sm:p-6 min-w-0">
      <div className="max-w-2xl mx-auto min-w-0">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-[#F9FAFB] text-lg sm:text-xl font-semibold mb-2 m-0">Settings</h2>
          <p className="text-[#9CA3AF] text-xs sm:text-sm m-0">Configure your Mission Control system</p>
        </div>

        {/* OpenClaw Configuration */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">OpenClaw Integration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[#9CA3AF] text-sm block mb-2">
                OpenClaw Endpoint *
              </label>
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                value={openClawConfig.endpoint}
                onChange={e => setOpenClawConfig({...openClawConfig, endpoint: e.target.value})}
                placeholder="http://localhost:18789 or http://127.0.0.1:18789"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
                style={{ fontFamily: 'inherit' }}
              />
              <p className="text-[#6B7280] text-xs mt-1 m-0">
                URL of your OpenClaw instance (e.g., http://localhost:18789)
              </p>
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm block mb-2">
                Authentication Token
              </label>
              <input
                type="password"
                value={openClawConfig.token}
                onChange={e => setOpenClawConfig({...openClawConfig, token: e.target.value})}
                placeholder={tokenConfigured ? 'Token set — enter a new value to change' : 'Required; set hooks.token in ~/.openclaw/openclaw.json'}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
                style={{ fontFamily: 'inherit' }}
              />
              {tokenConfigured && !openClawConfig.token && (
                <p className="text-[#10B981] text-xs mt-1 m-0">Token is saved. Re-enter only to change it.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={testConnection}
                disabled={isTesting || !openClawConfig.endpoint}
                className="bg-[#374151] hover:bg-[#4B5563] border-none text-white text-sm px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 select-none"
                style={{ fontFamily: 'inherit' }}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={saveConfig}
                disabled={isSaving || !openClawConfig.endpoint || (!openClawConfig.token?.trim() && !tokenConfigured)}
                className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 select-none"
                style={{ fontFamily: 'inherit' }}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-[#10B981]/10 border border-[#10B981]/20' : 'bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>
                {testResult.success ? (
                  <div className="text-[#10B981]">
                    ✓ Connection successful! 
                    {testResult.version && ` (Version: ${testResult.version})`}
                  </div>
                ) : (
                  <div className="text-[#EF4444]">
                    ✗ Connection failed: {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-[#F9FAFB] text-base sm:text-lg font-semibold mb-4 m-0">Profile</h3>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 min-w-0">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={user.name}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[#F9FAFB] font-medium truncate">{user.name}</div>
              <div className="text-[#9CA3AF] text-xs sm:text-sm truncate">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 sm:p-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">Account</h3>
          
          <button
            onClick={onSignOut}
            className="bg-transparent border border-[#EF4444] text-[#EF4444] text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-[#EF4444]/10 transition-colors select-none"
            style={{ fontFamily: 'inherit' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCreateForm({ onSubmit, initialStatus, availableTags }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: initialStatus || 'new',
    tags: '',
    estimated_hours: ''
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Parse tags from text input
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSubmit({
      ...formData,
      tags: tags.length > 0 ? tags : undefined
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          placeholder="Enter task title..."
          required
        />
      </div>

      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
          rows="3"
          placeholder="Describe the task..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: e.target.value})}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="built">Completed</option>
          </select>
        </div>

        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2 flex items-center gap-1">
            <Timer size={14} />
            Time Estimate
          </label>
          <select
            value={formData.estimated_hours}
            onChange={e => setFormData({...formData, estimated_hours: e.target.value})}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="">No estimate</option>
            <option value="0.5">30 minutes</option>
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="4">4 hours</option>
            <option value="8">8 hours</option>
            <option value="16">2 days</option>
            <option value="24">3 days</option>
            <option value="40">1 week</option>
            <option value="80">2 weeks</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[#9CA3AF] text-sm block mb-2">
          Tags <span className="text-[#6B7280]">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={e => setFormData({...formData, tags: e.target.value})}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm focus:border-[#06B6D4] focus:outline-none"
          placeholder="e.g. Blue Project, Red Project, Urgent"
        />
        {availableTags.length > 0 && (
          <div className="mt-2">
            <p className="text-[#6B7280] text-xs mb-1">Existing tags:</p>
            <div className="flex flex-wrap gap-1">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                    if (!currentTags.includes(tag)) {
                      setFormData({...formData, tags: [...currentTags, tag].join(', ')});
                    }
                  }}
                  className="px-2 py-1 bg-[#06B6D4]/20 text-[#06B6D4] text-xs rounded-full hover:bg-[#06B6D4]/30 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setFormData({ title: '', description: '', priority: 'medium', status: initialStatus || 'backlog', tags: '', estimated_hours: '' })}
          className="px-3 sm:px-4 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors text-sm"
        >
          Clear
        </button>
        <button
          type="submit"
          className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}

/* ─── Mobile Sidebar Component ──────────────────────────────────────────── */

function MobileSidebar({ user, activeItem, onItemClick, onSignOut, onClose }) {
  return (
    <div className="flex flex-col h-full min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <span className="text-[#F9FAFB] font-semibold truncate">Mission Control</span>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive 
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' 
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1A1A1A]'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* User Section */}
      <div className="p-4 border-t border-[#2A2A2A] flex-shrink-0">
        {user && (
          <div className="flex items-center gap-3 mb-3 min-w-0">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              alt={user.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[#F9FAFB] text-sm font-medium truncate">{user.name}</div>
              <div className="text-[#6B7280] text-xs truncate">{user.email}</div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => onItemClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-2 ${
            activeItem === 'settings'
              ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' 
              : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1A1A1A]'
          }`}
        >
          <Settings size={18} className="flex-shrink-0" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
        >
          <User size={18} className="flex-shrink-0" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Task Detail Modal ─────────────────────────────────────────────────── */

function TaskDetailModal({ isOpen, onClose, task, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedHours, setEstimatedHours] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setEstimatedHours(task.estimated_hours || '');
    }
  }, [task]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  const getStatusColor = (status) => {
    const colors = {
      'backlog': '#6B7280',
      'new': '#06B6D4', 
      'in_progress': '#F59E0B',
      'built': '#10B981',
      'failed': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#10B981',
      'medium': '#F59E0B', 
      'high': '#EF4444'
    };
    return colors[priority] || '#F59E0B';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusColor(task.status) }}
            />
            <h2 className="text-[#F9FAFB] text-xl font-semibold">Task Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors p-2 rounded-lg hover:bg-[#2A2A2A]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-[#F9FAFB] text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#06B6D4] focus:outline-none transition-colors"
              placeholder="Task title..."
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-[#F9FAFB] text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#06B6D4] focus:outline-none transition-colors resize-none"
              placeholder="Describe your task..."
            />
          </div>

          {/* Priority and Estimated Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[#F9FAFB] text-sm font-medium mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#F9FAFB] focus:border-[#06B6D4] focus:outline-none transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-[#F9FAFB] text-sm font-medium mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                step="0.5"
                min="0"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#9CA3AF]">Status:</span>
                <span className="text-[#F9FAFB] ml-2 capitalize">{task.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Priority:</span>
                <div className="inline-flex items-center gap-2 ml-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  />
                  <span className="text-[#F9FAFB] capitalize">{task.priority}</span>
                </div>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Created:</span>
                <span className="text-[#F9FAFB] ml-2">
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
              {task.completed_at && (
                <div>
                  <span className="text-[#9CA3AF]">Completed:</span>
                  <span className="text-[#F9FAFB] ml-2">
                    {new Date(task.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#2A2A2A] bg-[#0A0A0A]/50">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors flex items-center gap-2"
          >
            <X size={16} />
            Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanDashboard({ user, onSignOut }) {
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeNav, setActiveNav] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [assignmentTask, setAssignmentTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();
    loadAgents();
    
    // Seed backlog if empty
    seedBacklogIfNeeded();
    
    // Connect to WebSocket for real-time updates
    socketService.connect(user.id);
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user.id]);

  // Poll task list while any task is in progress (so webhook completion updates the board)
  const hasInProgress = tasks.some(t => t.status === 'in_progress');
  useEffect(() => {
    if (!hasInProgress) return;
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, [hasInProgress]);

  // Notification functions
  function addNotification(notification) {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  }

  function removeNotification(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function loadTasks() {
    try {
      const response = await apiClient.getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(taskId) {
    try {
      await apiClient.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  }

  function handleTaskClick(task) {
    setSelectedTask(task);
  }

  async function handleTaskUpdate(taskId, updates) {
    try {
      await apiClient.updateTask(taskId, updates);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      setSelectedTask(null);
      toast.success('Task updated');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  }

  async function loadAgents() {
    try {
      const response = await apiClient.getAgents();
      setAgents(response.agents || []);
      
      // Auto-sync from OpenClaw if no agents exist
      if ((!response.agents || response.agents.length === 0) && activeNav === 'agents') {
        try {
          const syncResult = await apiClient.syncOpenClawAgents();
          if (syncResult.synced > 0) {
            // Reload agents after successful sync
            const refreshedData = await apiClient.getAgents();
            setAgents(refreshedData.agents || []);
            
            addNotification({
              type: 'info',
              title: 'Agents synced',
              message: `Found ${syncResult.synced} agents from your OpenClaw instance`
            });
          }
        } catch (syncError) {
          // Silent fail for auto-sync - user can manually sync if needed
          console.log('Auto-sync skipped:', syncError.message);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }

  async function seedBacklogIfNeeded() {
    try {
      const response = await apiClient.getTasks();
      const backlogTasks = response.tasks?.filter(task => task.status === 'backlog') || [];
      
      // Only seed if no backlog tasks exist
      if (backlogTasks.length === 0) {
        const backlogItems = [
          {
            title: 'Agent Marketplace Integration',
            description: 'Build a marketplace where users can discover, install, and share custom AI agents. Includes agent template system, community sharing, ratings, and one-click installation.',
            status: 'backlog',
            priority: 'high',
            tags: ['marketplace', 'agents', 'community']
          },
          {
            title: 'Advanced Workflow Automation',
            description: 'Multi-agent task pipelines with conditional logic, visual workflow builder, agent handoff system, and parallel task execution.',
            status: 'backlog',
            priority: 'high', 
            tags: ['workflows', 'automation', 'pipelines']
          },
          {
            title: 'Team Collaboration Features',
            description: 'Multi-user workspace with shared agent pools, real-time collaborative task editing, team activity feeds, and role-based access control.',
            status: 'backlog',
            priority: 'high',
            tags: ['collaboration', 'teams', 'sharing']
          },
          {
            title: 'Enhanced Analytics Dashboard',
            description: 'Advanced metrics with predictive task completion, agent optimization suggestions, cost analysis, custom widgets, and export capabilities.',
            status: 'backlog',
            priority: 'high',
            tags: ['analytics', 'insights', 'reporting']
          },
          {
            title: 'Mobile App Companion',
            description: 'React Native app for iOS/Android with push notifications, voice task creation, mobile-optimized 3D visualization, and offline queuing.',
            status: 'backlog',
            priority: 'medium',
            tags: ['mobile', 'ios', 'android']
          },
          {
            title: 'Enterprise Security & SSO',
            description: 'SAML/LDAP/Active Directory integration, role-based permissions, audit logs, API key management, and compliance reporting.',
            status: 'backlog',
            priority: 'medium',
            tags: ['security', 'enterprise', 'sso']
          },
          {
            title: 'AI Agent Training Integration',
            description: 'Fine-tune agents based on performance feedback, custom model training pipeline, A/B testing, and learning curve visualization.',
            status: 'backlog',
            priority: 'medium',
            tags: ['ai', 'training', 'optimization']
          },
          {
            title: 'Voice Interface',
            description: 'Speech-to-text task creation, voice status updates, hands-free agent interaction, multi-language support, and custom wake words.',
            status: 'backlog',
            priority: 'low',
            tags: ['voice', 'speech', 'accessibility']
          },
          {
            title: 'Integration Ecosystem',
            description: 'Slack/Discord bots, GitHub Actions triggers, Zapier connector, calendar integration, and email task creation.',
            status: 'backlog',
            priority: 'low',
            tags: ['integrations', 'slack', 'github']
          },
          {
            title: '3D Office Customization',
            description: 'Custom office layouts, avatar customization, environmental animations, seasonal themes, and user-generated 3D assets.',
            status: 'backlog',
            priority: 'low',
            tags: ['3d', 'customization', 'themes']
          }
        ];

        // Create backlog tasks
        for (const item of backlogItems) {
          await apiClient.createTask(item);
        }

        // Reload tasks to show the new backlog
        await loadTasks();
        
        console.log('✅ Backlog seeded with development tasks');
      }
    } catch (error) {
      console.error('Failed to seed backlog:', error);
    }
  }

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      await apiClient.updateTaskStatus(parseInt(draggableId), destination.droppableId);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id.toString() === draggableId
            ? { ...task, status: destination.droppableId }
            : task
        )
      );
      toast.success('Task updated');
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(error?.message || 'Failed to move task');
    }
  }

  async function createTask(taskData) {
    try {
      // Show initial creation notification
      addNotification({
        type: 'info',
        title: 'Creating task...',
        message: 'Setting up your task'
      });

      const response = await apiClient.createTask(taskData);
      if (response.task) {
        setTasks(prev => [response.task, ...prev]);
        setShowTaskModal(false);
        toast.success('Task created');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error?.message || 'Failed to create task');
    }
  }

  function handleAddTask(columnId) {
    setShowTaskModal({ columnId });
  }

  function handleCreateTask(formData) {
    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status || 'new',
      priority: formData.priority || 'medium',
      tags: formData.tags,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
    };

    createTask(taskData);
  }

  async function assignTaskToAgent(taskId, agentId) {
    try {
      // Update task with agent assignment
      await apiClient.updateTaskStatus(taskId, 'in_progress'); // Auto-move to in progress
      
      // Update agent status to working
      if (agentId) {
        await apiClient.updateAgentStatus(agentId, 'working', taskId);
      }
      
      // Reload both tasks and agents
      await Promise.all([loadTasks(), loadAgents()]);
      
      addNotification({
        type: 'success',
        title: 'Agent assigned successfully',
        message: agentId ? 'Task moved to in progress' : 'Agent unassigned from task'
      });
    } catch (error) {
      console.error('Assignment error:', error);
      addNotification({
        type: 'error',
        title: 'Assignment failed',
        message: error.message || 'Failed to assign agent to task'
      });
    }
  }

  // Get all unique tags from tasks
  const allTags = [...new Set(
    tasks.flatMap(task => 
      task.tags || (task.description?.match(/#\w+/g) || []).map(tag => tag.substring(1))
    )
  )];

  // Filter tasks by selected tag
  const filteredTasks = selectedTag 
    ? tasks.filter(task => {
        const taskTags = task.tags || (task.description?.match(/#\w+/g) || []).map(tag => tag.substring(1));
        return taskTags.includes(selectedTag);
      })
    : tasks;

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-[#9CA3AF]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col lg:flex-row overflow-hidden min-w-0">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#111111] border-b border-[#2A2A2A] p-3 sm:p-4 flex items-center justify-between flex-shrink-0 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <span className="text-[#F9FAFB] font-semibold truncate text-sm sm:text-base">Mission Control</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors flex-shrink-0 p-1"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      {/* Mobile Navigation Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="bg-[#111111] border-r border-[#2A2A2A] w-[min(16rem,85vw)] max-w-64 h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <MobileSidebar 
              user={user}
              activeItem={activeNav} 
              onItemClick={(item) => {
                setActiveNav(item);
                setMobileSidebarOpen(false);
              }}
              onSignOut={onSignOut}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          activeItem={activeNav} 
          onItemClick={setActiveNav}
          onSignOut={onSignOut}
        />
      </div>
      
      {/* Main Content - Route to different views based on navigation */}
      {activeNav === 'tasks' ? (
        <>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Stats Bar */}
            <StatsBar tasks={tasks} />
            
            {/* Action Bar with Tag Filtering */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2A2A2A] gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleAddTask('new')}
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">New task</span>
                  <span className="xs:hidden">New</span>
                </button>
                
                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial">
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#F9FAFB] text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg focus:border-[#06B6D4] focus:outline-none flex-1 sm:flex-initial min-w-0"
                    >
                      <option value="">All tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>#{tag}</option>
                      ))}
                    </select>
                    <Filter size={12} className="text-[#9CA3AF] sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Kanban Board */}
            <div className="flex-1 p-3 sm:p-6 overflow-hidden min-h-0 min-w-0 flex flex-col">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-3 sm:gap-6 h-full overflow-x-auto overflow-y-hidden pb-4 min-w-max scroll-smooth touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {KANBAN_COLUMNS.map(column => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={filteredTasks.filter(task => task.status === column.id)}
                      onAddTask={handleAddTask}
                      onAssignAgent={setAssignmentTask}
                      onDelete={deleteTask}
                      onTaskClick={handleTaskClick}
                      agents={agents}
                    />
                  ))}
                  {/* Scroll indicator for mobile */}
                  <div className="flex-shrink-0 w-4 lg:w-0" />
                </div>
              </DragDropContext>
            </div>
          </div>
          
          {/* Activity Sidebar */}
          <ActivitySidebar tasks={tasks} />
        </>
      ) : activeNav === 'team' ? (
        <TeamOfficeView user={user} />
      ) : activeNav === 'calendar' ? (
        <CalendarView user={user} />
      ) : activeNav === 'projects' ? (
        <ProjectsView user={user} addNotification={addNotification} />
      ) : activeNav === 'approvals' ? (
        <ApprovalsView user={user} />
      ) : activeNav === 'settings' ? (
        <SettingsContent user={user} onSignOut={onSignOut} />
      ) : activeNav === 'agents' ? (
        // Original 3D Team View
        <TeamOfficeView user={user} />
      ) : activeNav === 'manage-agents' ? (
        <AgentManagementView 
          agents={agents}
          setAgents={setAgents}
          loadAgents={loadAgents}
          user={user}
          addNotification={addNotification}
        />
      ) : activeNav === 'analytics' ? (
        <AnalyticsDashboard user={user} />
      ) : (
        /* Fallback for any unmapped navigation items */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-[#6B7280]" />
            </div>
            <h2 className="text-[#F9FAFB] text-lg font-semibold mb-2">
              {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-4">
              This section is coming soon!
            </p>
            <button
              onClick={() => setActiveNav('tasks')}
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      )}

      {/* Custom Task Creation Modal */}
      <CustomModal
        isOpen={!!showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create New Task"
      >
        <TaskCreateForm 
          onSubmit={handleCreateTask}
          initialStatus={showTaskModal?.columnId}
          availableTags={allTags}
        />
      </CustomModal>

      {/* Agent Assignment Modal */}
      <AgentAssignmentModal
        isOpen={!!assignmentTask}
        onClose={() => setAssignmentTask(null)}
        task={assignmentTask}
        agents={agents}
        onAssign={assignTaskToAgent}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onSave={handleTaskUpdate}
        onDelete={deleteTask}
      />

      {/* Toast Notifications */}
      <ToastContainer 
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}