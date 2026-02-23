import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  LogOut, LayoutDashboard, Lightbulb, CheckSquare,
  FolderOpen, FileText, Clock, Settings,
  Search, Trash2, Send, Download, Eye,
  Bell, ChevronDown, Zap,
} from 'lucide-react';
import MissionControlDashboard from './MissionControlDashboard.jsx';
import apiClient from './services/api.js';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Dashboard', Icon: () => <LayoutDashboard size={15} strokeWidth={1.5} /> },
  { label: 'Settings',  Icon: () => <Settings        size={15} strokeWidth={1.5} /> },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', Icon: () => <LayoutDashboard size={15} strokeWidth={1.5} /> },
  { label: 'Settings',  Icon: () => <Settings        size={15} strokeWidth={1.5} /> },
];

// Task status mappings
const STATUS_MAPPINGS = {
  'backlog': 'Backlog',
  'new': 'New', 
  'in_progress': 'In Progress',
  'built': 'Built',
  'failed': 'Failed'
};

const STATUS_COLORS = {
  'backlog': '#4B5563',
  'new': '#06B6D4',
  'in_progress': '#F59E0B', 
  'built': '#10B981',
  'failed': '#EF4444'
};

/* ─── Utility Functions ──────────────────────────────────────────────────── */

function formatRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return time.toLocaleDateString();
}

/* ─── Components ─────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.backlog;
  const label = STATUS_MAPPINGS[status] || status;
  
  return (
    <span 
      className="text-[11px] font-medium rounded px-[7px] py-0.5 leading-4 inline-block border"
      style={{ 
        backgroundColor: status === 'built' ? color : 'transparent',
        color: status === 'built' ? '#fff' : color,
        borderColor: color 
      }}
    >
      {label}
    </span>
  );
}

function TaskCard({ task, isSelected, onClick, onStatusChange }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#111111] border rounded-lg p-3 sm:p-4 mb-2.5 cursor-pointer transition-colors duration-150 min-w-0 ${
        isSelected ? 'border-[#06B6D4]' : 'border-[#2A2A2A]'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] text-[10px] sm:text-[11px] rounded px-[6px] sm:px-[7px] py-0.5 leading-4 inline-flex items-center gap-1 flex-shrink-0">
            ✦ Task
          </span>
          <StatusBadge status={task.status} />
        </div>
        <span className="text-[#9CA3AF] text-[10px] sm:text-[11px] flex-shrink-0">
          {formatRelativeTime(task.created_at)}
        </span>
      </div>

      {/* Title */}
      <p className="text-[#F9FAFB] text-xs sm:text-[13px] leading-relaxed m-0 mb-2 break-words line-clamp-2">
        {task.title}
      </p>
      
      {/* Description if exists */}
      {task.description && (
        <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] leading-relaxed m-0 mb-2 line-clamp-2 break-words">
          {task.description}
        </p>
      )}

      {/* Actions for new tasks */}
      {task.status === 'new' && (
        <div className="flex justify-end mt-3">
          <button
            onClick={e => { 
              e.stopPropagation(); 
              onStatusChange(task.id, 'in_progress'); 
            }}
            className="bg-[#B45309] hover:bg-[#D97706] border-none text-white text-[12px] font-semibold rounded-md px-3.5 cursor-pointer flex items-center gap-1.5 transition-colors duration-150 select-none"
            style={{ paddingTop: 6, paddingBottom: 6, minHeight: 44, fontFamily: 'inherit' }}
          >
            ▶ Start Processing
          </button>
        </div>
      )}
    </div>
  );
}

function OpenClawOnboardingModal({ isOpen, onClose, onGoToSettings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-60" />

      {/* Modal */}
      <div className="relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 sm:p-8 w-full max-w-lg max-h-[90vh] flex flex-col min-w-0 my-auto overflow-hidden">
        <div className="text-center overflow-y-auto min-h-0 flex-1">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          
          {/* Title */}
          <h2 className="text-[#F9FAFB] text-xl font-bold mb-3">Welcome to Mission Control!</h2>
          
          {/* Description */}
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
            You're successfully authenticated! Now let's connect your OpenClaw instance 
            so you can start creating tasks that get processed automatically by AI agents.
          </p>
          
          {/* Features */}
          <div className="text-left bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4 mb-6">
            <h3 className="text-[#F9FAFB] text-sm font-semibold mb-3">What you can do:</h3>
            <ul className="space-y-2 text-[#9CA3AF] text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full" />
                Create tasks in plain English
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full" />
                AI agents process them automatically
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full" />
                Get results delivered back to you
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full" />
                Track progress in real-time
              </li>
            </ul>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-transparent border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-4 py-3 cursor-pointer hover:text-[#F9FAFB] hover:border-[#3A3A3A] transition-colors select-none"
              style={{ fontFamily: 'inherit' }}
            >
              Skip for now
            </button>
            
            <button
              onClick={() => {
                onGoToSettings();
                onClose();
              }}
              className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-sm font-semibold rounded-lg px-4 py-3 cursor-pointer transition-colors select-none"
              style={{ fontFamily: 'inherit' }}
            >
              Connect OpenClaw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority
      });
      
      setTitle('');
      setDescription('');
      setPriority('medium');
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-60" onClick={onClose} />

      {/* Modal */}
      <form onSubmit={handleSubmit} className="relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] flex flex-col gap-4 my-auto overflow-y-auto min-w-0">
        <h3 className="text-[#F9FAFB] text-lg font-semibold m-0">Create New Task</h3>
        
        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
            style={{ fontFamily: 'inherit' }}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Additional details (optional)"
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm resize-none outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
            style={{ fontFamily: 'inherit', minHeight: 80 }}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="text-[#9CA3AF] text-sm block mb-2">Priority</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-sm outline-none focus:border-[#06B6D4] transition-colors"
            style={{ fontFamily: 'inherit' }}
            disabled={isSubmitting}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-4 py-2 cursor-pointer hover:text-[#F9FAFB] hover:border-[#3A3A3A] transition-colors select-none"
            style={{ fontFamily: 'inherit' }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors select-none disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsPanel({ user, onSignOut }) {
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
      toast.error('Please enter an OpenClaw endpoint first');
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
      toast.error('Please enter an OpenClaw endpoint');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.saveOpenClawConfig(
        openClawConfig.endpoint,
        openClawConfig.token || null
      );
      toast.success('OpenClaw configuration saved');
      setTestResult(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-3 sm:p-4 min-w-0">
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
                disabled={isSaving || !openClawConfig.endpoint}
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

export default function Dashboard({ user, onSignOut }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks();
    // Check if user needs OpenClaw onboarding
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      const config = await apiClient.getOpenClawConfig();
      if (!config.connected && tasks.length === 0) {
        // New user without OpenClaw - show onboarding
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  }

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(taskData) {
    const response = await apiClient.createTask(taskData);
    if (response.task) {
      setTasks(prev => [response.task, ...prev]);
    }
  }

  async function updateTaskStatus(taskId, newStatus) {
    try {
      const response = await apiClient.updateTaskStatus(taskId, newStatus);
      if (response.task) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? response.task : t
        ));
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(error?.message || 'Failed to update task');
    }
  }

  if (activeNav === 'Settings') {
    return (
      <div className="h-screen bg-[#0A0A0A] font-inter flex flex-col overflow-hidden min-w-0">
        <div className="h-1 bg-[#F97316] flex-shrink-0" />
        <SettingsPanel user={user} onSignOut={onSignOut} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] font-inter flex flex-col overflow-hidden min-w-0">
      <div className="h-1 bg-[#F97316] flex-shrink-0" />
      
      {/* Top Bar */}
      <div className="h-12 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-3 sm:px-4 flex-shrink-0 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#F9FAFB] text-sm font-semibold truncate">Mission Control</span>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-xs sm:text-sm font-semibold rounded-md px-3 sm:px-4 py-2 cursor-pointer transition-colors select-none flex-shrink-0"
          style={{ fontFamily: 'inherit' }}
        >
          + New Task
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        {/* Mission Control Dashboard */}
        <div className="flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col">
          {activeNav === 'Dashboard' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <MissionControlDashboard tasks={tasks} />
              </div>
              
              {/* Task List */}
              <div className="h-64 border-t border-[#2A2A2A] bg-[#0F0F0F] overflow-y-auto overflow-x-hidden min-h-0">
                <div className="p-3 sm:p-4 min-w-0">
                  <h3 className="text-[#F9FAFB] text-base sm:text-lg font-semibold mb-4 m-0">Recent Tasks</h3>
                  
                  {loading ? (
                    <div className="text-[#9CA3AF] text-sm">Loading tasks...</div>
                  ) : error ? (
                    <div className="text-[#EF4444] text-sm break-words">Error: {error}</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-[#6B7280] text-sm">
                      No tasks yet. Create your first task to get started!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {tasks.slice(0, 6).map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTask?.id === task.id}
                          onClick={() => setSelectedTask(task)}
                          onStatusChange={updateTaskStatus}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <SettingsPanel user={user} onSignOut={onSignOut} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="h-14 sm:h-16 bg-[#111111] border-t border-[#2A2A2A] flex items-center justify-around flex-shrink-0 min-w-0">
        {BOTTOM_NAV_ITEMS.map(({ label, Icon }) => {
          const isActive = activeNav === label;
          return (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 sm:gap-1 cursor-pointer bg-transparent border-none select-none min-w-0 flex-1 px-2 ${
                isActive ? 'text-[#06B6D4]' : 'text-[#9CA3AF]'
              }`}
              style={{ fontFamily: 'inherit' }}
            >
              <Icon />
              <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={createTask}
      />
      
      <OpenClawOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onGoToSettings={() => setActiveNav('Settings')}
      />
    </div>
  );
}