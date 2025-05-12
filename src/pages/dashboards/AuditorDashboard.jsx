import React from 'react';
import DashboardLayout from '@components/DashboardLayout';



const AuditorDashboard = () => {
  return (
    <DashboardLayout title="Auditor Dashboard">
      <div className="alert alert-info">Welcome Auditor! Review grant reports and financial records here.</div>
    </DashboardLayout>
  );
};

export default AuditorDashboard;