import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const DashboardLayout = ({ title, children, userRole }) => {
  const location = useLocation();

  const getSidebarLinks = () => {
    switch (userRole) {
      case 'grantee':
        return [
          { path: '/grantee/select-structure', label: 'Select GFGP Structure' },
          { path: '/grantee/questionnaire', label: 'Start Questionnaire' },
          { path: '/grantee/compliance-reports', label: 'Compliance Reports' },
          { path: '/grantee/recommendations', label: 'Recommendations' },
          { path: '/grantee/documents', label: 'Document Uploads' }
        ];
      case 'grantor':
        return [
          { path: '/grantor/reports', label: 'View Grantee Reports' },
          { path: '/grantor/compare', label: 'Compare Assessments' },
          { path: '/grantor/filters', label: 'Filter Grantees' },
          { path: '/grantor/risks', label: 'Risk Scoring' },
          { path: '/grantor/high-risk', label: 'High-Risk Areas' }
        ];
      case 'auditor':
        return [
          { path: '/auditor/data', label: 'Assessment Data' },
          { path: '/auditor/upload', label: 'Upload Verification Report' },
          { path: '/auditor/review', label: 'Submit Review Findings' }
        ];
      case 'admin':
        return [
          { path: '/admin/users', label: 'User Managment' },
          { path: '/admin/settings', label: 'System Settings' },
          { path: '/admin/questionnaire', label: 'Questionnaire Editor' },
          { path: '/admin/documents', label: 'Version Control' },
          { path: '/admin/reports', label: 'Reports & Exports' },
          { path: '/admin/translations', label: 'Manage Translations' }
        ];
      default:
        return [];
    }
  };

  const sidebarLinks = getSidebarLinks();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className="bg-dark border-end sidebar p-3" style={{ width: '250px' }}>
        <div className="navbar-brand" style={{ textAlign: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: '70px', textAlign: 'center' }} />
          </div>
        <ul className="nav flex-column">
          {sidebarLinks.map(({ path, label }) => (
            <li key={path} className="nav-item">
              <Link
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
                to={path}  style={{color: '#fff' }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1"style={{ backgroundColor: '#fff', color: '#000' }}>
        {/* Navbar */}
        <header className="navbar navbar-expand-lg navbar-dark bg-primary px-4" style={{ height: '60px' }}>
          <div className="ms-auto d-flex align-items-center">
            <Link to={`/${userRole}/profile`} className="text-white me-3">Profile</Link>
            <Link to="/logout" className="text-white">Logout</Link>
          </div>
        </header>

        <main className="p-4">
          <h2>{title}</h2>
          <hr />
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
