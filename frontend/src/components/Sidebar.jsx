import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  Users,
  Hash,
  GraduationCap,
  DoorOpen,
  BookOpen,
  Clock,
  Kanban,
  CalendarDays
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Departments', path: '/dashboard/departments', icon: Building },
    { name: 'Divisions', path: '/dashboard/divisions', icon: Users },
    { name: 'Batches', path: '/dashboard/batches', icon: Hash },
    { name: 'Instructors', path: '/dashboard/instructors', icon: GraduationCap },
    { name: 'Rooms', path: '/dashboard/rooms', icon: DoorOpen },
    { name: 'Courses', path: '/dashboard/courses', icon: BookOpen },
    { name: 'Meeting Times', path: '/dashboard/meeting-times', icon: Clock },
    { name: 'Sections', path: '/dashboard/sections', icon: Kanban },
    { name: 'Generate Timetable', path: '/dashboard/timetable', icon: CalendarDays },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between">
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
