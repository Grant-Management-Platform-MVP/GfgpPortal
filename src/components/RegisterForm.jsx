import React, { useState } from "react";
import { toast } from "react-toastify";

const DEFAULT_FORM = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  orgName: "",
  orgType: "",
  registrationNumbers: [""],
};

const BASE_URL = import.meta.env.VITE_BASE_URL;
const RegisterForm = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleRegNumberChange = (index, value) => {
    const updated = [...formData.registrationNumbers];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, registrationNumbers: updated }));
  };

  const addRegNumber = () =>
    setFormData((prev) => ({
      ...prev,
      registrationNumbers: [...prev.registrationNumbers, ""],
    }));

  const removeRegNumber = (index) =>
    setFormData((prev) => ({
      ...prev,
      registrationNumbers: prev.registrationNumbers.filter((_, i) => i !== index),
    }));

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    if (formData.registrationNumbers.some((num) => num.trim() === "")) {
      toast.error("All registration numbers must be filled.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const res = await fetch(BASE_URL + "auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();

      if (res.ok) {
        toast.success("Your registration has been submitted and is pending approval.");
        setFormData(DEFAULT_FORM);
        setTimeout(() => window.location.reload(), 2500);
      } else {
        toast.error("Registration failed: " + text);
      }
    } catch (err) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="row">
        <div className="col-md-6">
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Username */}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="col-md-6">
          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Organization Name */}
          <div className="mb-3">
            <label className="form-label">Organization Name</label>
            <input
              type="text"
              name="orgName"
              className="form-control"
              value={formData.orgName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Organization Type */}
          <div className="mb-3">
            <label className="form-label">Organization Type</label>
            <input
              type="text"
              name="orgType"
              className="form-control"
              value={formData.orgType}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Registration Numbers */}
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
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeRegNumber(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline-primary btn-sm mt-1"
          onClick={addRegNumber}
        >
          + Add Another
        </button>
      </div>

      <button
        type="submit"
        className="btn btn-success btn-lg w-100"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Submitting...
          </>
        ) : (
          "Register"
        )}
      </button>
    </form>
  );
};

export default RegisterForm;