import React, { useState } from "react";
import { toast } from "react-toastify";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    orgName: "",
    orgType: "",
    registrationNumbers: [""],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegNumberChange = (index, value) => {
    const updatedNumbers = [...formData.registrationNumbers];
    updatedNumbers[index] = value;
    setFormData({ ...formData, registrationNumbers: updatedNumbers });
  };

  const addRegNumber = () => {
    setFormData({
      ...formData,
      registrationNumbers: [...formData.registrationNumbers, ""],
    });
  };

  const removeRegNumber = (index) => {
    const updatedNumbers = formData.registrationNumbers.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, registrationNumbers: updatedNumbers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };

      // const BASE_URL = "http://localhost:8090/api/";
      const BASE_URL = "/api/";

      const response = await fetch(BASE_URL + "auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.text();

      if (response.ok) {
        toast.success("Your registration has been submitted and is pending approval.");
          // clear form
        setFormData({
          fullName: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          orgName: "",
          orgType: "",
          registrationNumbers: [""],
        });

        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        toast.error("Registration failed: " + result);
      }
    } catch (err) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="mb-3">
        <label htmlFor="fullName" className="form-label">Full Name</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          className="form-control"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="username" className="form-label">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          className="form-control"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-control"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-control"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          className="form-control"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="orgName" className="form-label">Organization Name</label>
        <input
          type="text"
          id="orgName"
          name="orgName"
          className="form-control"
          value={formData.orgName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="orgType" className="form-label">Organization Type</label>
        <input
          type="text"
          id="orgType"
          name="orgType"
          className="form-control"
          value={formData.orgType}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Registration Numbers</label>
        {formData.registrationNumbers.map((num, index) => (
          <div key={index} className="d-flex align-items-center mb-2">
            <input
              type="text"
              className="form-control me-2"
              value={num}
              onChange={(e) => handleRegNumberChange(index, e.target.value)}
              required
            />
            {index > 0 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRegNumber(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary btn-sm mt-1" onClick={addRegNumber}>
          + Add Another
        </button>
      </div>

      <button type="submit" className="btn btn-success btn-lg w-100" disabled={submitting}>
        {submitting ? "Submitting..." : "Register"}
      </button>
    </form>
  );
};

export default RegisterForm;