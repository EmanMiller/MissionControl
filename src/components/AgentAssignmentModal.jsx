import { useState, useEffect } from 'react';
import { X, User, Zap } from 'lucide-react';
import apiClient from '../services/api.js';

function AgentAssignmentModal({ isOpen, onClose, task, agents, onAssign }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedAgent(task?.assigned_agent_id || '');
    }
  }, [isOpen, task]);

  const handleAssign = async () => {
    if (!selectedAgent || !task) return;
    
    try {
      setLoading(true);
      await onAssign(task.id, selectedAgent);
      onClose();
    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      await onAssign(task.id, null);
      onClose();
    } catch (error) {
      console.error('Unassignment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableAgents = agents.filter(agent => 
    agent.status === 'idle' || agent.id === task?.assigned_agent_id
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#F9FAFB] text-lg font-semibold">Assign Agent</h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {task && (
          <div className="mb-6">
            <h4 className="text-[#F9FAFB] font-medium mb-2">{task.title}</h4>
            <p className="text-[#9CA3AF] text-sm">{task.description}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Current Assignment */}
          {task?.assigned_agent_id && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#06B6D4] rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[#F9FAFB] text-sm font-medium">Currently assigned</p>
                    <p className="text-[#9CA3AF] text-xs">
                      {agents.find(a => a.id === task.assigned_agent_id)?.name || 'Unknown Agent'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUnassign}
                  disabled={loading}
                  className="text-[#EF4444] hover:text-[#DC2626] text-sm font-medium disabled:opacity-50"
                >
                  Unassign
                </button>
              </div>
            </div>
          )}

          {/* Agent Selection */}
          <div>
            <label className="block text-[#9CA3AF] text-sm font-medium mb-3">
              Select Agent
            </label>
            {availableAgents.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 text-center">
                <Zap size={24} className="text-[#6B7280] mx-auto mb-2" />
                <p className="text-[#9CA3AF] text-sm">No idle agents available</p>
                <p className="text-[#6B7280] text-xs mt-1">Create new agents or wait for current tasks to complete</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableAgents.map(agent => (
                  <label
                    key={agent.id}
                    className={`block cursor-pointer p-3 rounded-lg border transition-colors ${
                      selectedAgent === agent.id
                        ? 'border-[#06B6D4] bg-[#06B6D4]/10'
                        : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#06B6D4]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="agent"
                        value={agent.id}
                        checked={selectedAgent === agent.id}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-3 h-3 rounded-full ${
                        agent.status === 'idle' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                      }`} />
                      <div className="flex-1">
                        <p className="text-[#F9FAFB] text-sm font-medium">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[#9CA3AF] text-xs capitalize">{agent.type}</span>
                          <span className="text-[#6B7280] text-xs">•</span>
                          <span className={`text-xs capitalize ${
                            agent.status === 'idle' ? 'text-[#10B981]' : 'text-[#F59E0B]'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      {agent.performance_stats?.successRate && (
                        <div className="text-right">
                          <p className="text-[#F9FAFB] text-sm font-medium">
                            {agent.performance_stats.successRate}%
                          </p>
                          <p className="text-[#6B7280] text-xs">success rate</p>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-[#2A2A2A] text-[#9CA3AF] px-4 py-2 rounded-lg font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedAgent}
            className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-[#6B7280] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Assign Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgentAssignmentModal;