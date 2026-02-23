import { useState, useEffect } from 'react';
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

/* ─── Sidebar Navigation ────────────────────────────────────────────────── */

const NAVIGATION_ITEMS = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, active: true },
  { id: 'team', label: 'Team', icon: Users },
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
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

/* ─── Components ─────────────────────────────────────────────────────────── */

function CustomModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <h3 className="text-[#F9FAFB] font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function TeamOfficeView({ user }) {
  const agents = [
    { id: 1, name: 'Marcus', role: 'COO Agent', status: 'active', color: 0x06B6D4 },
    { id: 2, name: 'Alex', role: 'Dev Agent', status: 'active', color: 0x8B5CF6 },
    { id: 3, name: 'Emma', role: 'Research Agent', status: 'idle', color: 0x10B981 }
  ];

  return (
    <div className="flex-1 p-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2">Team</h2>
          <p className="text-[#9CA3AF] text-sm">Your AI agents and their current status</p>
        </div>

        {/* 3D Voxel Office Scene */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
          <VoxelOffice3D user={user} agents={agents} />
          
          {/* Character Name Labels */}
          <div className="mt-4 flex justify-center gap-8 text-xs text-[#9CA3AF]">
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
                <p className="text-[#9CA3AF] text-sm">{agent.role}</p>
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
      // For now, show placeholder events
      const mockEvents = [
        {
          id: 1,
          title: 'Weekly Task Review',
          time: '9:00 AM',
          duration: '30 min',
          type: 'agent',
          status: 'upcoming'
        },
        {
          id: 2,
          title: 'Process Calculator Project',
          time: '10:30 AM',
          duration: '2 hours',
          type: 'task',
          status: 'in_progress'
        },
        {
          id: 3,
          title: 'System Health Check',
          time: '2:00 PM',
          duration: '15 min',
          type: 'maintenance',
          status: 'scheduled'
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2">Calendar</h2>
              <p className="text-[#9CA3AF] text-sm">OpenClaw agent schedule and planned tasks</p>
            </div>
            <button
              onClick={loadCalendarEvents}
              className="flex items-center gap-2 bg-[#374151] hover:bg-[#4B5563] text-white px-3 py-2 rounded-lg text-sm transition-colors"
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
                    <div key={event.id} className="flex items-center gap-4 p-3 bg-[#1A1A1A] rounded-lg">
                      <div className="text-[#06B6D4] text-sm font-medium min-w-16">
                        {event.time}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#F9FAFB] font-medium">{event.title}</h4>
                        <p className="text-[#9CA3AF] text-sm">{event.duration}</p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
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

function ProjectsView({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      // TODO: Add projects API endpoint
      // For now, show placeholder projects
      const mockProjects = [
        {
          id: 1,
          name: 'Mission Control Dashboard',
          description: 'Professional kanban interface for task management',
          status: 'active',
          progress: 85,
          tasks: 12,
          completedTasks: 10
        },
        {
          id: 2,
          name: 'OpenClaw Integration',
          description: 'Connect with OpenClaw agents for automated task processing',
          status: 'planning',
          progress: 25,
          tasks: 8,
          completedTasks: 2
        }
      ];
      
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2">Projects</h2>
          <p className="text-[#9CA3AF] text-sm">Manage your active projects and initiatives</p>
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
            <button className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 hover:border-[#06B6D4]/50 transition-colors cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[#F9FAFB] font-semibold text-lg">{project.name}</h3>
                    <p className="text-[#9CA3AF] text-sm mt-1">{project.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    project.status === 'active' ? 'bg-[#10B981]/20 text-[#10B981]' :
                    project.status === 'planning' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                    'bg-[#6B7280]/20 text-[#6B7280]'
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                    <span>{project.completedTasks}/{project.tasks} tasks</span>
                    <span>•</span>
                    <span>{project.progress}% complete</span>
                  </div>
                  
                  <div className="w-32 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#06B6D4] transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
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
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[#9CA3AF] text-xs">Status</label>
                <p className="text-[#F9FAFB] capitalize">{selectedProject.status}</p>
              </div>
              <div>
                <label className="text-[#9CA3AF] text-xs">Progress</label>
                <p className="text-[#F9FAFB]">{selectedProject.progress}%</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
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
    <div className="flex-1 p-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2">Approvals</h2>
          <p className="text-[#9CA3AF] text-sm">Review and approve agent actions and requests</p>
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
              <div key={approval.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[#F9FAFB] font-semibold">{approval.title}</h3>
                    <p className="text-[#9CA3AF] text-sm mt-1">{approval.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#6B7280]">
                      <span>Requested by {approval.agent}</span>
                      <span>•</span>
                      <span>{approval.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
    <div className="w-60 bg-[#111111] border-r border-[#2A2A2A] flex flex-col">
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
      <div className="p-3 border-t border-[#2A2A2A]">
        <button
          onClick={() => onItemClick('settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F1F1F] transition-colors"
        >
          <Settings size={16} />
          Settings
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
    <div className="flex items-center gap-8 px-6 py-4 border-b border-[#2A2A2A]">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-[#10B981]">{thisWeek}</span>
        <span className="text-[#9CA3AF] text-sm">This week</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-[#F59E0B]">{inProgress}</span>
        <span className="text-[#9CA3AF] text-sm">In progress</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-[#06B6D4]">{total}</span>
        <span className="text-[#9CA3AF] text-sm">Total</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-[#8B5CF6]">{completion}%</span>
        <span className="text-[#9CA3AF] text-sm">Completion</span>
      </div>
    </div>
  );
}

function TaskCard({ task, index }) {
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
          className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 hover:border-[#3A3A3A] ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
        >
          {/* Task Title */}
          <h3 className="text-[#F9FAFB] font-medium text-sm mb-2 leading-tight">
            {task.title}
          </h3>
          
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
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ column, tasks, onAddTask }) {
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
            className={`min-h-64 transition-colors rounded-lg ${
              snapshot.isDraggingOver ? 'bg-[#0A0A0A] border border-[#06B6D4]' : ''
            }`}
          >
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-[#6B7280] text-sm">No tasks</span>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
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
    <div className="hidden lg:block w-80 bg-[#111111] border-l border-[#2A2A2A] p-4">
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
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOpenClawConfig();
  }, []);

  async function loadOpenClawConfig() {
    try {
      const config = await apiClient.getOpenClawConfig();
      setOpenClawConfig({
        endpoint: config.endpoint || '',
        token: config.token === '***CONFIGURED***' ? '' : (config.token || '')
      });
    } catch (error) {
      console.error('Failed to load OpenClaw config:', error);
    }
  }

  async function testConnection() {
    if (!openClawConfig.endpoint) {
      alert('Please enter an OpenClaw endpoint first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await apiClient.testOpenClawConnection(
        openClawConfig.endpoint, 
        openClawConfig.token || null
      );
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  }

  async function saveConfig() {
    if (!openClawConfig.endpoint) {
      alert('Please enter an OpenClaw endpoint');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.saveOpenClawConfig(
        openClawConfig.endpoint,
        openClawConfig.token || null
      );
      alert('OpenClaw configuration saved successfully!');
      setTestResult(null);
    } catch (error) {
      alert('Failed to save configuration: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-[#F9FAFB] text-xl font-semibold mb-2 m-0">Settings</h2>
          <p className="text-[#9CA3AF] text-sm m-0">Configure your Mission Control system</p>
        </div>

        {/* OpenClaw Configuration */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">OpenClaw Integration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[#9CA3AF] text-sm block mb-2">
                OpenClaw Endpoint *
              </label>
              <input
                type="url"
                value={openClawConfig.endpoint}
                onChange={e => setOpenClawConfig({...openClawConfig, endpoint: e.target.value})}
                placeholder="http://localhost:18789"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
                style={{ fontFamily: 'inherit' }}
              />
              <p className="text-[#6B7280] text-xs mt-1 m-0">
                URL of your OpenClaw instance (e.g., http://localhost:18789)
              </p>
            </div>

            <div>
              <label className="text-[#9CA3AF] text-sm block mb-2">
                Authentication Token (Optional)
              </label>
              <input
                type="password"
                value={openClawConfig.token}
                onChange={e => setOpenClawConfig({...openClawConfig, token: e.target.value})}
                placeholder="Optional authentication token"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={isTesting || !openClawConfig.endpoint}
                className="bg-[#374151] hover:bg-[#4B5563] border-none text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 select-none"
                style={{ fontFamily: 'inherit' }}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                onClick={saveConfig}
                disabled={isSaving || !openClawConfig.endpoint}
                className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 select-none"
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
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">Profile</h3>
          
          <div className="flex items-center gap-4 mb-4">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="text-[#F9FAFB] font-medium">{user.name}</div>
              <div className="text-[#9CA3AF] text-sm">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
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
    status: initialStatus || 'backlog',
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

      <div className="grid grid-cols-3 gap-4">
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
            <option value="backlog">Backlog</option>
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

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setFormData({ title: '', description: '', priority: 'medium', status: initialStatus || 'backlog', tags: '' })}
          className="px-4 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
        >
          Clear
        </button>
        <button
          type="submit"
          className="bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}

/* ─── Mobile Sidebar Component ──────────────────────────────────────────── */

function MobileSidebar({ activeItem, onItemClick, onSignOut, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <span className="text-[#F9FAFB] font-semibold">Mission Control</span>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2">
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
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* User Section */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[#F9FAFB] text-sm font-medium truncate">{user.name}</div>
            <div className="text-[#6B7280] text-xs truncate">{user.email}</div>
          </div>
        </div>
        
        <button
          onClick={() => onItemClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-2 ${
            activeItem === 'settings'
              ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' 
              : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1A1A1A]'
          }`}
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </button>
        
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
        >
          <User size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function KanbanDashboard({ user, onSignOut }) {
  const [tasks, setTasks] = useState([]);
  const [activeNav, setActiveNav] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

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

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      await apiClient.updateTaskStatus(parseInt(draggableId), destination.droppableId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id.toString() === draggableId 
            ? { ...task, status: destination.droppableId }
            : task
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  async function createTask(taskData) {
    try {
      addNotification({
        type: 'info',
        title: 'Creating task...',
        message: 'Sending task to OpenClaw for processing'
      });

      const response = await apiClient.createTask(taskData);
      if (response.task) {
        setTasks(prev => [response.task, ...prev]);
        setShowTaskModal(false);
        
        addNotification({
          type: 'success',
          title: '✅ Task created successfully!',
          message: `"${taskData.title}" has been sent to OpenClaw and will be processed automatically.`
        });

        // If task has OpenClaw integration, show additional notification
        if (response.openclaw_session_id || taskData.status === 'new') {
          setTimeout(() => {
            addNotification({
              type: 'info',
              title: '🤖 OpenClaw is working',
              message: `Your task "${taskData.title}" is being processed by AI agents.`,
              duration: 8000
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      addNotification({
        type: 'error',
        title: 'Failed to create task',
        message: error.message || 'Something went wrong. Please try again.'
      });
    }
  }

  function handleAddTask(columnId) {
    setShowTaskModal({ columnId });
  }

  function handleCreateTask(formData) {
    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status || 'backlog',
      priority: formData.priority || 'medium',
      tags: formData.tags,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
    };

    createTask(taskData);
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
    <div className="h-screen bg-[#0A0A0A] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#111111] border-b border-[#2A2A2A] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <span className="text-[#F9FAFB] font-semibold">Mission Control</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      {/* Mobile Navigation Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="bg-[#111111] border-r border-[#2A2A2A] w-64 h-full" onClick={(e) => e.stopPropagation()}>
            <MobileSidebar 
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
          <div className="flex-1 flex flex-col">
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
            <div className="flex-1 p-3 sm:p-6 overflow-hidden">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-3 sm:gap-6 h-full overflow-x-auto kanban-scroll pb-4 pr-4">
                  {KANBAN_COLUMNS.map(column => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={filteredTasks.filter(task => task.status === column.id)}
                      onAddTask={handleAddTask}
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
        <ProjectsView user={user} />
      ) : activeNav === 'approvals' ? (
        <ApprovalsView user={user} />
      ) : activeNav === 'settings' ? (
        <SettingsContent user={user} onSignOut={onSignOut} />
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

      {/* Toast Notifications */}
      <ToastContainer 
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}