import React, { useState } from 'react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'GRANTEE'
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Registration successful!');
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'GRANTEE'
        });
      } else {
        const errorData = await response.json();
        alert(`Registration failed: ${errorData.message || 'Try again.'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="username" className="form-label">Username</label>
        <input type="text" className="form-control" id="username" required value={formData.username} onChange={handleChange} />
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email</label>
        <input type="email" className="form-control" id="email" required value={formData.email} onChange={handleChange} />
      </div>
      <div className="mb-3">
        <label htmlFor="password" className="form-label">Password</label>
        <input type="password" className="form-control" id="password" required value={formData.password} onChange={handleChange} />
      </div>
      <div className="mb-3">
        <label htmlFor="role" className="form-label">Role</label>
        <select className="form-select" id="role" value={formData.role} onChange={handleChange}>
          <option value="GRANTEE">Grantee</option>
          <option value="GRANTOR">Grantor</option>
          <option value="AUDITOR">Auditor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <button type="submit" className="btn btn-success btn-lg w-100" style={{backgroundColor: '#04ca75'}}>Register</button>
    </form>
  );
};

export default RegisterForm;
