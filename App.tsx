
import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Classes from './pages/admin/Classes';
import Parents from './pages/admin/Parents';
import Attendance from './pages/admin/Attendance';
import BehaviorPage from './pages/admin/BehaviorPage';
import Announcements from './pages/admin/Announcements';
import Documents from './pages/admin/Documents';
import Tasks from './pages/admin/Tasks';
import Messages from './pages/admin/Messages';
import Reports from './pages/admin/Reports';
import QuestionBank from './pages/admin/QuestionBank'; 
import UsersPage from './pages/admin/Users'; 
import SettingsPage from './pages/admin/Settings'; // New Import
import ParentDashboard from './pages/app/ParentDashboard';
import AttendanceHistory from './pages/app/AttendanceHistory';
import BehaviorHistory from './pages/app/BehaviorHistory';
import AppAnnouncements from './pages/app/AppAnnouncements';
import AppDocuments from './pages/app/AppDocuments';
import AppTasks from './pages/app/AppTasks';
import AppMessages from './pages/app/AppMessages';
import GameLevel from './pages/app/GameLevel'; 
import provider from './core/provider';

const { HashRouter: Router, Routes, Route, Navigate } = ReactRouterDOM;

const App: React.FC = () => {

  useEffect(() => {
    // Initialize Provider (Load Cache)
    provider.init();
    
    // Initial Sync
    provider.sync();

    // Auto Sync every 3 minutes (180000 ms)
    const interval = setInterval(() => {
       provider.sync();
    }, 180000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <Layout role="admin">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/students" element={<Students />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/behavior" element={<BehaviorPage />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/questions" element={<QuestionBank />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
          </Layout>
        } />

        {/* App (Parent/Student) Routes */}
        <Route path="/app/*" element={
          <Layout role="app">
            <Routes>
              <Route path="/" element={<ParentDashboard />} />
              <Route path="/announcements" element={<AppAnnouncements />} />
              <Route path="/documents" element={<AppDocuments />} />
              <Route path="/tasks" element={<AppTasks />} />
              <Route path="/attendance" element={<AttendanceHistory />} />
              <Route path="/behavior" element={<BehaviorHistory />} />
              <Route path="/messages" element={<AppMessages />} />
              <Route path="/game" element={<GameLevel />} />
              <Route path="*" element={<Navigate to="/app" />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
