import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building, Users, GraduationCap, DoorOpen, ArrowUpRight, CalendarDays, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    departments: 0,
    divisions: 0,
    instructors: 0,
    rooms: 0,
    courses: 0,
    sections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [deptRes, divRes, instRes, roomRes, courseRes, secRes] = await Promise.all([
          api.get('/departments'),
          api.get('/divisions'),
          api.get('/instructors'),
          api.get('/rooms'),
          api.get('/courses'),
          api.get('/sections')
        ]);

        setStats({
          departments: deptRes.data.length,
          divisions: divRes.data.length,
          instructors: instRes.data.length,
          rooms: roomRes.data.length,
          courses: courseRes.data.length,
          sections: secRes.data.length
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Departments', value: stats.departments, icon: Building, color: 'text-amber-400', bg: 'bg-amber-500/10', path: '/dashboard/departments' },
    { label: 'Divisions', value: stats.divisions, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/dashboard/divisions' },
    { label: 'Instructors', value: stats.instructors, icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/dashboard/instructors' },
    { label: 'Rooms (Halls/Labs)', value: stats.rooms, icon: DoorOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10', path: '/dashboard/rooms' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard Overview</h2>
        <p className="text-sm text-slate-400">Real-time statistics of your scheduling assets and configurations.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-6 h-32"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.path}
                  className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition duration-150"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-400">{card.label}</h3>
                      <p className="text-3xl font-extrabold tracking-tight text-slate-100">
                        {card.value}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${card.bg} ${card.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 group-hover:text-indigo-400 transition">
                    <span>Manage records</span>
                    <ArrowUpRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions & Status Card */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-200">System Checklist</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                To generate a successful, conflict-free timetable, ensure you have populated the database with sufficient entries across all academic dimensions.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.departments > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Departments ({stats.departments})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.divisions > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Divisions ({stats.divisions})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.instructors > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Instructors ({stats.instructors})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.rooms > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Rooms ({stats.rooms})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.courses > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Courses ({stats.courses})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats.sections > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-slate-300">Sections ({stats.sections})</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-indigo-400 mb-2">
                  <CalendarDays size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-200">Timetable Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run the constraint solver algorithm to compile the active weekly slots and distribute faculty workloads.
                </p>
              </div>

              <Link
                to="/dashboard/timetable"
                className="w-full text-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 text-sm transition mt-6 block"
              >
                Go to Generator
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
