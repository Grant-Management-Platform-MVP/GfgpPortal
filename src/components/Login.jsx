import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in both username and password.");
      return;
    }
    setLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const res = await fetch(BASE_URL + 'auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get("content-type");
      let errorMessage = 'Login failed. Wrong username or password.';

      if (!res.ok) {
        try {
          if (contentType?.includes("application/json")) {
            const errorData = await res.json();
            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } else {
            const text = await res.text();
            if (text) {
              errorMessage = text;
            }
          }
        } catch (parseErr) {
          console.error('Error parsing error response:', parseErr);
        }

        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      const user = await res.json();
      if (user.status !== 'APPROVED') {
        toast.error('Access denied, your account is still pending approval. Please contact the administrator.');
        setUsername('');
        setPassword('');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');
      localStorage.setItem('user', JSON.stringify(user));

      setTimeout(() => {
        switch (user.role) {
          case 'GRANTEE':
            if (!user.hasSelectedStructure) {
              navigate('/grantee/select-structure');
            } else {
              const storedUser = JSON.parse(localStorage.getItem('user'));
              const gfgpStructure = storedUser?.selectedStructure || storedUser?.userId;
              localStorage.setItem('gfgpStructure', gfgpStructure);
              navigate('/grantee');
            }
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
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate autoComplete='off'>
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

      <div className="form-floating mb-4 position-relative">
        <input
          type={showPassword ? "text" : "password"}
          className="form-control"
          id="passwordInput"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <label htmlFor="passwordInput">Password</label>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
          onClick={() => setShowPassword(prev => !prev)}
          tabIndex={-1}
          style={{ zIndex: 2 }}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg w-100"
        style={{ backgroundColor: '#04ca75', border: 'none', borderRadius: '30px' }}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;