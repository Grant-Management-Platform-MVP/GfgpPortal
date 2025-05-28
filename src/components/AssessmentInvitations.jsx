import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";

const AssessmentInvitationWizard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const [step, setStep] = useState(1);
  const [structure, setStructure] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [grantees, setGrantees] = useState([]);
  const [selectedGrantee, setSelectedGrantee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const structures = ["foundation", "advanced", "tiered"]; // Ideally from API

  useEffect(() => {
    if (structure) {
      setLoading(true);
      axios.get(`${BASE_URL}gfgp/questionnaire-templates/fetch-all`)
        .then(res => setAssessments(res.data))
        .catch(err => console.error('Failed to fetch assessments', err))
        .finally(() => setLoading(false));
    }
  }, [structure]);

  useEffect(() => {
    if (step === 3) {
      setLoading(true);
      axios.get(BASE_URL + 'gfgp/grantees')
        .then(res => setGrantees(res.data))
        .catch(err => console.error('Failed to fetch grantees', err))
        .finally(() => setLoading(false));
    }
  }, [step]);

  const handleSend = async () => {
    if (!selectedGrantee) return;
    setSending(true);
    try {
      await axios.post(`${BASE_URL}gfgp/grantees/${userId}/${structure}/${selectedAssessment}/invite`, {
        email: selectedGrantee.email});
      toast.success(`Invitation sent to ${selectedGrantee.email}`);
      resetWizard();
    } catch (error) {
      console.error('Error sending invitation', error);
      toast.error('Failed to send invitation.');
    } finally {
      setSending(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setStructure('');
    setSelectedAssessment('');
    setSelectedGrantee(null);
  };

  const stepPercentage = {
    1: 33,
    2: 66,
    3: 100
  };

  return (
    <div className="container mt-4">
      <div className="alert alert-info">Invite Grantees to GFGP Assessments</div>

      {/* Progress bar */}
      <div className="progress mb-4">
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${stepPercentage[step]}%` }}
          aria-valuenow={stepPercentage[step]}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          Step {step} of 3
        </div>
      </div>

      {/* Step 1 - Select Structure */}
      {step === 1 && (
        <>
          <h5>Select GFGP Structure</h5>
          <select
            className="form-select mt-2"
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
          >
            <option value="">-- Choose Structure --</option>
            {structures.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary mt-3"
            disabled={!structure}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </>
      )}

      {/* Step 2 - Select Assessment */}
      {step === 2 && (
        <>
          <h5>Select Assessment for "{structure}"</h5>
          {loading ? (
            <p>Loading assessments...</p>
          ) : (
            <>
              <select
                className="form-select mt-2"
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
              >
                <option value="">-- Choose Assessment --</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (v{a.version})
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <button className="btn btn-secondary me-2" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary" disabled={!selectedAssessment} onClick={() => setStep(3)}>Next</button>
              </div>
            </>
          )}
        </>
      )}

      {/* Step 3 - Select Grantee */}
      {step === 3 && (
        <>
          <h5>Select Grantee</h5>
          {loading ? (
            <p>Loading grantees...</p>
          ) : (
            <>
              <table className="table table-bordered table-hover mt-2">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {grantees.map((g, i) => (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td>{g.name}</td>
                      <td>{g.email}</td>
                      <td>{g.name}</td>
                      <td>
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => setSelectedGrantee(g)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedGrantee && (
                <div className="alert alert-success mt-3">
                  Selected: <strong>{selectedGrantee.email}</strong>
                </div>
              )}

              <div className="mt-3">
                <button className="btn btn-secondary me-2" onClick={() => setStep(2)}>Back</button>
                <button className="btn btn-success" disabled={!selectedGrantee || sending} onClick={handleSend}>
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AssessmentInvitationWizard;