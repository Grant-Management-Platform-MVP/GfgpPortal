import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();

    try {
        const BASE_URL = 'http://gfgp.ai:8090/api/';

        const res = await fetch(BASE_URL + 'auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const contentType = res.headers.get("content-type");
        let errorMessage = 'Login failed!';

        if (!res.ok) {
            console.error('Login failed:', res.status, res.statusText);
          // Try to parse error body if it's JSON
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }

          toast.error(errorMessage);
          return;
        }

        const data = await res.json();
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('role', data.role);

        switch (data.role) {
          case 'GRANTEE':
            window.location.href = '/grantee-dashboard.html';
            break;
          case 'GRANTOR':
            window.location.href = '/grantor-dashboard.html';
            break;
          case 'AUDITOR':
            window.location.href = '/auditor-dashboard.html';
            break;
          case 'ADMIN':
            window.location.href = '/admin-dashboard.html';
            break;
          default:
            toast.error('Unknown role.');
        }
      } catch (err) {
        console.error('Login error:', err);
        toast.error('Something went wrong');
      }
};

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div className="mb-3">
        <label className="form-label">Username</label>
        <input
          className="form-control"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary btn-lg w-100" style={{ backgroundColor: '#1E88E5' }}>Login</button>
    </form>
  );
}

export default LoginForm;
