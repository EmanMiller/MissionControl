import { useState, useEffect, useRef } from 'react';
import {
  LogOut, LayoutDashboard, Lightbulb, CheckSquare,
  FolderOpen, FileText, Clock, Settings,
  Search, Trash2, Send, Download, Eye,
  Bell, ChevronDown,
} from 'lucide-react';
import OnboardingFlow from './OnboardingFlow.jsx';
import MissionControlDashboard from './MissionControlDashboard.jsx';

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function IcoMenu() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function IcoGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="4.5" height="4.5" rx="0.75" />
      <rect x="8.5" y="1" width="4.5" height="4.5" rx="0.75" />
      <rect x="1" y="8.5" width="4.5" height="4.5" rx="0.75" />
      <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="0.75" />
    </svg>
  );
}

function IcoSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

function IcoPause() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
      <rect x="0" y="0" width="3.5" height="12" rx="1" />
      <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function IcoRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.38-3.65" />
      <polyline points="13.5,2.5 13.5,6.5 9.5,6.5" />
    </svg>
  );
}

function IcoArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="9" x2="5" y2="1" />
      <polyline points="2,4 5,1 8,4" />
    </svg>
  );
}

function IcoChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,3 5,8 10,13" />
    </svg>
  );
}



/* ─── Data ───────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Dashboard', Icon: () => <LayoutDashboard size={15} strokeWidth={1.5} /> },
  { label: 'Ideas',     Icon: () => <Lightbulb       size={15} strokeWidth={1.5} /> },
  { label: 'Approvals', Icon: () => <CheckSquare     size={15} strokeWidth={1.5} /> },
  { label: 'Projects',  Icon: () => <FolderOpen      size={15} strokeWidth={1.5} /> },
  { label: 'Outputs',   Icon: () => <FileText        size={15} strokeWidth={1.5} /> },
  { label: 'History',   Icon: () => <Clock           size={15} strokeWidth={1.5} /> },
  { label: 'Settings',  Icon: () => <Settings        size={15} strokeWidth={1.5} /> },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', Icon: () => <LayoutDashboard size={15} strokeWidth={1.5} /> },
  { label: 'Ideas',     Icon: () => <Lightbulb       size={15} strokeWidth={1.5} /> },
  { label: 'Approvals', Icon: () => <CheckSquare     size={15} strokeWidth={1.5} /> },
  { label: 'Outputs',   Icon: () => <FileText        size={15} strokeWidth={1.5} /> },
  { label: 'Settings',  Icon: () => <Settings        size={15} strokeWidth={1.5} /> },
];

const INITIAL_TASKS = [
  {
    id: 1,
    status: 'Backlog',
    time: 'Feb 20, 11:05 AM',
    text: "Make it so that I can access the content ideas from the content coach. so i can ask questions and content coach can go through all my saved ideas",
  },
  {
    id: 2,
    status: 'New',
    time: 'Feb 20, 10:24 AM',
    text: "have voice transcription in the brain dump so i can hit a button and start talking into my microphone",
  },
  {
    id: 3,
    status: 'Built',
    time: 'Feb 20, 10:23 AM',
    text: "Add a tab to 'History' that lets me see all of my content ideas from 'compose ideas'",
  },
  {
    id: 4,
    status: 'Backlog',
    time: 'Feb 20, 9:38 AM',
    text: "I want to be able to see the make me a banger history",
  },
];

// Which columns a user is allowed to drag INTO.
// Anything not listed = AI-only, no user drag allowed.
const ALLOWED_DROPS = {
  'Backlog': ['New'],           // user promotes from backlog → queue
  'New':     ['In Progress'],   // user kicks off the AI
};

const COLUMNS = [
  { id: 'Backlog',     label: 'Backlog',      color: '#4B5563', hint: 'Drag to New when ready' },
  { id: 'New',         label: 'New',          color: '#06B6D4', hint: 'Drag to In Progress to start AI' },
  { id: 'In Progress', label: 'In Progress',  color: '#F97316', hint: 'AI is working on this' },
  { id: 'Built',       label: 'Built',        color: '#10B981', hint: 'Done' },
];

const LOG_ENTRIES = [
  { time: '10:43:20 AM', emoji: '🟢', type: 'normal',   text: 'Created branch: ai/feedback-history-tab' },
  { time: '10:43:21 AM', emoji: '🔵', type: 'normal',   text: 'Codex analyzed codebase and planned implementation' },
  { time: '10:43:21 AM', emoji: '⬜', type: 'modified', text: '' },
  { time: '10:43:21 AM', emoji: '⬜', type: 'normal',   text: 'Committed: 2184311 — AI: Add Compose Ideas tab to History' },
  { time: '10:43:21 AM', emoji: '✅', type: 'complete', text: '' },
];

/* ─── Primitives ─────────────────────────────────────────────────────────── */

function Pill({ children }) {
  return (
    <span className="inline-block bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-[11px] text-[#9CA3AF]">
      {children}
    </span>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-transparent border-none text-[#9CA3AF] cursor-pointer flex items-center justify-center rounded select-none"
      style={{ padding: 5, minHeight: 44, minWidth: 44 }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  if (status === 'Built') return (
    <span className="bg-[#10B981] text-white text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">Built</span>
  );
  if (status === 'In Progress') return (
    <span className="bg-transparent border border-[#F97316] text-[#F97316] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">In Progress</span>
  );
  if (status === 'Backlog') return (
    <span className="bg-transparent border border-[#4B5563] text-[#9CA3AF] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">Backlog</span>
  );
  return (
    <span className="bg-transparent border border-[#06B6D4] text-[#06B6D4] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">New</span>
  );
}

function LogEntry({ entry }) {
  if (entry.type === 'modified') {
    return (
      <div className="flex gap-2 mb-[3px] flex-nowrap">
        <span className="text-[#9CA3AF] whitespace-nowrap shrink-0">{entry.time}</span>
        <span className="shrink-0">{entry.emoji}</span>
        <span>
          <span className="text-[#9CA3AF]">Modified: </span>
          <span className="text-[#06B6D4]">components/History.tsx</span>
          <span className="text-[#9CA3AF]"> (+316 -174 lines)</span>
        </span>
      </div>
    );
  }
  if (entry.type === 'complete') {
    return (
      <div className="flex gap-2 mb-[3px] flex-nowrap">
        <span className="text-[#9CA3AF] whitespace-nowrap shrink-0">{entry.time}</span>
        <span className="shrink-0">{entry.emoji}</span>
        <span>
          <span className="text-[#06B6D4]">Build complete!</span>
          <span className="text-[#9CA3AF]"> Branch: </span>
          <span className="text-[#06B6D4]">ai/feedback-history-tab</span>
          <span className="text-[#9CA3AF]"> — ready for testing</span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex gap-2 mb-[3px] flex-nowrap">
      <span className="text-[#9CA3AF] whitespace-nowrap shrink-0">{entry.time}</span>
      <span className="shrink-0">{entry.emoji}</span>
      <span className="text-[#9CA3AF]">{entry.text}</span>
    </div>
  );
}

/* ─── TopBar ─────────────────────────────────────────────────────────────── */

function TopBar({ mobileView, selectedTask, onBack, onHamburger, onAddTask }) {
  return (
    <div className="h-12 shrink-0 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-3.5 select-none">

      {/* ── Mobile header ── */}
      <div className="flex lg:hidden items-center w-full">
        {mobileView === 'detail' ? (
          <>
            <GhostBtn onClick={onBack}><IcoChevronLeft /></GhostBtn>
            <span className="text-[#F9FAFB] text-sm font-medium truncate flex-1 px-1">
              {selectedTask
                ? selectedTask.text.slice(0, 42) + (selectedTask.text.length > 42 ? '…' : '')
                : ''}
            </span>
            <div style={{ width: 44, height: 44, flexShrink: 0 }} />
          </>
        ) : (
          <>
            <GhostBtn onClick={onHamburger}><IcoMenu /></GhostBtn>
            <span className="text-[#F9FAFB] text-sm font-medium flex-1 text-center">
              Mission Control
            </span>
            <GhostBtn onClick={onAddTask}>
              <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
            </GhostBtn>
          </>
        )}
      </div>

      {/* ── Desktop left ── */}
      <div className="hidden lg:flex items-center gap-2">
        <GhostBtn><IcoMenu /></GhostBtn>
        <GhostBtn><IcoGrid /></GhostBtn>
        <span className="text-[#F9FAFB] text-sm font-medium ml-0.5">Mission Control</span>
      </div>

      {/* ── Desktop right ── */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-full py-[5px] px-3 flex items-center gap-1.5 cursor-pointer text-[#9CA3AF] text-[13px] select-none"
          style={{ fontFamily: 'inherit' }}
        >
          <IcoSearch />
          <span>Search</span>
          <kbd className="bg-[#252525] rounded text-[11px] text-[#6B7280] px-1.5 leading-4" style={{ fontFamily: 'inherit' }}>⌘K</kbd>
        </button>
        <button
          className="bg-transparent border-none text-[#9CA3AF] text-[13px] cursor-pointer flex items-center gap-1.5 px-2 py-1.5 select-none"
          style={{ fontFamily: 'inherit' }}
        >
          <IcoPause /> Pause
        </button>
        <button
          className="bg-transparent border-none text-[#9CA3AF] text-[13px] cursor-pointer px-2 py-1.5 select-none"
          style={{ fontFamily: 'inherit' }}
        >
          Ping Henry
        </button>
        <GhostBtn><IcoRefresh /></GhostBtn>
      </div>
    </div>
  );
}

/* ─── SidebarContent (shared between desktop column + mobile drawer) ─────── */

function SidebarContent({ activeNav, setActiveNav, onClose, onSignOut }) {
  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] overflow-hidden">
      {/* Nav items */}
      <div className="flex-1 pt-2 overflow-y-auto scroll-touch">
        {NAV_ITEMS.map(({ label, Icon }) => {
          const isActive = activeNav === label;
          return (
            <div
              key={label}
              onClick={() => { setActiveNav(label); onClose?.(); }}
              className={`flex items-center gap-2.5 h-9 px-4 cursor-pointer text-[13px] border-l-2 transition-colors duration-100 select-none ${
                isActive
                  ? 'text-[#F9FAFB] border-[#06B6D4]'
                  : 'text-[#9CA3AF] border-transparent hover:text-[#F9FAFB]'
              }`}
            >
              <Icon />
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Sign out */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid #1A1A1A' }}>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2.5 w-full cursor-pointer bg-transparent border-none select-none transition-colors duration-100"
          style={{ color: '#4B5563', fontSize: 13, fontFamily: 'inherit', minHeight: 36, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>

      {/* Avatar / silhouette */}
      <div className="h-[148px] shrink-0 relative overflow-hidden bg-[#0E0E0E]">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)' }}
        />
        <svg
          viewBox="0 0 220 148"
          width="220"
          height="148"
          className="absolute inset-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="110" cy="200" rx="70" ry="60" fill="#1C1C1C" />
          <circle cx="110" cy="80" r="28" fill="#1C1C1C" />
          <ellipse cx="110" cy="80" rx="32" ry="32" fill="url(#glowgrad)" />
          <defs>
            <radialGradient id="glowgrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2A2A2A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        <div
          className="absolute bottom-0 left-0 right-0 h-[60px]"
          style={{ background: 'linear-gradient(to bottom, transparent, #0F0F0F)' }}
        />
      </div>
    </div>
  );
}

/* ─── LeftSidebar (desktop only) ─────────────────────────────────────────── */

function LeftSidebar({ activeNav, setActiveNav, onSignOut }) {
  return (
    <div className="hidden lg:flex w-[220px] shrink-0 border-r border-[#2A2A2A] flex-col">
      <SidebarContent activeNav={activeNav} setActiveNav={setActiveNav} onSignOut={onSignOut} />
    </div>
  );
}

/* ─── Drawer (mobile only) ───────────────────────────────────────────────── */

function Drawer({ isOpen, activeNav, setActiveNav, onClose, onSignOut }) {
  return (
    <div className="lg:hidden">
      {/* Dimmed backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-200 ${
          isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-[220px] transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent activeNav={activeNav} setActiveNav={setActiveNav} onClose={onClose} onSignOut={onSignOut} />
      </div>
    </div>
  );
}

/* ─── TaskCard (mobile list) ─────────────────────────────────────────────── */

function TaskCard({ task, isSelected, onClick, onBuildThis }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#111111] border rounded-lg p-4 mb-2.5 cursor-pointer transition-colors duration-150 ${
        isSelected ? 'border-[#06B6D4]' : 'border-[#2A2A2A]'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-flex items-center gap-1">
            ✦ Feature
          </span>
          <StatusBadge status={task.status} />
        </div>
        <span className="text-[#9CA3AF] text-[11px]">{task.time}</span>
      </div>

      {/* Request text */}
      <p className={`text-[#F9FAFB] text-[13px] leading-relaxed m-0 ${task.status === 'New' ? 'mb-3' : ''}`}>
        {task.text}
      </p>

      {/* Build This CTA (New tasks only) */}
      {task.status === 'New' && (
        <div className="flex justify-end">
          <button
            onClick={e => { e.stopPropagation(); onBuildThis?.(task.id); }}
            className="bg-[#B45309] hover:bg-[#D97706] border-none text-white text-[12px] font-semibold rounded-md px-3.5 cursor-pointer flex items-center gap-1.5 transition-colors duration-150 select-none"
            style={{ paddingTop: 6, paddingBottom: 6, minHeight: 44, fontFamily: 'inherit' }}
          >
            <IcoArrowUp /> Build This
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── CenterPanel (mobile task list) ─────────────────────────────────────── */

function CenterPanel({ tasks, selected, onTaskClick, onBuildThis }) {
  return (
    <>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={selected === task.id}
          onClick={() => onTaskClick(task.id)}
          onBuildThis={onBuildThis}
        />
      ))}
    </>
  );
}

/* ─── KanbanCard ─────────────────────────────────────────────────────────── */

function KanbanCard({ task, isSelected, onClick, isDragging, onDragStart, onDragEnd }) {
  const isDraggable = !!ALLOWED_DROPS[task.status];

  return (
    <div
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('taskId', String(task.id));
        e.dataTransfer.setData('fromStatus', task.status);
        // slight delay so the ghost image renders before opacity drops
        setTimeout(() => onDragStart?.({ taskId: task.id, fromStatus: task.status }), 0);
      }}
      onDragEnd={onDragEnd}
      className="bg-[#111111] border rounded-lg p-3 transition-all duration-150 select-none"
      style={{
        borderColor: isSelected ? '#06B6D4' : '#2A2A2A',
        borderLeftWidth: isSelected ? 3 : 1,
        cursor: isDraggable ? 'grab' : 'pointer',
        opacity: isDragging ? 0.35 : 1,
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <p
        className="text-[#F9FAFB] text-[12px] leading-relaxed m-0 mb-2"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {task.text}
      </p>
      <div className="flex items-center justify-between">
        <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] text-[10px] rounded px-[6px] py-0.5 inline-flex items-center gap-1">
          ✦ Feature
        </span>
        <span className="text-[#9CA3AF] text-[10px]">{task.time}</span>
      </div>
      {isDraggable && (
        <p className="text-[#4B5563] text-[10px] m-0 mt-1.5">
          {COLUMNS.find(c => c.id === task.status)?.hint}
        </p>
      )}
    </div>
  );
}

/* ─── KanbanColumn ───────────────────────────────────────────────────────── */

function KanbanColumn({ column, tasks, selected, onTaskClick, dragInfo, onDropTask, onDragStart, onDragEnd }) {
  const [isOver, setIsOver] = useState(false);
  const isValidTarget = dragInfo && ALLOWED_DROPS[dragInfo.fromStatus]?.includes(column.id);

  return (
    <div
      className="w-[240px] shrink-0 flex flex-col min-h-0"
      onDragOver={e => {
        if (!isValidTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOver(true);
      }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false);
      }}
      onDrop={e => {
        if (!isValidTarget) return;
        e.preventDefault();
        setIsOver(false);
        onDropTask?.(Number(e.dataTransfer.getData('taskId')), column.id);
      }}
    >
      {/* Colored top accent */}
      <div
        className="h-[3px] rounded-t transition-all duration-150"
        style={{
          backgroundColor: isOver ? '#06B6D4' : column.color,
          boxShadow: isOver ? '0 0 10px rgba(6,182,212,0.5)' : 'none',
        }}
      />

      {/* Column header */}
      <div
        className="border border-t-0 px-3 py-2 flex items-center justify-between mb-2 transition-colors duration-150"
        style={{
          background: isOver ? 'rgba(6,182,212,0.06)' : '#111111',
          borderColor: isOver ? '#06B6D4' : '#2A2A2A',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[#F9FAFB] text-[12px] font-semibold">{column.label}</span>
          {isValidTarget && !isOver && (
            <span className="text-[#06B6D4] text-[10px]">← drop here</span>
          )}
        </div>
        <span
          className="text-[#9CA3AF] text-[11px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full flex items-center justify-center"
          style={{ minWidth: 20, height: 20, paddingLeft: 5, paddingRight: 5 }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Card list — drop zone */}
      <div
        className="flex flex-col gap-2 overflow-y-auto flex-1 scroll-touch pb-2 rounded-lg transition-all duration-150"
        style={{
          outline: isOver ? '2px dashed rgba(6,182,212,0.45)' : '2px dashed transparent',
          outlineOffset: 3,
        }}
      >
        {tasks.length === 0 ? (
          <div
            className="border border-dashed rounded-lg text-[11px] text-center py-8 transition-colors duration-150"
            style={{
              borderColor: isOver ? '#06B6D4' : '#2A2A2A',
              color: isOver ? '#06B6D4' : '#4B5563',
            }}
          >
            {isOver ? '↓ Release to move here' : 'No tasks'}
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              isSelected={selected === task.id}
              onClick={() => onTaskClick(task.id)}
              isDragging={dragInfo?.taskId === task.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── KanbanBoard (desktop only) ─────────────────────────────────────────── */

function KanbanBoard({ tasks, selected, onTaskClick, onAddTask, onMoveTask }) {
  const [dragInfo, setDragInfo] = useState(null); // { taskId, fromStatus } | null

  return (
    <div
      className="hidden lg:flex lg:flex-col lg:flex-1 lg:overflow-hidden bg-[#0A0A0A]"
      onDragEnd={() => setDragInfo(null)}
    >
      {/* Header bar */}
      <div className="h-12 shrink-0 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-[#F9FAFB] text-sm font-semibold">Dashboard</span>
          {dragInfo && (
            <span className="text-[#9CA3AF] text-[11px]">
              Drop into <span className="text-[#06B6D4]">{ALLOWED_DROPS[dragInfo.fromStatus]?.[0]}</span>
            </span>
          )}
        </div>
        <button
          onClick={onAddTask}
          className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-[12px] font-semibold rounded-md px-3 cursor-pointer flex items-center gap-1.5 transition-colors select-none"
          style={{ fontFamily: 'inherit', paddingTop: 6, paddingBottom: 6 }}
        >
          + New Task
        </button>
      </div>

      {/* Columns */}
      <div className="flex gap-4 p-4 overflow-x-auto flex-1 min-h-0">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter(t => t.status === col.id)}
            selected={selected}
            onTaskClick={onTaskClick}
            dragInfo={dragInfo}
            onDragStart={setDragInfo}
            onDragEnd={() => setDragInfo(null)}
            onDropTask={(taskId, toStatus) => {
              onMoveTask(taskId, toStatus);
              setDragInfo(null);
            }}
          />
        ))}
      </div>
      <style>{`[draggable=true]{user-select:none}[draggable=true]:active{cursor:grabbing}`}</style>
    </div>
  );
}

/* ─── AddTaskModal ───────────────────────────────────────────────────────── */

function AddTaskModal({ onClose, onAdd }) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date();
    const time = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });
    onAdd({ id: Date.now(), status: 'Backlog', time, text: trimmed });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-60" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
        <h3 className="text-[#F9FAFB] text-sm font-semibold m-0">New Task</h3>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          placeholder="Describe the task…"
          className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-[#F9FAFB] text-[13px] leading-relaxed resize-none outline-none focus:border-[#06B6D4] transition-colors placeholder-[#4B5563]"
          style={{ fontFamily: 'inherit', minHeight: 100 }}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="bg-transparent border border-[#2A2A2A] text-[#9CA3AF] text-[13px] rounded-md px-4 py-2 cursor-pointer hover:text-[#F9FAFB] hover:border-[#3A3A3A] transition-colors select-none"
            style={{ fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-[13px] font-semibold rounded-md px-4 py-2 cursor-pointer transition-colors select-none"
            style={{ fontFamily: 'inherit' }}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared panel header ────────────────────────────────────────────────── */

function PanelHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <p className="text-[#F9FAFB] text-[14px] font-semibold m-0 mb-1">{title}</p>
      {subtitle && <p className="text-[#9CA3AF] text-[12px] m-0">{subtitle}</p>}
    </div>
  );
}

/* ─── IDEAS ──────────────────────────────────────────────────────────────── */

const DUMMY_IDEAS = [
  { id: 1, text: 'Build a tool that converts my voice notes into structured blog posts automatically', savedAt: 'Saved Feb 19, 9:12 AM' },
  { id: 2, text: 'Research the top 10 Shopify apps for creators and summarize what\'s missing in the market', savedAt: 'Saved Feb 18, 3:45 PM' },
  { id: 3, text: 'Create a landing page for my beat selling business with a dark theme and fire aesthetic', savedAt: 'Saved Feb 17, 11:00 AM' },
];

function IdeasPanel({ onSendToQueue }) {
  const [draft, setDraft] = useState('');
  const [ideas, setIdeas] = useState(DUMMY_IDEAS);

  function saveIdea(andQueue = false) {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const now = new Date();
    const savedAt = 'Saved ' + now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    const idea = { id: Date.now(), text: trimmed, savedAt };
    setIdeas(prev => [idea, ...prev]);
    setDraft('');
    if (andQueue) onSendToQueue?.(trimmed);
  }

  function deleteIdea(id) {
    setIdeas(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-touch bg-[#0A0A0A] p-4">
      <PanelHeader title="Ideas" subtitle="Capture it now. Build it when you're ready." />

      {/* Capture area */}
      <div className="mb-4">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="What's on your mind? Describe something you want built, researched, or created..."
          className="w-full outline-none resize-none rounded-lg text-[#F9FAFB] placeholder-[#4B5563] text-[14px] leading-relaxed"
          style={{
            background: '#111111', border: '1px solid #2A2A2A', padding: 14,
            minHeight: 100, fontFamily: 'inherit', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = '#06B6D4')}
          onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => saveIdea(false)}
            className="text-[#9CA3AF] text-[13px] rounded-md cursor-pointer select-none border border-[#2A2A2A] bg-[#1A1A1A] transition-colors"
            style={{ padding: '7px 14px', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
          >
            Save Idea
          </button>
          <button
            onClick={() => saveIdea(true)}
            className="font-semibold text-[#0A0A0A] text-[13px] rounded-md cursor-pointer select-none border-none transition-colors"
            style={{ padding: '7px 14px', background: '#06B6D4', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0891B2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#06B6D4')}
          >
            Save + Send to Queue
          </button>
        </div>
      </div>

      {/* Saved ideas */}
      {ideas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-12">
          <Lightbulb size={28} color="#2A2A2A" strokeWidth={1.5} />
          <p className="text-[#4B5563] text-[13px] m-0">No ideas yet. What are you thinking about?</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ideas.map(idea => (
            <div key={idea.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg px-3.5 py-3">
              <p className="text-[#F9FAFB] text-[13px] leading-relaxed m-0 mb-3">{idea.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-[11px]">{idea.savedAt}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSendToQueue?.(idea.text)}
                    className="text-[#06B6D4] text-[11px] bg-transparent border-none cursor-pointer select-none p-0 transition-opacity hover:opacity-70"
                    style={{ fontFamily: 'inherit' }}
                  >
                    Send to Queue
                  </button>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="text-[#EF4444] text-[11px] bg-transparent border-none cursor-pointer select-none p-0 transition-opacity hover:opacity-70"
                    style={{ fontFamily: 'inherit' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── APPROVALS ──────────────────────────────────────────────────────────── */

const DUMMY_APPROVALS = [
  {
    id: 1,
    task: 'Add a voice transcription button to the brain dump screen',
    built: 'Added a microphone button to the top-right of the Brain Dump screen. Clicking it starts recording. Speech is transcribed using the Web Speech API and inserted into the text field automatically. Works on Chrome and Safari.',
    time: 'Feb 20, 10:43 AM',
  },
  {
    id: 2,
    task: 'Create a history tab showing all my past content ideas',
    built: 'Created a new History tab in the main navigation. It pulls all previously saved ideas from local storage and displays them in a searchable, scrollable list sorted by date.',
    time: 'Feb 20, 9:15 AM',
  },
];

function ApprovalsPanel() {
  const [items, setItems] = useState(DUMMY_APPROVALS);

  function approve(id) { setItems(prev => prev.filter(a => a.id !== id)); }
  function requestChanges(id) { setItems(prev => prev.filter(a => a.id !== id)); }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-touch bg-[#0A0A0A] p-4">
      <PanelHeader
        title="Approvals"
        subtitle="Review what Mission Control built. Approve to ship it, or ask for changes."
      />

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-16">
          <CheckSquare size={28} color="#2A2A2A" strokeWidth={1.5} />
          <p className="text-[#4B5563] text-[13px] m-0">You're all caught up — nothing waiting for review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#9CA3AF] text-[11px] bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-0.5">✦ Feature</span>
                  <span className="text-white text-[11px] font-semibold rounded px-2 py-0.5" style={{ background: '#F59E0B' }}>
                    Awaiting Review
                  </span>
                </div>
                <span className="text-[#9CA3AF] text-[11px]">{item.time}</span>
              </div>

              <p className="text-[#F9FAFB] text-[13px] leading-relaxed m-0 mb-3">{item.task}</p>

              <div className="h-px bg-[#2A2A2A] mb-3" />

              {/* What was built */}
              <p className="text-[#9CA3AF] text-[10px] font-medium tracking-widest uppercase m-0 mb-2">What was built:</p>
              <div className="rounded-md p-3 mb-4" style={{ background: '#0A0A0A', border: '1px solid #2A2A2A' }}>
                <p className="text-[#F9FAFB] text-[13px] leading-relaxed m-0">{item.built}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => approve(item.id)}
                  className="text-white text-[13px] font-semibold rounded-md border-none cursor-pointer select-none transition-colors"
                  style={{ background: '#10B981', padding: '7px 16px', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#059669')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#10B981')}
                >
                  ✓ Approve &amp; Ship
                </button>
                <button
                  onClick={() => requestChanges(item.id)}
                  className="text-[#9CA3AF] text-[13px] rounded-md cursor-pointer select-none border border-[#2A2A2A] bg-[#1A1A1A] transition-colors"
                  style={{ padding: '7px 16px', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3A3A3A')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
                >
                  Request Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── OUTPUTS ────────────────────────────────────────────────────────────── */

const OUTPUT_TYPE_COLORS = {
  Code:     { bg: 'rgba(6,182,212,0.1)',   text: '#06B6D4',  border: 'rgba(6,182,212,0.2)'  },
  Research: { bg: 'rgba(180,83,9,0.12)',   text: '#F59E0B',  border: 'rgba(245,158,11,0.2)' },
  Content:  { bg: 'rgba(16,185,129,0.1)',  text: '#10B981',  border: 'rgba(16,185,129,0.2)' },
  Docs:     { bg: 'rgba(139,92,246,0.1)',  text: '#8B5CF6',  border: 'rgba(139,92,246,0.2)' },
};

const DUMMY_OUTPUTS = [
  { id: 1, type: 'Code',     date: 'Feb 20', title: 'History Tab Component',                      desc: 'React component for browsing saved content ideas' },
  { id: 2, type: 'Research', date: 'Feb 19', title: 'Top Shopify Apps for Creators — Market Gap',  desc: '10 apps analyzed, 3 market gaps identified' },
  { id: 3, type: 'Content',  date: 'Feb 18', title: 'Instagram Caption Pack — 7 posts',            desc: 'Captions for beat drop, studio session, collab announcement' },
  { id: 4, type: 'Code',     date: 'Feb 17', title: 'Voice Transcription Feature',                 desc: 'Microphone button + Web Speech API integration' },
  { id: 5, type: 'Docs',     date: 'Feb 16', title: 'Business Plan — Beat Selling Platform',       desc: 'Market analysis, revenue model, go-to-market strategy' },
  { id: 6, type: 'Content',  date: 'Feb 15', title: 'Brand Copy — Landing Page',                   desc: 'Hero headline, subheadline, CTA, and about section' },
];

const OUTPUT_FILTERS = ['All', 'Code', 'Research', 'Content', 'Docs'];

function OutputsPanel() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = DUMMY_OUTPUTS.filter(o => {
    const matchesFilter = activeFilter === 'All' || o.type === activeFilter;
    const matchesSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.desc.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-touch bg-[#0A0A0A] p-4">
      <PanelHeader title="Outputs" subtitle="Everything Mission Control has built or generated for you." />

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
        <input
          type="text"
          placeholder="Search outputs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full outline-none rounded-lg text-[#F9FAFB] text-[13px] placeholder-[#4B5563]"
          style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px 10px 34px', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#06B6D4')}
          onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {OUTPUT_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="border-none cursor-pointer select-none transition-all text-[11px] font-semibold"
            style={{
              borderRadius: 20,
              padding: '4px 14px',
              background: activeFilter === f ? '#06B6D4' : 'transparent',
              color: activeFilter === f ? '#0A0A0A' : '#9CA3AF',
              fontFamily: 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
          <FileText size={28} color="#2A2A2A" strokeWidth={1.5} />
          <p className="text-[#4B5563] text-[13px] m-0">No outputs match your search.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map(output => {
            const colors = OUTPUT_TYPE_COLORS[output.type];
            return (
              <div key={output.id} className="rounded-lg p-3.5 flex flex-col gap-1.5" style={{ background: '#111111', border: '1px solid #2A2A2A' }}>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-semibold rounded px-2 py-0.5"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {output.type}
                  </span>
                  <span className="text-[#9CA3AF] text-[11px]">{output.date}</span>
                </div>
                <p className="text-[#F9FAFB] text-[13px] font-medium m-0 mt-1">{output.title}</p>
                <p className="text-[#9CA3AF] text-[12px] m-0 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {output.desc}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <button className="text-[#06B6D4] text-[11px] bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 select-none hover:opacity-70 transition-opacity" style={{ fontFamily: 'inherit' }}>
                    <Download size={11} /> Download
                  </button>
                  <button className="text-[#9CA3AF] text-[11px] bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 select-none hover:opacity-70 transition-opacity" style={{ fontFamily: 'inherit' }}>
                    <Eye size={11} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── HISTORY ────────────────────────────────────────────────────────────── */

const DUMMY_HISTORY = [
  {
    date: 'Feb 20, 2025',
    entries: [
      { id: 1, time: '10:43 AM', status: 'Built',     text: 'History tab with compose ideas' },
      { id: 2, time: '9:15 AM',  status: 'Built',     text: 'Voice transcription button' },
    ],
  },
  {
    date: 'Feb 19, 2025',
    entries: [
      { id: 3, time: '4:30 PM', status: 'Generated', text: 'Shopify market research report' },
      { id: 4, time: '2:00 PM', status: 'Built',     text: 'Dark mode toggle for settings' },
    ],
  },
  {
    date: 'Feb 18, 2025',
    entries: [
      { id: 5, time: '11:00 AM', status: 'Generated', text: 'Instagram caption pack' },
    ],
  },
];

const STATUS_BADGE_COLORS = {
  Built:     { bg: '#10B981', text: '#fff' },
  Generated: { bg: 'rgba(139,92,246,0.2)', text: '#8B5CF6' },
};

function HistoryPanel() {
  const [search, setSearch] = useState('');

  const groups = DUMMY_HISTORY.map(group => ({
    ...group,
    entries: group.entries.filter(e =>
      !search || e.text.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.entries.length > 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-touch bg-[#0A0A0A] p-4">
      <PanelHeader title="History" subtitle="Everything Mission Control has ever completed for you." />

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
        <input
          type="text"
          placeholder="Search history..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full outline-none rounded-lg text-[#F9FAFB] text-[13px] placeholder-[#4B5563]"
          style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px 10px 34px', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#06B6D4')}
          onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
        />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
          <Clock size={28} color="#2A2A2A" strokeWidth={1.5} />
          <p className="text-[#4B5563] text-[13px] m-0">Nothing here yet — completed tasks will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(group => (
            <div key={group.date} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0" style={{ width: 16 }}>
                <div className="rounded-full shrink-0" style={{ width: 8, height: 8, background: '#06B6D4', marginTop: 2 }} />
                <div className="flex-1 w-px mt-1" style={{ background: '#2A2A2A' }} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <p className="text-[#9CA3AF] text-[11px] font-medium tracking-widest uppercase m-0 mb-2">
                  {group.date}
                </p>
                <div className="flex flex-col gap-2">
                  {group.entries.map(entry => {
                    const badge = STATUS_BADGE_COLORS[entry.status] || STATUS_BADGE_COLORS.Built;
                    return (
                      <div key={entry.id} className="rounded-lg p-3 flex flex-col gap-1.5" style={{ background: '#111111', border: '1px solid #2A2A2A' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold rounded px-2 py-0.5" style={{ background: badge.bg, color: badge.text }}>
                            {entry.status}
                          </span>
                          <span className="text-[#9CA3AF] text-[11px]">{entry.time}</span>
                        </div>
                        <p className="text-[#F9FAFB] text-[13px] m-0 leading-relaxed">{entry.text}</p>
                        <button className="text-[#06B6D4] text-[11px] bg-transparent border-none cursor-pointer p-0 text-left select-none hover:opacity-70 transition-opacity" style={{ fontFamily: 'inherit' }}>
                          View Output →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SETTINGS ───────────────────────────────────────────────────────────── */

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative shrink-0 rounded-full border-none cursor-pointer select-none transition-colors duration-150"
      style={{ width: 36, height: 20, background: on ? '#06B6D4' : '#2A2A2A', padding: 0 }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white transition-all duration-150"
        style={{ width: 14, height: 14, left: on ? 18 : 3 }}
      />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[#9CA3AF] text-[10px] font-medium tracking-widest uppercase m-0 mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function SettingsPanel({ onSignOut }) {
  const [mode, setMode] = useState(() => localStorage.getItem('mc_user_mode') || 'dev');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState({ buildComplete: true, researchReady: true, weeklySummary: false });
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);

  function saveMode(m) {
    setMode(m);
    localStorage.setItem('mc_user_mode', m);
  }

  const inputStyle = {
    background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8,
    padding: '10px 12px', color: '#F9FAFB', fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scroll-touch bg-[#0A0A0A] p-4">
      <PanelHeader title="Settings" />

      {/* ── Your Mode ── */}
      <SectionLabel>Your Mode</SectionLabel>
      <div className="flex gap-2 mb-2">
        {[
          { id: 'dev',     label: 'Dev Mode',     icon: '</>' },
          { id: 'creator', label: 'Creator Mode',  icon: '✦'  },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => saveMode(id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border-none cursor-pointer select-none text-[13px] font-semibold transition-all"
            style={{
              padding: '10px 20px',
              background: mode === id ? '#06B6D4' : '#1A1A1A',
              color: mode === id ? '#0A0A0A' : '#9CA3AF',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 12 }}>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* ── AI Keys ── */}
      <SectionLabel>AI Keys</SectionLabel>
      <p className="text-[#9CA3AF] text-[12px] m-0 mb-3">Your keys are stored locally on your device and never sent to our servers.</p>

      <div className="flex flex-col gap-3 mb-1">
        {/* Anthropic */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[#F9FAFB] text-[13px]">Anthropic API Key</label>
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-[#06B6D4] text-[11px] no-underline hover:underline">Get key →</a>
          </div>
          <div className="relative">
            <input
              type={showAnthropicKey ? 'text' : 'password'}
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => (e.target.style.borderColor = '#06B6D4')}
              onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
            />
            <button onClick={() => setShowAnthropicKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#4B5563]" style={{ padding: 0 }}>
              {showAnthropicKey ? <Eye size={14} /> : <Eye size={14} style={{ opacity: 0.4 }} />}
            </button>
          </div>
        </div>

        {/* GitHub token — dev mode only */}
        {mode === 'dev' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#F9FAFB] text-[13px]">GitHub Token</label>
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[#06B6D4] text-[11px] no-underline hover:underline">Create token →</a>
            </div>
            <div className="relative">
              <input
                type={showGithubToken ? 'text' : 'password'}
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = '#06B6D4')}
                onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              />
              <button onClick={() => setShowGithubToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-none text-[#4B5563]" style={{ padding: 0, cursor: 'pointer' }}>
                {showGithubToken ? <Eye size={14} /> : <Eye size={14} style={{ opacity: 0.4 }} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className="text-[#0A0A0A] font-semibold text-[13px] rounded-lg border-none cursor-pointer select-none transition-colors mt-3 mb-2"
        style={{ background: '#06B6D4', padding: '10px 20px', fontFamily: 'inherit', width: 'fit-content' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#0891B2')}
        onMouseLeave={e => (e.currentTarget.style.background = '#06B6D4')}
      >
        Save Keys
      </button>

      {/* ── Notifications ── */}
      <SectionLabel>Notifications</SectionLabel>

      <div className="flex flex-col gap-3 mb-3">
        {[
          { key: 'buildComplete',  label: 'Email me when a build completes' },
          { key: 'researchReady',  label: 'Email me when research is ready' },
          { key: 'weeklySummary',  label: 'Weekly summary of all outputs' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[#F9FAFB] text-[13px]">{label}</span>
            <Toggle
              on={notifications[key]}
              onToggle={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
            />
          </div>
        ))}
      </div>

      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = '#06B6D4')}
        onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
      />

      {/* ── Account ── */}
      <SectionLabel>Account</SectionLabel>
      <p className="text-[#9CA3AF] text-[13px] m-0 mb-3">Signed in as test@missioncontrol.app</p>
      <button
        onClick={onSignOut}
        className="text-[#EF4444] text-[13px] rounded-md cursor-pointer select-none bg-transparent transition-colors w-fit"
        style={{ border: '1px solid #EF4444', padding: '7px 16px', fontFamily: 'inherit' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        Sign Out
      </button>

      {/* ── Pro ── */}
      <SectionLabel>Mission Control Pro</SectionLabel>
      <div className="rounded-xl p-4 mb-6" style={{ background: '#111111', border: '1px solid #06B6D4' }}>
        <p className="text-[#9CA3AF] text-[13px] m-0 mb-4 leading-relaxed">
          Unlock multi-repo support, team seats, approvals for teams, and priority builds.
        </p>
        <button
          className="w-full text-[#0A0A0A] font-semibold text-[13px] rounded-lg border-none cursor-pointer select-none transition-colors"
          style={{ background: '#06B6D4', padding: '10px 20px', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0891B2')}
          onMouseLeave={e => (e.currentTarget.style.background = '#06B6D4')}
        >
          Upgrade for $199 →
        </button>
      </div>
    </div>
  );
}

/* ─── NavPlaceholder ─────────────────────────────────────────────────────── */
function NavPlaceholder({ activeNav }) {
  const item = NAV_ITEMS.find(n => n.label === activeNav);
  const Icon = item?.Icon;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
      {Icon && (
        <span className="opacity-40 text-[#9CA3AF]">
          <Icon />
        </span>
      )}
      <p className="text-[#9CA3AF] text-sm font-medium m-0">{activeNav}</p>
      <p className="text-[#4B5563] text-xs m-0">Coming soon</p>
    </div>
  );
}

/* ─── QueuedDetail (New / In Progress tasks) ─────────────────────────────── */

function QueuedDetail({ task, onBuildThis }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <div className="mb-2.5">
          <StatusBadge status={task.status} />
        </div>
        <h2 className="text-[#F9FAFB] text-sm font-medium leading-relaxed m-0 mb-3">
          {task.text}
        </h2>
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed m-0">
          <span className="font-semibold">Status: </span>
          {task.status === 'In Progress' ? 'In progress — the AI is working on this' : task.status === 'New' ? 'Queued — drag to In Progress to kick off the AI' : 'In your backlog — drag to New when ready'}
        </p>
      </div>

      {task.status === 'New' && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => onBuildThis?.(task.id)}
            className="bg-[#B45309] hover:bg-[#D97706] border-none text-white font-semibold text-sm rounded-lg px-6 flex items-center gap-2 cursor-pointer transition-colors select-none"
            style={{ minHeight: 48, fontFamily: 'inherit' }}
          >
            <IcoArrowUp /> Build This
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── BuiltDetail (Built tasks) ──────────────────────────────────────────── */

function BuiltDetail({ task }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Build summary */}
      <div>
        <p className="text-[#9CA3AF] text-[11px] mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
          Build: {task.text}
        </p>
        <div className="mb-2.5">
          <StatusBadge status="Built" />
        </div>
        <h2 className="text-[#F9FAFB] text-sm font-medium leading-relaxed m-0 mb-2">
          {task.text}
        </h2>
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed m-0">
          <span className="font-semibold">Reasoning: </span>
          Manually triggered by Alex via Mission Control
        </p>
      </div>

      {/* Metadata pills */}
      <div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <Pill>Branch: ai/feedback-history-tab</Pill>
          <Pill>Files changed: 1</Pill>
        </div>
        <Pill>components/History.tsx</Pill>
      </div>

      {/* Build Log */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[#9CA3AF] text-[10px]">▼</span>
          <span className="text-[#9CA3AF] text-[10px] font-medium tracking-widest uppercase">
            BUILD LOG (12 ENTRIES)
          </span>
        </div>
        <div
          className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-md p-2.5 text-[11px] leading-[1.7] max-h-[210px] overflow-y-auto scroll-touch"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <div className="text-center text-[#F9FAFB] font-medium mb-2 tracking-tight">
            Compose Ideas tab to History
          </div>
          {LOG_ENTRIES.map((entry, i) => (
            <LogEntry key={i} entry={entry} />
          ))}
        </div>
      </div>

      {/* Addresses Feedback */}
      <div>
        <p className="text-[#9CA3AF] text-[10px] font-medium tracking-widest uppercase mb-2">
          ADDRESSES FEEDBACK
        </p>
        <div
          className="bg-[#111111] rounded-md py-2 px-3"
          style={{ border: '1px solid #2A2A2A', borderLeft: '3px solid #06B6D4' }}
        >
          <p className="text-[#9CA3AF] text-[11px] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            ✦ Feature &nbsp; {task.text.slice(0, 50)}…
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── BuildDetail (dispatcher) ───────────────────────────────────────────── */

function BuildDetail({ task, onBuildThis }) {
  if (!task) return null;
  return task.status === 'Built'
    ? <BuiltDetail task={task} />
    : <QueuedDetail task={task} onBuildThis={onBuildThis} />;
}

/* ─── BottomNav (mobile only) ────────────────────────────────────────────── */

function BottomNav({ activeNav, setActiveNav }) {
  return (
    <nav
      className="lg:hidden shrink-0 bg-[#111111] border-t border-[#2A2A2A] flex items-center select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_NAV_ITEMS.map(({ label, Icon }) => {
        const isActive = activeNav === label;
        return (
          <button
            key={label}
            onClick={() => setActiveNav(label)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 cursor-pointer bg-transparent border-none select-none ${
              isActive ? 'text-[#06B6D4]' : 'text-[#9CA3AF]'
            }`}
            style={{ minHeight: 44, fontFamily: 'inherit' }}
          >
            <Icon />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── App Root ───────────────────────────────────────────────────────────── */

export default function App() {
  // Handle GitHub OAuth popup callback — postMessage code to opener then close
  const params = new URLSearchParams(window.location.search);
  const _oauthCode = params.get('code');
  const _oauthState = params.get('state');
  if (window.opener && _oauthCode && _oauthState) {
    window.opener.postMessage(
      { type: 'GITHUB_OAUTH', code: _oauthCode, state: _oauthState },
      window.location.origin
    );
    window.close();
    return null;
  }

  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('mc_onboarding_complete') === 'true'
  );

  function handleSignOut() {
    localStorage.removeItem('mc_onboarding_complete');
    localStorage.removeItem('mc_tasks');
    localStorage.removeItem('mc_user_mode');
    setOnboarded(false);
  }

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  }

  return <Dashboard onSignOut={handleSignOut} />;
}

function Dashboard({ onSignOut }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });
  const [selected, setSelected] = useState(3);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [dragInfo, setDragInfo] = useState(null); // { taskId, fromStatus } | null

  const selectedTask = tasks.find(t => t.id === selected);

  function handleTaskClick(taskId) {
    setSelected(taskId);
    setMobileView('detail');
  }

  function handleBuildThis(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress' } : t));
  }

  function handleAddTask(task) {
    setTasks(prev => [task, ...prev]);
  }

  function handleMoveTask(taskId, toStatus) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: toStatus } : t));
  }

  useEffect(() => {
    localStorage.setItem('mc_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Mobile task list: show on mobile list-view only; always hidden on desktop
  const mobileCenterClass = [
    'overflow-y-auto scroll-touch bg-[#0A0A0A] p-4',
    mobileView === 'list' ? 'flex flex-col flex-1 lg:hidden' : 'hidden',
  ].join(' ');

  // Right detail panel: show on mobile detail-view; always visible on desktop
  const rightClass = [
    'overflow-y-auto scroll-touch bg-[#0F0F0F] border-l border-[#2A2A2A]',
    mobileView === 'detail'
      ? 'flex flex-col flex-1'
      : 'hidden lg:flex lg:flex-col lg:w-[380px] lg:shrink-0',
  ].join(' ');

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#0A0A0A]"
      style={{ height: '100dvh', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Orange accent line */}
      <div className="h-1 shrink-0 bg-[#F97316]" />

      <TopBar
        mobileView={mobileView}
        selectedTask={selectedTask}
        onBack={() => setMobileView('list')}
        onHamburger={() => setDrawerOpen(true)}
        onAddTask={() => setShowAddTask(true)}
      />

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftSidebar activeNav={activeNav} setActiveNav={setActiveNav} onSignOut={onSignOut} />

        {activeNav === 'Dashboard' ? (
          <>
            {/* Desktop: Mission Control + Kanban board */}
            <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:overflow-hidden">
              {/* Mission Control Dashboard */}
              <div className="h-[60%] overflow-y-auto border-b border-[#2A2A2A]">
                <MissionControlDashboard tasks={tasks} />
              </div>
              
              {/* Kanban Board */}
              <div className="h-[40%] flex flex-col overflow-hidden">
                <div className="h-12 shrink-0 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-4">
                  <span className="text-[#F9FAFB] text-sm font-semibold">Task Management</span>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="bg-[#06B6D4] hover:bg-[#0891B2] border-none text-white text-[12px] font-semibold rounded-md px-3 cursor-pointer flex items-center gap-1.5 transition-colors select-none"
                    style={{ fontFamily: 'inherit', paddingTop: 6, paddingBottom: 6 }}
                  >
                    + New Task
                  </button>
                </div>
                <div className="flex gap-4 p-4 overflow-x-auto flex-1 min-h-0">
                  {COLUMNS.map(col => (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      tasks={tasks.filter(t => t.status === col.id)}
                      selected={selected}
                      onTaskClick={handleTaskClick}
                      dragInfo={dragInfo}
                      onDragStart={setDragInfo}
                      onDragEnd={() => setDragInfo(null)}
                      onDropTask={(taskId, toStatus) => {
                        handleMoveTask(taskId, toStatus);
                        setDragInfo(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: Mission Control Overview */}
            <div className={`lg:hidden ${mobileView === 'list' ? 'flex flex-col flex-1' : 'hidden'} overflow-y-auto`}>
              <MissionControlDashboard tasks={tasks} />
              
              {/* Mobile Task List */}
              <div className="bg-[#0A0A0A] p-4">
                <h3 className="text-[#F9FAFB] text-lg font-semibold mb-4 m-0">Active Tasks</h3>
                <CenterPanel
                  tasks={tasks}
                  selected={selected}
                  onTaskClick={handleTaskClick}
                  onBuildThis={handleBuildThis}
                />
              </div>
            </div>

            {/* Right panel: build detail */}
            <div className={rightClass}>
              <BuildDetail task={selectedTask} onBuildThis={handleBuildThis} />
            </div>
          </>
        ) : activeNav === 'Ideas' ? (
          <IdeasPanel onSendToQueue={text => {
            const now = new Date();
            const time = now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
            handleAddTask({ id: Date.now(), status: 'Backlog', time, text });
            setActiveNav('Dashboard');
          }} />
        ) : activeNav === 'Approvals' ? (
          <ApprovalsPanel />
        ) : activeNav === 'Outputs' ? (
          <OutputsPanel />
        ) : activeNav === 'History' ? (
          <HistoryPanel />
        ) : activeNav === 'Settings' ? (
          <SettingsPanel onSignOut={onSignOut} />
        ) : (
          <NavPlaceholder activeNav={activeNav} />
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Mobile sidebar drawer */}
      <Drawer
        isOpen={drawerOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onClose={() => setDrawerOpen(false)}
        onSignOut={onSignOut}
      />

      {/* Add Task modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
}
