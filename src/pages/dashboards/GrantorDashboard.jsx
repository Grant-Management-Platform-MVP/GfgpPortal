import React from 'react';
import DashboardLayout from '@components/DashboardLayout';



const GrantorDashboard = () => {
  return (
    <DashboardLayout title="Grantor Dashboard">
      <div className="alert alert-info">Hello Grantor! Here you can view applications and allocate funds.</div>
    </DashboardLayout>
  );
};

export default GrantorDashboard;