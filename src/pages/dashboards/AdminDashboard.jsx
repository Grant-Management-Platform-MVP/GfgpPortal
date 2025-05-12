import React from 'react';
import DashboardLayout from '@components/DashboardLayout';
import { Routes, Route, Link } from 'react-router-dom';
import Profile from '@common/ProfilePage';
import UserManagement from '@pages/admin/UserManagement';

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Admin Dashboard" userRole="admin">
      <Routes>
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;