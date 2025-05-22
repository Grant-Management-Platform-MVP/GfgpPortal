import React, { useState } from 'react';
import LoginForm from '../components/Login';
import RegisterForm from '../components/RegisterForm';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('login');

  const handleRegistrationSuccess = () => {
    setActiveTab("login");
  };

  return (
    <div className="min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row shadow-lg rounded overflow-hidden" style={{ minHeight: '80vh' }}>

          {/* Branding — Always visible on mobile */}
          <div className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center text-white p-4 p-md-5" style={{ backgroundColor: '#64B5F6', borderTopLeftRadius: '30px'}}>
            <img
              src="https://gfgp.ai/img/logo.png"
              alt="GFGP Logo"
              style={{ maxHeight: '100px' }}
              className="mb-3"
            />
            <h4 className="fw-bold text-center mb-2">Good Financial Grant Practice</h4>
            <p className="text-center mb-0">Elevate Your Grant Management.</p>
          </div>

          {/* Form Section */}
          <div className="col-12 col-md-6 bg-white text-black p-4" style={{
            borderBottomRightRadius: '30px'
          }}>
            <div className="mb-4">
              <ul className="nav nav-tabs nav-justified" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                    onClick={() => setActiveTab('login')}
                  >
                    <FaSignInAlt className="me-2" /> Login
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                  >
                    <FaUserPlus className="me-2" /> Register
                  </button>
                </li>
              </ul>
            </div>

            <div className="tab-content">
              <div className="tab-pane fade show active">
                {activeTab === 'login' ? (
                  <LoginForm />
                ) : (
                  <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-4 text-light small">
          &copy; {new Date().getFullYear()} GFGP Platform. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;