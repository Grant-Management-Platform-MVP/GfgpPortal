import React, { useState } from 'react';
import LoginForm from './components/Login';
import RegisterForm from './components/RegisterForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="container mt-5">
       <ToastContainer position="top-right" autoClose={5000} />
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center mb-4">
          <img
            src="https://gfgp.ai/img/logo.png"
            alt="GFGP Logo"
            style={{ height: 129, width: 129 }}
          />
        </div>
      </div>
      <h2 className="text-center mb-4">Welcome to the Grantee Platform</h2>
      <div className="card col-md-6 offset-md-3">
        <div className="card-body">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </li>
          </ul>

          <div className="mt-3">
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
