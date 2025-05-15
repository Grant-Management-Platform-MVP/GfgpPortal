import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronUp, Plus, Trash, Eye } from "lucide-react";
import { Modal, Button } from "react-bootstrap";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminQuestionnaireBuilder = () => {
  const [structure, setStructure] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const addSection = () => {
    setSections([
      ...sections,
      {
        sectionId: uuidv4(),
        title: "",
        description: "",
        displayOrder: sections.length + 1,
        questions: [],
        expanded: true,
      },
    ]);
  };

  const removeSection = (index) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated);
  };

  const toggleSection = (index) => {
    const updated = [...sections];
    updated[index].expanded = !updated[index].expanded;
    setSections(updated);
  };

  const updateSectionField = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const addQuestion = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].questions.push({
      id: uuidv4(),
      questionCode: "",
      questionText: "",
      type: "TEXT",
      required: false,
      options: [],
      guidance: "",
      uploadEvidence: false,
      conditional: null,
      typeConfig: {},
    });
    setSections(updated);
  };

  const updateQuestionField = (sectionIndex, questionIndex, field, value) => {
    const updated = [...sections];
    updated[sectionIndex].questions[questionIndex][field] = value;
    setSections(updated);
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].questions.splice(questionIndex, 1);
    setSections(updated);
  };

  const handleSubmit = async () => {
    const versionCode = `${structure.toUpperCase()}_${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

    const payload = {
      structure,
      title,
      templateCode: versionCode,
      version: "1.0",
      contentJson: {
        templateCode: versionCode,
        version: "1.0",
        sections: sections.map(({ ...s }) => s),
      },
    };

    const res = await fetch(BASE_URL +"gfgp/questionnaire-templates/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Questionnaire template created successfully.");
      setStructure("");
      setTitle("");
      setSections([]);
    } else {
      toast.error("Failed to create template.");
    }
  };

  const renderPreview = () => (
    <>
      <h5>{title}</h5>
      <p><strong>Structure:</strong> {structure}</p>
      {sections.map((s, i) => (
        <div key={s.sectionId} className="mb-3">
          <h6>{i + 1}. {s.title}</h6>
          <p>{s.description}</p>
          <ul>
            {s.questions.map((q, qi) => (
              <li key={q.id}>
                <strong>{q.questionText}</strong> ({q.type})<br />
                {q.guidance && <small><em>{q.guidance}</em></small>}<br />
                {q.options && q.options.length > 0 && (
                  <ul>
                    {q.options.map((opt, oi) => <li key={oi}>{opt}</li>)}
                  </ul>
                )}
                {q.uploadEvidence && <small className="text-success">Requires evidence upload</small>}
                {q.conditional && (
                  <div><small>Shown if <strong>{q.conditional.questionId}</strong> is {q.conditional.showIf.join(", ")}</small></div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <div className="container py-4">
      <h1 className="mb-4 h3">Create Questionnaire</h1>

      <div className="mb-3">
        <label className="form-label">Structure</label>
        <select
          className="form-select"
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
        >
          <option value="">Select structure</option>
          <option value="foundation">Foundation</option>
          <option value="advanced">Advanced</option>
          <option value="tiered">Tiered</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Questionnaire Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., GFGP Advanced Template v1"
        />
      </div>

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Sections</h5>
          <button className="btn btn-sm btn-primary" onClick={addSection}>
            <Plus size={16} className="me-1" /> Add Section
          </button>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={section.sectionId} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Section {sectionIndex + 1}</strong>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  {section.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeSection(sectionIndex)}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
            {section.expanded && (
              <div className="card-body">
                <input
                  className="form-control mb-2"
                  placeholder="Section Title"
                  value={section.title}
                  onChange={(e) => updateSectionField(sectionIndex, "title", e.target.value)}
                />
                <textarea
                  className="form-control mb-3"
                  placeholder="Section Description"
                  value={section.description}
                  onChange={(e) => updateSectionField(sectionIndex, "description", e.target.value)}
                />

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Questions</strong>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => addQuestion(sectionIndex)}
                  >
                    <Plus size={16} className="me-1" /> Add Question
                  </button>
                </div>

                {section.questions.map((q, questionIndex) => (
                  <div key={q.id} className="border p-3 rounded bg-light mb-3">
                    <input
                      className="form-control mb-2"
                      placeholder="Question Text"
                      value={q.questionText}
                      onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "questionText", e.target.value)}
                    />
                    <input
                      className="form-control mb-2"
                      placeholder="Question Code"
                      value={q.questionCode}
                      onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "questionCode", e.target.value)}
                    />
                    <select
                      className="form-select mb-2"
                      value={q.type}
                      onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "type", e.target.value)}
                    >
                      <option value="TEXT">Text</option>
                      <option value="SINGLE_CHOICE">Single Choice</option>
                      <option value="MULTI_CHOICE">Multiple Choice</option>
                      <option value="FILE_UPLOAD">File Upload</option>
                    </select>
                    {(q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE") && (
                      <input
                        className="form-control mb-2"
                        placeholder="Comma-separated options"
                        value={q.options.join(", ")}
                        onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "options", e.target.value.split(",").map(o => o.trim()))}
                      />
                    )}
                    <textarea
                      className="form-control mb-2"
                      placeholder="Guidance (optional)"
                      value={q.guidance}
                      onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "guidance", e.target.value)}
                    />
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={q.required}
                        onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "required", e.target.checked)}
                      />
                      <label className="form-check-label">Required</label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={q.uploadEvidence}
                        onChange={(e) => updateQuestionField(sectionIndex, questionIndex, "uploadEvidence", e.target.checked)}
                      />
                      <label className="form-check-label">Requires Evidence Upload</label>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeQuestion(sectionIndex, questionIndex)}
                    >
                      Remove Question
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="d-flex gap-3 mb-3">
        <button className="btn btn-outline-secondary" onClick={() => setShowModal(true)}>
          <Eye className="me-1" size={16} /> Preview
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!structure || !title || sections.length === 0}
        >
          Submit Questionnaire
        </button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Preview Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderPreview()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminQuestionnaireBuilder;