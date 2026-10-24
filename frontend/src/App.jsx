import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Divisions from './pages/Divisions';
import Batches from './pages/Batches';
import Instructors from './pages/Instructors';
import Rooms from './pages/Rooms';
import Courses from './pages/Courses';
import MeetingTimes from './pages/MeetingTimes';
import Sections from './pages/Sections';
import TimetableView from './pages/TimetableView';

// Layout for Protected Pages
const DashboardLayout = () => {
  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="divisions" element={<Divisions />} />
            <Route path="batches" element={<Batches />} />
            <Route path="instructors" element={<Instructors />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="courses" element={<Courses />} />
            <Route path="meeting-times" element={<MeetingTimes />} />
            <Route path="sections" element={<Sections />} />
            <Route path="timetable" element={<TimetableView />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
