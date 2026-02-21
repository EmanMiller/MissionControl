import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import OnboardingFlow from './OnboardingFlow.jsx';

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

function IcoTasks() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <line x1="5" y1="6.5" x2="11" y2="6.5" />
      <line x1="5" y1="9.5" x2="11" y2="9.5" />
    </svg>
  );
}

function IcoContent() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" />
      <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" />
    </svg>
  );
}

function IcoApprovals() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,8.5 6.5,12 13,5" />
    </svg>
  );
}

function IcoCouncil() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9.5,2 5.5,9 8.5,9 6.5,14 11.5,7 8.5,7" />
    </svg>
  );
}

function IcoCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="5" y1="1.5" x2="5" y2="4.5" />
      <line x1="11" y1="1.5" x2="11" y2="4.5" />
    </svg>
  );
}

function IcoProjects() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 6C2 4.9 2.9 4 4 4H6.2L7.6 5.5H12C13.1 5.5 14 6.4 14 7.5V11C14 12.1 13.1 13 12 13H4C2.9 13 2 12.1 2 11V6Z" />
    </svg>
  );
}

function IcoMemory() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2.5C4 2.5 3 4 3 5.5C3 6.8 3.8 7.8 5 8.3V11C5 12.1 5.9 13 7 13H9C10.1 13 11 12.1 11 11V8.3C12.2 7.8 13 6.8 13 5.5C13 4 12 2.5 10 2.5" />
      <line x1="8" y1="2.5" x2="8" y2="5" />
      <line x1="6.5" y1="5" x2="9.5" y2="5" />
    </svg>
  );
}

function IcoDocs() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 2H9.5L13 5.5V14H4V2Z" />
      <polyline points="9.5,2 9.5,5.5 13,5.5" />
      <line x1="6" y1="8" x2="11" y2="8" />
      <line x1="6" y1="10.5" x2="9" y2="10.5" />
    </svg>
  );
}

function IcoPeople() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="2.5" />
      <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    </svg>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Tasks',     Icon: IcoTasks     },
  { label: 'Content',   Icon: IcoContent   },
  { label: 'Approvals', Icon: IcoApprovals },
  { label: 'Council',   Icon: IcoCouncil   },
  { label: 'Calendar',  Icon: IcoCalendar  },
  { label: 'Projects',  Icon: IcoProjects  },
  { label: 'Memory',    Icon: IcoMemory    },
  { label: 'Docs',      Icon: IcoDocs      },
  { label: 'People',    Icon: IcoPeople    },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Tasks',     Icon: IcoTasks     },
  { label: 'Content',   Icon: IcoContent   },
  { label: 'Approvals', Icon: IcoApprovals },
  { label: 'Calendar',  Icon: IcoCalendar  },
  { label: 'Projects',  Icon: IcoProjects  },
];

const INITIAL_TASKS = [
  {
    id: 1,
    status: 'New',
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
    status: 'New',
    time: 'Feb 20, 9:38 AM',
    text: "I want to be able to see the make me a banger history",
  },
];

const COLUMNS = [
  { id: 'New',         label: 'New',         color: '#06B6D4' },
  { id: 'In Progress', label: 'In Progress',  color: '#F97316' },
  { id: 'Built',       label: 'Built',        color: '#10B981' },
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
  if (status === 'Built') {
    return (
      <span className="bg-[#10B981] text-white text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">
        Built
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="bg-transparent border border-[#F97316] text-[#F97316] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">
        In Progress
      </span>
    );
  }
  return (
    <span className="bg-transparent border border-[#06B6D4] text-[#06B6D4] text-[11px] rounded px-[7px] py-0.5 leading-4 inline-block">
      New
    </span>
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

function KanbanCard({ task, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 cursor-pointer transition-colors duration-150 hover:border-[#3A3A3A]"
      style={isSelected ? { borderLeft: '3px solid #06B6D4' } : {}}
    >
      {/* Task text — 2-line clamp */}
      <p
        className="text-[#F9FAFB] text-[12px] leading-relaxed m-0 mb-2"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {task.text}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] text-[10px] rounded px-[6px] py-0.5 inline-flex items-center gap-1">
          ✦ Feature
        </span>
        <span className="text-[#9CA3AF] text-[10px]">{task.time}</span>
      </div>
    </div>
  );
}

/* ─── KanbanColumn ───────────────────────────────────────────────────────── */

function KanbanColumn({ column, tasks, selected, onTaskClick }) {
  return (
    <div className="w-[240px] shrink-0 flex flex-col min-h-0">
      {/* Colored top border */}
      <div className="h-[3px] rounded-t" style={{ backgroundColor: column.color }} />

      {/* Column header */}
      <div className="bg-[#111111] border border-t-0 border-[#2A2A2A] px-3 py-2 flex items-center justify-between mb-2">
        <span className="text-[#F9FAFB] text-[12px] font-semibold">{column.label}</span>
        <span
          className="text-[#9CA3AF] text-[11px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full flex items-center justify-center"
          style={{ minWidth: 20, height: 20, paddingLeft: 5, paddingRight: 5 }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 scroll-touch pb-2">
        {tasks.length === 0 ? (
          <div className="border border-dashed border-[#2A2A2A] rounded-lg text-[#4B5563] text-[11px] text-center py-8">
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              isSelected={selected === task.id}
              onClick={() => onTaskClick(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── KanbanBoard (desktop only) ─────────────────────────────────────────── */

function KanbanBoard({ tasks, selected, onTaskClick, onAddTask }) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:overflow-hidden bg-[#0A0A0A]">
      {/* Header bar */}
      <div className="h-12 shrink-0 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-4">
        <span className="text-[#F9FAFB] text-sm font-semibold">Tasks</span>
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
          />
        ))}
      </div>
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
    onAdd({ id: Date.now(), status: 'New', time, text: trimmed });
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
          {task.status === 'In Progress' ? 'In progress — being built' : 'Queued — waiting to be built'}
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
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('mc_onboarding_complete') === 'true'
  );

  function handleSignOut() {
    localStorage.removeItem('mc_onboarding_complete');
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
  const [activeNav, setActiveNav] = useState('Tasks');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

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

        {activeNav === 'Tasks' ? (
          <>
            {/* Desktop: Kanban board */}
            <KanbanBoard
              tasks={tasks}
              selected={selected}
              onTaskClick={handleTaskClick}
              onAddTask={() => setShowAddTask(true)}
            />

            {/* Mobile: flat task list */}
            <div className={mobileCenterClass}>
              <CenterPanel
                tasks={tasks}
                selected={selected}
                onTaskClick={handleTaskClick}
                onBuildThis={handleBuildThis}
              />
            </div>

            {/* Right panel: build detail */}
            <div className={rightClass}>
              <BuildDetail task={selectedTask} onBuildThis={handleBuildThis} />
            </div>
          </>
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
