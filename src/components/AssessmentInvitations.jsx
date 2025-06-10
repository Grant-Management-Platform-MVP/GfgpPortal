import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";
import { Spinner, Alert, Button } from 'react-bootstrap';

const AssessmentInvitationWizard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const [step, setStep] = useState(1);
  const [structure, setStructure] = useState('');
  const [tieredLevel, setTieredLevel] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [grantees, setGrantees] = useState([]);
  const [selectedGrantee, setSelectedGrantee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Define the main structures.
  const mainStructures = [
    { id: "foundation", name: "Foundation" },
    { id: "advanced", name: "Advanced" },
    { id: "tiered", name: "Tiered" }
  ];

  // Define the tiered levels
  const tieredLevelsOptions = [
    { id: "platinum", name: "Platinum" },
    { id: "gold", name: "Gold" },
    { id: "silver", name: "Silver" },
    { id: "bronze", name: "Bronze" }
  ];

  // Effect to fetch assessments based on selected structure and tieredLevel
  useEffect(() => {
    if (structure) {
      setLoading(true);
      setSelectedAssessment(''); // Reset selected assessment when structure changes
      const params = { structure };
      if (structure === 'tiered' && tieredLevel) {
        params.tieredLevel = tieredLevel; // Add tieredLevel to params if 'tiered'
      } else if (structure === 'tiered' && !tieredLevel) {
        // If Tiered is selected but no sub-level, don't fetch assessments yet
        setAssessments([]);
        setLoading(false);
        return;
      }

      axios.get(`${BASE_URL}gfgp/questionnaire-templates/fetch-all`)
        .then(res => {
          const allAssessments = res.data; // Get all unfiltered data

          // Apply the filtering logic on the frontend
          const filteredAssessments = allAssessments.filter(assessment => {
            // Convert backend structure/tieredLevel to lowercase for robust comparison
            const backendStructure = assessment.structureType?.toLowerCase();
            const backendTieredLevel = assessment.tieredLevel?.toLowerCase(); // Can be null

            // If the selected structure is 'tiered', we need to match both structure and tieredLevel
            if (structure === 'tiered') {
              return backendStructure === 'tiered' && backendTieredLevel === tieredLevel;
            }
            // For 'foundation' or 'advanced', we match the structure and ensure tieredLevel is NOT present
            else {
              return backendStructure === structure && (backendTieredLevel === null || backendTieredLevel === undefined);
            }
          });
          setAssessments(filteredAssessments);
        })
        .catch(err => {
          console.error('Failed to fetch assessments', err);
          toast.error('Failed to fetch assessments.');
        })
        .finally(() => setLoading(false));
    } else {
      setAssessments([]); // Clear assessments if no structure is selected
    }
  }, [structure, tieredLevel, BASE_URL]); // Depend on tieredLevel now

  // Effect to fetch grantees
  useEffect(() => {
    if (step === 3) {
      setLoading(true);
      axios.get(BASE_URL + 'gfgp/grantees')
        .then(res => setGrantees(res.data))
        .catch(err => {
          console.error('Failed to fetch grantees', err);
          toast.error('Failed to fetch grantees.');
        })
        .finally(() => setLoading(false));
    }
  }, [step, BASE_URL]);

  const handleSend = async () => {
    if (!selectedGrantee || !selectedAssessment || !structure || (structure === 'tiered' && !tieredLevel)) {
      toast.error('Please ensure all selections are made.');
      return;
    }

    // === 🔒 Business Rule Check ===
    const hasDoneTiered = selectedGrantee.assessments.some(a => a.structure === 'tiered');

    const isAttemptingDowngrade =
      hasDoneTiered &&
      (structure === 'foundation' || structure === 'advanced');

    if (isAttemptingDowngrade) {
      toast.error(`This grantee has already completed a Tiered assessment and cannot be invited to Foundation or Advanced structures.`);
      return;
    }

    // === ✅ Proceed with Invite ===
    setSending(true);
    try {
      const payload = {
        email: selectedGrantee.email,
        structure: structure,
        selectedAssessment: selectedAssessment,
        tieredLevel: structure === 'tiered' ? tieredLevel : null,
      };

      const inviteUrl = `${BASE_URL}gfgp/grantees/${userId}/invite`;

      await axios.post(inviteUrl, payload);
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
    setTieredLevel(''); // Reset tiered level
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
      <Alert variant="info" className="text-center">
        <h4>Invite Grantees to GFGP Assessments</h4>
        <p className="mb-0">Follow the steps to send out assessment invitations.</p>
      </Alert>

      {/* Progress bar */}
      <div className="progress mb-4" style={{ height: '25px' }}>
        <div
          className="progress-bar progress-bar-striped progress-bar-animated bg-success"
          role="progressbar"
          style={{ width: `${stepPercentage[step]}%` }}
          aria-valuenow={stepPercentage[step]}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <strong className="text-white">Step {step} of 3</strong>
        </div>
      </div>

      {/* Step 1 - Select Structure */}
      {step === 1 && (
        <div className="card p-4 shadow-sm">
          <h5 className="mb-3">1. Select GFGP Structure</h5>
          <div className="mb-3">
            <label htmlFor="structureSelect" className="form-label">Choose main structure:</label>
            <select
              id="structureSelect"
              className="form-select"
              value={structure}
              onChange={(e) => {
                setStructure(e.target.value);
                setTieredLevel(''); // Reset tiered level if main structure changes
              }}
            >
              <option value="">-- Choose Structure --</option>
              {mainStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional rendering for Tiered sub-level selection */}
          {structure === 'tiered' && (
            <div className="mb-3 mt-3 p-3 border rounded bg-light">
              <label htmlFor="tieredLevelSelect" className="form-label">Choose Tiered Level:</label>
              <select
                id="tieredLevelSelect"
                className="form-select"
                value={tieredLevel}
                onChange={(e) => setTieredLevel(e.target.value)}
              >
                <option value="">-- Select Tiered Level --</option>
                {tieredLevelsOptions.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            className="mt-3"
            disabled={!structure || (structure === 'tiered' && !tieredLevel)}
            onClick={() => setStep(2)}
          >
            Next <i className="bi bi-arrow-right"></i>
          </Button>
        </div>
      )}

      {/* Step 2 - Select Assessment */}
      {step === 2 && (
        <div className="card p-4 shadow-sm">
          <h5 className="mb-3">2. Select Assessment for "{structure}{structure === 'tiered' ? ` (${tieredLevel})` : ''}"</h5>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" className="me-2" />
              <p className="d-inline-block">Loading assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <Alert variant="warning">
              No assessments found for the selected criteria.
            </Alert>
          ) : (
            <div className="mb-3">
              <label htmlFor="assessmentSelect" className="form-label">Choose assessment:</label>
              <select
                id="assessmentSelect"
                className="form-select"
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
              >
                <option value="">-- Choose Assessment --</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} (version - {a.version})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 d-flex justify-content-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <i className="bi bi-arrow-left"></i> Back
            </Button>
            <Button variant="primary" disabled={!selectedAssessment || assessments.length === 0} onClick={() => setStep(3)}>
              Next <i className="bi bi-arrow-right"></i>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 - Select Grantee */}
      {step === 3 && (
        <div className="card p-4 shadow-sm">
          <h5 className="mb-3">3. Select Grantee to Invite</h5>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" className="me-2" />
              <p className="d-inline-block">Loading grantees...</p>
            </div>
          ) : grantees.length === 0 ? (
            <Alert variant="warning">
              No grantees found. Please add grantees first.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Organization</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grantees.map((g, i) => (
                      <tr key={g.id}>
                        <td>{i + 1}</td>
                        <td>{g.name}</td>
                        <td>{g.email}</td>
                        <td>{g.organizationName || 'N/A'}</td> {/* Assuming organizationName might be part of grantee object */}
                        <td>
                          <Button
                            variant={selectedGrantee?.id === g.id ? 'success' : 'outline-success'}
                            size="sm"
                            onClick={() => setSelectedGrantee(g)}
                          >
                            {selectedGrantee?.id === g.id ? 'Selected' : 'Select'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {selectedGrantee && (
                <Alert variant="success" className="mt-3">
                  Selected Grantee: <strong>{selectedGrantee.name}</strong> ({selectedGrantee.email})
                </Alert>
              )}

              <div className="mt-4 d-flex justify-content-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <i className="bi bi-arrow-left"></i> Back
                </Button>
                <Button
                  variant="success"
                  disabled={!selectedGrantee || sending}
                  onClick={handleSend}
                >
                  {sending ? (
                    <>
                      <Spinner size="sm" className="me-2" /> Sending...
                    </>
                  ) : (
                    <>
                      Send Invitation <i className="bi bi-envelope-fill"></i>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentInvitationWizard;