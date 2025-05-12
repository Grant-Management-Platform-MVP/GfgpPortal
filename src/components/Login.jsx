import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // const BASE_URL = 'http://localhost:8090/api/';
      const BASE_URL = '/api/';
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
        setLoading(false);
        return;
      }

      const user = await res.json();
      toast.success('Login successful!');
      localStorage.setItem('user', JSON.stringify(user));

      setTimeout(() => {
        switch (user.role) {
          case 'GRANTEE':
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
        setLoading(false);
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="form-floating mb-3">
        <input
          type="text"
          className="form-control"
          id="usernameInput"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <label htmlFor="usernameInput">Username</label>
      </div>

      <div className="form-floating mb-4">
        <input
          type="password"
          className="form-control"
          id="passwordInput"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <label htmlFor="passwordInput">Password</label>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg w-100"
        style={{ backgroundColor: '#1E88E5' }}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;