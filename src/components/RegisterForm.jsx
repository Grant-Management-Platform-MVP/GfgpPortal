import React, { useState } from "react";
import { toast } from "react-toastify";
import { Form, Button, ProgressBar } from "react-bootstrap";

const DEFAULT_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  orgName: "",
  orgType: [],
  registrationNumbers: [""],
  requestedRole: "",
};

const ORG_TYPES = [
  "Charitable/Foundation",
  "Charitable/other",
  "Community Based",
  "Community Societal",
  "Foundation",
  "Government",
  "Independent",
  "International NGO",
  "National NGO",
  "Non Government",
  "Not for profit",
  "Other Public Sector",
  "Parastatal",
  "Private Sector",
  "Public Sector",
  "Private Partnership",
  "Regional NGO",
  "State owned enterprises",
  "Training Trust",
  "University, Academic and Research",
  "Other"
];

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RegisterForm = ({ onRegistrationSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleMultiSelectChange = (e) => {
    const options = [...e.target.selectedOptions].map((opt) => opt.value);
    setFormData((prev) => ({ ...prev, orgType: options }));
  };

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

  const validateStep = () => {
    if (step === 1) {
      const { fullName, email, password, confirmPassword } = formData;
      if (!fullName || !email || !password || !confirmPassword) {
        toast.error("Please fill all required fields in Step 1.");
        return false;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const { orgName, orgType, requestedRole, registrationNumbers } = formData;
    if (!orgName || !orgType.length || !requestedRole) {
      toast.error("Please fill all required fields in Step 2.");
      return;
    }
    if (registrationNumbers.some((num) => num.trim() === "")) {
      toast.error("All registration numbers must be filled.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(BASE_URL + "auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
          },
          organization: {
            name: formData.orgName,
            orgTypes: formData.orgType,
            registrationNumbers: formData.registrationNumbers,
            role: formData.requestedRole,
          },
        }),
      });

      if (res.ok) {
        toast.success("Registration submitted and pending approval.");
        setFormData(DEFAULT_FORM);
        if (typeof onRegistrationSuccess === "function") onRegistrationSuccess();
      } else {
        const error = await res.json().catch(() => res.text());
        toast.error("Registration failed: " + (error.message || error));
      }
    } catch (err) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <ProgressBar now={(step / 2) * 100} className="mb-4"/>
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        {step === 1 && (
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Organization Name</Form.Label>
              <Form.Control
                type="text"
                name="orgName"
                placeholder="Your organization name"
                value={formData.orgName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Organization Type</Form.Label>
              <Form.Select
                name="orgType"
                value={formData.orgType}
                onChange={handleMultiSelectChange}
                multiple
                required
              >
                {ORG_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Registration Numbers</Form.Label>
              {formData.registrationNumbers.map((num, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    placeholder={`Registration number ${index + 1}`}
                    value={num}
                    onChange={(e) => handleRegNumberChange(index, e.target.value)}
                    required
                  />
                  {index > 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeRegNumber(index)}
                      className="ms-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={addRegNumber}>
                + Add Another
              </Button>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Register as</Form.Label>
              <Form.Select
                name="requestedRole"
                value={formData.requestedRole}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Role --</option>
                <option value="GRANTEE">Grantee</option>
                <option value="AUDITOR">Auditor</option>
                <option value="GRANTOR">Grantor</option>
              </Form.Select>
            </Form.Group>
          </>
        )}

        <div className="d-flex justify-content-between">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}
                    style={{ border: 'none', borderRadius: '30px' }}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button variant="primary" onClick={() => validateStep() && setStep(step + 1)}
             style={{ backgroundColor: '#043873', border: 'none', borderRadius: '30px' }}>
              Next
            </Button>
          ) : (
            <Button type="submit" className="btn btn-success" disabled={submitting}
                    style={{ backgroundColor: '#04ca75', border: 'none', borderRadius: '30px' }}>
              {submitting ? "Submitting..." : "Register"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;