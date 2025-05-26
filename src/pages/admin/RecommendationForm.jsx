import { useState, useEffect } from "react";
import axios from "axios";

export default function RecommendationForm() {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    sectionId: "",
    conditionType: "ALL_YES",
    title: "",
    recommendationText: "",
    priority: "MEDIUM",
    weight: 1.0,
    templateCode: "",
    templateVersion: "",
  });

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    axios.get(BASE_URL + "gfgp/sections")
      .then(res => setSections(res.data));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = e => {
    const sectionId = e.target.value;
    const selectedSection = sections.find(sec => sec.sectionId === sectionId);
    setForm(prev => ({
      ...prev,
      sectionId,
      title: selectedSection?.sectionTitle || "",
      templateCode: selectedSection?.templateCode || "",
      templateVersion: selectedSection?.templateVersion || "",
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post(BASE_URL+"gfgp/recommendations/create", form)
      .then(() => alert("Recommendation created successfully!"));
  };

  return (
    <div className="container p-4 border rounded shadow-sm bg-light">
      <h4 className="mb-4">Add Section Recommendation</h4>

      <form onSubmit={handleSubmit}>
        {/* Section */}
        <div className="mb-3">
          <label className="form-label">Section</label>
          <select className="form-select" name="sectionId" value={form.sectionId} onChange={handleSectionChange} required>
            <option value="">-- Select Section --</option>
            {sections.map(sec => (
              <option key={sec.sectionId} value={sec.sectionId}>
                {sec.title} ({sec.templateCode} v{sec.templateVersion})
              </option>
            ))}
          </select>
        </div>

        {/* Condition Type */}
        <div className="mb-3">
          <label className="form-label">Condition Type</label>
          <select className="form-select" name="conditionType" value={form.conditionType} onChange={handleChange}>
            <option value="ALL_YES">All answers are YES</option>
            <option value="ANY_NO">Any answer is NO</option>
            <option value="IN_PROGRESS">Any answer is IN-PROGRESS</option>
            <option value="CUSTOM">Custom Logic (Advanced users)</option>
          </select>
          <div className="form-text text-muted">
            Use this to define when a recommendation should trigger.
          </div>
        </div>

        {/* Recommendation Text Description */}
        <div className="mb-3">
          <label className="form-label">Recommendation Text Description</label>
          <textarea
            className="form-control"
            name="recommendationText"
            rows="4"
            value={form.recommendationText}
            onChange={handleChange}
            placeholder="E.g., Organization should develop a written procurement policy to comply with standard XYZ."
            required
          />
        </div>

        {/* Priority */}
        <div className="mb-3">
          <label className="form-label">Priority</label>
          <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <div className="form-text">Indicates how urgent or critical this recommendation is.</div>
        </div>

        {/* Hidden Inputs (templateCode & templateVersion auto-populated) */}
        <input type="hidden" name="templateCode" value={form.templateCode} />
        <input type="hidden" name="templateVersion" value={form.templateVersion} />

        <button className="btn btn-primary">Save Recommendation</button>
      </form>
    </div>
  );
}
