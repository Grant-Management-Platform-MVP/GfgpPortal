import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';


function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const BASE_URL = '/api/';
      // const BASE_URL = 'http://localhost:8090/api/';

      const res = await fetch(BASE_URL + 'auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const contentType = res.headers.get("content-type");
      let errorMessage = 'Login failed. Wrong username or password.';

      if (!res.ok) {
        if (contentType?.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        toast.error(errorMessage);
        return;
      }

      const user = await res.json();
      toast.success('Login successful!');
      localStorage.setItem('user', JSON.stringify(user));

      setTimeout(() => {
        switch (user.role) {
          case 'GRANTEE':
            console.log('Navigating to /grantee');
            navigate('/grantee');
            break;
          case 'GRANTOR':
            navigate('/grantor');
            break;
          case 'AUDITOR':
            navigate('/auditor');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          default:
            toast.error('Unknown role.');
      }
    }, 500);

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
