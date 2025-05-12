import React from 'react';
import DashboardLayout from '@components/DashboardLayout';

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="alert alert-info">Hello Admin! Manage users, roles, and platform settings here.</div>
    </DashboardLayout>
  );
};

export default AdminDashboard;