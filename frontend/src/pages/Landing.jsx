import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, ShieldCheck, Cpu, Calendar, Database, Sparkles, Download, 
  Clock, Award, BookOpen, Layers, Users, UsersRound, Building, DoorOpen
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const steps = [
    { num: 1, icon: <Building className="text-amber-400" size={24} />, title: "Departments", desc: "Define administrative academic departments." },
    { num: 2, icon: <Layers className="text-amber-400" size={24} />, title: "Divisions", desc: "Configure semester student division groups." },
    { num: 3, icon: <Users className="text-amber-400" size={24} />, title: "Batches", desc: "Specify sub-groups for practical lab courses." },
    { num: 4, icon: <UsersRound className="text-amber-400" size={24} />, title: "Instructors", desc: "Add faculty records and max weekly loads." },
    { num: 5, icon: <DoorOpen className="text-amber-400" size={24} />, title: "Rooms", desc: "Enter details of classrooms and lab rooms." },
    { num: 6, icon: <BookOpen className="text-amber-400" size={24} />, title: "Courses", desc: "Add courses and assign eligible faculty." },
    { num: 7, icon: <Clock className="text-amber-400" size={24} />, title: "Meeting Times", desc: "Define weekly lecture & lab slots." },
    { num: 8, icon: <Sparkles className="text-amber-400" size={24} />, title: "Sections", desc: "Map weekly requirements & generate!" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              TimetableGen
            </h1>
          </div>
          <div>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 space-y-20">
        
        {/* Hero Section */}
        <section className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-8 py-16 text-center overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(245,158,11,0.07)_0%,transparent_60%)] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              College Timetable <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Generator
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Automate your institution's scheduling with <span className="text-amber-400 font-semibold">conflict-free allocation</span>. Save 20+ hours weekly managing rooms, teachers, and student groups.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/dashboard/timetable"
                    className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 px-6 py-3 text-sm font-semibold text-slate-200 transition-all duration-200"
                  >
                    Generate Timetable
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Login to Start
                </Link>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-slate-900 mt-12">
              <div>
                <div className="text-3xl font-extrabold text-amber-400">500+</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Courses Managed</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-amber-400">2000+</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Students Served</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-amber-400">100%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Conflict-Free</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-amber-400">20 hrs</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Saved / Week</div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Simple Workflow
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white">Get Started in 8 Easy Steps</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Follow our guided data insertion steps to build a complete scheduling model.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div key={step.num} className="rounded-xl border border-slate-900 bg-slate-900/30 p-5 text-center transition hover:border-amber-500/30 hover:-translate-y-1 duration-200">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 text-xs font-bold text-slate-400 mx-auto mb-3">
                  {step.num}
                </div>
                <div className="flex justify-center mb-2">{step.icon}</div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Core Capabilities
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white">Powerful Features for Modern Colleges</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-200">Zero Conflicts Guaranteed</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Advanced CSP heuristics ensure no double-booked resources (teachers, rooms, divisions) exist.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Cpu size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-200">Automatic Allocation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rooms, timeslots, and instructors are dynamically selected and fitted based on eligibility constraints.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Calendar size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-200">Lab & Lecture Support</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seamlessly maps 1-hour class lectures and parallel 2-hour practical batch slots.
              </p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Process
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white">Three Simple Steps</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 mx-auto text-xl font-bold shadow-lg shadow-black/40">
                <Database size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-200">1. Input Details</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Easily register academic branches, divisions, lab batches, instructors, classrooms, and courses.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 mx-auto text-xl font-bold shadow-lg shadow-black/40">
                <Sparkles size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-200">2. Generate Schedules</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Click a button to let the scheduler process conflicts and generate conflict-free calendars.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 mx-auto text-xl font-bold shadow-lg shadow-black/40">
                <Download size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-200">3. Download as PDF</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Download formatted weekly division timetables matching PICT layout.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600 mt-20">
        © {new Date().getFullYear()} Pune Institute of Computer Technology (PICT) - Timetable Management System
      </footer>
    </div>
  );
};

export default Landing;
