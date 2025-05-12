import React, { useState } from 'react';
import LoginForm from '../components/Login';
import RegisterForm from '../components/RegisterForm';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="text-center mb-4">
        <img
          src="https://gfgp.ai/img/logo.png"
          alt="GFGP Logo"
          style={{ height: 120, width: 120 }}
          className="mb-3"
        />
        <h2 className="fw-bold">Welcome to the Grantee Management Platform</h2>
      </div>

      <div className="card shadow-lg p-4 w-100" style={{ maxWidth: '600px' }}>
        <ul className="nav nav-tabs nav-fill mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              <FaSignInAlt className="me-2" />
              Login
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              <FaUserPlus className="me-2" />
              Register
            </button>
          </li>
        </ul>

        <div className="tab-content">
          <div className="tab-pane fade show active">
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;