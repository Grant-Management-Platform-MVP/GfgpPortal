import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Alert, Button, Form, Modal, Container } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronUp, Plus, Trash, Eye } from "lucide-react"; // Icons from lucide-react
import { toast } from 'react-toastify'; // Toast notifications
import 'react-toastify/dist/ReactToastify.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Fixed options for single choice questions, mirroring DynamicQuestionnaireBuilder
const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];

const QuestionnaireEditor = () => {
  const { id } = useParams(); // Template ID from URL
  const [questionnaireTitle, setQuestionnaireTitle] = useState("");
  const [questionnaireStructure, setQuestionnaireStructure] = useState("");
  const [sections, setSections] = useState([]); // Core data structure
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Renamed to avoid clash
  const [deleteTarget, setDeleteTarget] = useState(null); // Stores info about what to delete (section, subsection, question)
  const [showPreviewModal, setShowPreviewModal] = useState(false); // For preview modal
  const [structure, setStructure] = useState("");
  const [tieredLevel, setTieredLevel] = useState('');

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  // Define the main structures.
  const mainStructures = [
    { id: "foundation", name: "Foundation" },
    { id: "advanced", name: "Advanced" },
    { id: "tiered", name: "Tiered" }
  ];

  // Define the tiered levels
  const tieredLevelsOptions = [
    { id: "gold", name: "Gold" },
    { id: "silver", name: "Silver" },
    { id: "bronze", name: "Bronze" }
  ];


  // --- Utility Functions (Mirrored from DynamicQuestionnaireBuilder) ---

  /**
   * Recalculates "unit" weights in a bottom-up manner for frontend display.
   * Each question contributes 1 unit. Subsections sum question units, sections sum subsection units.
   * These are not the final backend-normalized weights.
   * @param {Array} currentSections The current array of sections to recalculate weights for.
   * @returns {Array} The updated array of sections with calculated "unit" weights.
   */
  const recalculateSectionWeights = useCallback((currentSections) => {
    const updatedSections = currentSections.map(section => {
      let sectionTotalWeight = 0;
      const updatedSubsections = (section.subsections || []).map(subsection => {
        let subsectionTotalWeight = 0;
        const updatedQuestions = (subsection.questions || []).map(question => {
          const qWeight = 1;
          subsectionTotalWeight += qWeight;
          return { ...question, weight: qWeight };
        });
        subsectionTotalWeight = parseFloat(subsectionTotalWeight.toFixed(2));
        sectionTotalWeight += subsectionTotalWeight;
        return { ...subsection, questions: updatedQuestions, weight: subsectionTotalWeight };
      });
      sectionTotalWeight = parseFloat(sectionTotalWeight.toFixed(2));
      return { ...section, subsections: updatedSubsections, weight: sectionTotalWeight };
    });
    return updatedSections;
  }, []);

  // --- Data Fetching and Initialization ---

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}gfgp/questionnaire-templates/id/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch template");
        }
        const data = await response.json();
        // Assuming the API returns an array, and we need the first item
        const templateObj = data[0];

        if (!templateObj || !templateObj.content) {
          throw new Error("Invalid template structure received.");
        }

        const parsedContent = JSON.parse(templateObj.content);

        // Normalize the fetched data to match the builder's structure
        // Ensure sections, subsections, and questions have UUIDs and default fields
        const normalizedSections = (parsedContent.sections || []).map(section => {
          // Ensure section has an ID and expanded state
          const newSection = {
            sectionId: section.sectionId || uuidv4(),
            title: section.title || "Untitled Section",
            description: section.description || "",
            displayOrder: section.displayOrder, // Preserve order if exists
            expanded: section.expanded !== undefined ? section.expanded : true, // Default to expanded
            weight: section.weight || 0, // Will be recalculated
            subsections: [], // Initialize subsections array
          };

          // If old template directly had questions, move them to a default subsection
          if (section.questions && section.questions.length > 0) {
            newSection.subsections.push({
              subsectionId: uuidv4(),
              title: "General Questions", // A default title for this auto-generated subsection
              description: "Questions from legacy structure.",
              weight: 0, // Will be recalculated
              questions: section.questions.map(q => ({
                id: q.id || uuidv4(),
                questionCode: q.questionCode || "",
                questionText: q.questionText || "",
                type: q.type || "SINGLE_CHOICE", // Default type
                required: q.required !== undefined ? q.required : true, // Default to required
                options: q.options || (q.type === "SINGLE_CHOICE" ? [...FIXED_OPTIONS] : []),
                guidance: q.guidance || "",
                conditional: q.conditional || null,
                uploadEvidence: q.uploadEvidence !== undefined ? q.uploadEvidence : true, // Default
                weight: q.weight || 1, // Will be recalculated by `recalculateSectionWeights`
                userResponse: q.userResponse || { answer: "", justification: "", evidence: null }, // Ensure consistent structure
              })),
            });
          } else if (section.subsections) {
            // If the template already has subsections, normalize them
            newSection.subsections = section.subsections.map(sub => ({
              subsectionId: sub.subsectionId || uuidv4(),
              title: sub.title || "Untitled Subsection",
              description: sub.description || "",
              weight: sub.weight || 0, // Will be recalculated
              questions: (sub.questions || []).map(q => ({
                id: q.id || uuidv4(),
                questionCode: q.questionCode || "",
                questionText: q.questionText || "",
                type: q.type || "SINGLE_CHOICE",
                required: q.required !== undefined ? q.required : true,
                options: q.options || (q.type === "SINGLE_CHOICE" ? [...FIXED_OPTIONS] : []),
                guidance: q.guidance || "",
                conditional: q.conditional || null,
                uploadEvidence: q.uploadEvidence !== undefined ? q.uploadEvidence : true,
                weight: q.weight || 1,
                userResponse: q.userResponse || { answer: "", justification: "", evidence: null },
              })),
            }));
          }

          return newSection;
        });

        // Set the main state variables
        setQuestionnaireTitle(templateObj.title || "");

        if (templateObj.structureType) {
          setStructure(templateObj.structureType);
        } else {
          setStructure('');
        }

        if (templateObj.structureType === 'tiered' && templateObj.tieredLevel) {
          setTieredLevel(templateObj.tieredLevel);
        } else {
          setTieredLevel('');
        }
        setQuestionnaireStructure(templateObj.structure || "");
        // Recalculate weights immediately after loading and normalizing
        setSections(recalculateSectionWeights(normalizedSections));

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load questionnaire template. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, recalculateSectionWeights, BASE_URL]); // Add BASE_URL to dependencies

  // --- Action Handlers (Mirrored from DynamicQuestionnaireBuilder) ---

  const addSection = () => {
    setSections((prevSections) => {
      const newSections = [
        ...prevSections,
        {
          sectionId: uuidv4(),
          title: "",
          description: "",
          weight: 0,
          displayOrder: prevSections.length + 1,
          subsections: [],
          expanded: true,
        },
      ];
      return recalculateSectionWeights(newSections);
    });
  };

  const addSubsection = (sectionIndex) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections];
      const sectionToUpdate = { ...updatedSections[sectionIndex] };

      const newSub = {
        subsectionId: uuidv4(),
        title: "",
        description: "",
        weight: 0,
        questions: [],
      };

      sectionToUpdate.subsections = [
        ...(sectionToUpdate.subsections || []),
        newSub,
      ];

      updatedSections[sectionIndex] = sectionToUpdate;
      return recalculateSectionWeights(updatedSections);
    });
  };

  const addSubsectionQuestion = (sectionIndex, subIndex) => {
    setSections((prevSections) => {
      const newSections = prevSections.map((section, sIdx) => {
        if (sIdx === sectionIndex) {
          return {
            ...section,
            subsections: section.subsections.map((sub, ssIdx) => {
              if (ssIdx === subIndex) {
                return {
                  ...sub,
                  questions: [
                    ...(sub.questions || []),
                    {
                      id: uuidv4(),
                      questionCode: "",
                      questionText: "",
                      type: "SINGLE_CHOICE", // Default
                      required: true, // Default
                      options: [...FIXED_OPTIONS], // Default options
                      guidance: "",
                      conditional: null,
                      uploadEvidence: true, // Default
                      weight: 1, // Default unit weight
                      userResponse: { answer: "", justification: "", evidence: null }, // Consistent structure
                    },
                  ],
                };
              }
              return sub;
            }),
          };
        }
        return section;
      });
      return recalculateSectionWeights(newSections);
    });
  };

  const updateSectionField = (index, field, value) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      const section = { ...updated[index] };
      section[field] = value;
      updated[index] = section;
      return updated;
    });
  };

  const updateSubsectionField = (sectionIndex, subIndex, field, value) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections];
      const section = { ...updatedSections[sectionIndex] };
      const subsection = { ...section.subsections[subIndex] };

      subsection[field] = value;
      section.subsections = [...section.subsections];
      section.subsections[subIndex] = subsection;
      updatedSections[sectionIndex] = section;
      return updatedSections;
    });
  };

  const updateSubsectionQuestionField = (sectionIndex, subIndex, questionIndex, field, value) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      const section = { ...updated[sectionIndex] };
      const subsection = { ...section.subsections[subIndex] };
      const question = { ...subsection.questions[questionIndex] };

      question[field] = value;
      subsection.questions = [...subsection.questions];
      subsection.questions[questionIndex] = question;
      section.subsections = [...section.subsections];
      section.subsections[subIndex] = subsection;
      updated[sectionIndex] = section;
      return updated;
    });
  };

  const toggleSection = (index) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      const section = { ...updated[index] };
      section.expanded = !section.expanded;
      updated[index] = section;
      return updated;
    });
  };

  const confirmDelete = (type, sectionIndex, subIndex = null, questionIndex = null) => {
    setDeleteTarget({ type, sectionIndex, subIndex, questionIndex });
    setShowConfirmModal(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    const { type, sectionIndex, subIndex, questionIndex } = deleteTarget;

    setSections((prevSections) => {
      let updatedSections = [...prevSections];

      if (type === "section") {
        updatedSections.splice(sectionIndex, 1);
      } else if (type === "subsection") {
        const section = { ...updatedSections[sectionIndex] };
        section.subsections = [...section.subsections];
        section.subsections.splice(subIndex, 1);
        updatedSections[sectionIndex] = section;
      } else if (type === "question") {
        const section = { ...updatedSections[sectionIndex] };
        const subsection = { ...section.subsections[subIndex] };
        subsection.questions = [...subsection.questions];
        subsection.questions.splice(questionIndex, 1);

        section.subsections = [...section.subsections];
        section.subsections[subIndex] = subsection;
        updatedSections[sectionIndex] = section;
      }
      return recalculateSectionWeights(updatedSections);
    });
    setShowConfirmModal(false);
    setDeleteTarget(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (structure === 'tiered' && !tieredLevel) {
      toast.error("Please select a Tiered Level (Gold, Silver, or Bronze).");
      setLoading(false);
      return;
    }
    try {
      const finalSections = recalculateSectionWeights(sections);
      const payload = {
        structure,
        questionnaireTitle,
        tieredLevel: structure === 'tiered' ? tieredLevel : null,
        contentJson: {
          templateCode: "",
          version: "1.0",
          sections: finalSections,
        },
      };

      const res = await fetch(`${BASE_URL}gfgp/questionnaire-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Questionnaire template updated successfully!");
      } else {
        const errorData = await res.json();
        toast.error(`Failed to update template: ${errorData.message || res.statusText}`);
      }
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      toast.error("An error occurred while saving the template.");
    } finally {
      setLoading(false);
    }
  };

  // --- Preview Renderer (Mirrored from DynamicQuestionnaireBuilder) ---

  const renderPreview = () => {
    const renderSubsectionWeightSum = (subsections) =>
      subsections.reduce((sum, sub) => sum + (sub.weight || 0), 0);

    return (
      <>
        <h5 className="text-xl font-semibold mb-2">{questionnaireTitle}</h5>
        <p className="text-gray-700 mb-1"><strong>Structure:</strong> {questionnaireStructure}</p>
        <p className="text-gray-700 mb-4">
          <strong>Note:</strong> Weights shown below are "unit" weights calculated on the frontend for structural representation. The final, normalized scoring weights are defined and applied by the backend.
        </p>

        {sections.map((s, i) => {
          const subsectionTotalUnits = renderSubsectionWeightSum(s.subsections || []);
          return (
            <div key={s.sectionId} className="mb-4 p-3 border rounded-lg bg-gray-50">
              <h6 className="text-lg font-medium mb-1">
                {i + 1}. {s.title} (Section Units: {s.weight})
              </h6>
              <p className="text-gray-600 mb-2">{s.description}</p>

              {(s.subsections || []).length > 0 && (
                <p className="ps-3 text-gray-700">
                  <strong>Total Subsection Units for this Section:</strong>{" "}
                  <span className={subsectionTotalUnits !== s.weight ? "text-red-500" : "text-green-600"}>
                    {subsectionTotalUnits}
                  </span>{" "}
                  {subsectionTotalUnits !== s.weight && `(Should equal section's ${s.weight})`}
                </p>
              )}

              {(s.subsections || []).map((sub, subIndex) => (
                <div key={sub.subsectionId} className="mb-3 ps-4 border-l-4 border-blue-200 bg-white p-3 rounded-md shadow-sm">
                  <h6 className="text-md font-medium mb-1">
                    {`${i + 1}.${subIndex + 1} ${sub.title} (Subsection Units: ${sub.weight})`}
                  </h6>
                  <p className="text-gray-600 mb-2">{sub.description}</p>
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {(sub.questions || []).map((q) => (
                      <li key={q.id} className="mb-1">
                        <strong>{q.questionText}</strong> (Code: {q.questionCode}, Type: {q.type}, Units: {q.weight})<br />
                        {q.guidance && <small className="text-gray-500"><em>Guidance: {q.guidance}</em></small>}<br />
                        {q.options?.length > 0 && (
                          <div className="flex flex-wrap gap-1 text-xs text-blue-700 mt-1">
                            Options: {q.options.map((opt, optIndex) => (
                              <span key={optIndex} className="bg-blue-100 px-1.5 py-0.5 rounded-full">{opt}</span>
                            ))}
                          </div>
                        )}
                        {q.uploadEvidence && (
                          <small className="text-green-600 block mt-1">Requires evidence upload</small>
                        )}
                        {q.conditional && (
                          <div className="text-xs text-purple-700 mt-1">
                            <small>
                              Conditional: Shown if <strong>{q.conditional.questionId}</strong> is{" "}
                              {q.conditional.showIf.join(", ")}
                            </small>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  };


  // --- Render UI ---

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="lead">Loading questionnaire editor...</p>
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger" className="m-4">{error}</Alert>;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4 h3">Editing Questionnaire: {questionnaireTitle}</h1>

      {/* Overall Questionnaire Properties */}
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">Choose your Structure</h5>
        <div className="mb-3">
          <select
            id="structureSelect"
            className="form-select"
            value={structure}
            onChange={(e) => {
              setStructure(e.target.value);
              setTieredLevel('');
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
              required
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
      </div>

      <div className="mb-4">
        <label htmlFor="questionnaire-title" className="form-label">Questionnaire Title</label>
        <input
          type="text"
          id="questionnaire-title"
          className="form-control"
          value={questionnaireTitle}
          onChange={(e) => setQuestionnaireTitle(e.target.value)}
          placeholder="e.g., GFGP Advanced Template v1"
        />
      </div>

      {/* Sections Management */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-xl font-semibold text-gray-800">Sections</h5>
          <button
            className="btn btn-sm btn-primary btn-lg"
            onClick={addSection}
          >
            <Plus size={18} className="mr-2" /> Add Section
          </button>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={section.sectionId} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Section {sectionIndex + 1} - {section.title || 'New Section'} (Units: {section.weight})</strong>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-full me-2 transition duration-200 ease-in-out"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  {section.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <button
                  className="btn btn-sm btn-outline-danger rounded-full transition duration-200 ease-in-out"
                  onClick={() => confirmDelete("section", sectionIndex)}
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
            {section.expanded && (
              <div className="p-4">
                <input
                  className="form-control mb-2"
                  placeholder="Section Title"
                  value={section.title}
                  onChange={(e) => updateSectionField(sectionIndex, "title", e.target.value)}
                />
                <ReactQuill
                  style={{ minHeight: "110px", marginBottom: "1rem" }}
                  theme="snow"
                  value={section.description}
                  placeholder="Section Description"
                  onChange={(content) =>
                    updateSectionField(
                      sectionIndex,
                      "description",
                      content
                    )
                  }
                />
                <div className="d-flex gap-3 mb-3">
                  <strong>Subsections</strong>
                  <button
                    className="btn btn-success btn-sm transition duration-200 ease-in-out"
                    onClick={() => addSubsection(sectionIndex)}
                  >
                    <Plus size={16} className="mr-1" />
                    Add Subsection
                  </button>
                </div>

                {/* Render Subsections */}
                {(section.subsections || []).map((sub, subIndex) => (
                  <div
                    key={sub.subsectionId}
                    className="card mb-3 p-3 bg-light"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Subsection {subIndex + 1} - {sub.title || 'New Subsection'} (Units: {sub.weight})</h6>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => confirmDelete("subsection", sectionIndex, subIndex)}
                      >
                        <Trash size={16} /> Remove Subsection
                      </button>
                    </div>

                    <input
                      className="form-control mb-2"
                      placeholder={`Subsection ${subIndex + 1} Title`}
                      value={sub.title}
                      onChange={(e) =>
                        updateSubsectionField(sectionIndex, subIndex, "title", e.target.value)
                      }
                    />
                    <ReactQuill
                      style={{ minHeight: "110px", marginBottom: "1rem" }}
                      theme="snow"
                      value={sub.description}
                      placeholder="Subsection Description"
                      onChange={(content) =>
                        updateSubsectionField(
                          sectionIndex,
                          subIndex,
                          "description",
                          content
                        )
                      }
                    />

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Questions</strong>
                      <button
                        className="btn btn-success"
                        onClick={() => addSubsectionQuestion(sectionIndex, subIndex)}
                      >
                        <Plus size={16} className="mr-1" />
                        Add Question
                      </button>
                    </div>

                    {/* Render Questions */}
                    {(sub.questions || []).map((q, questionIndex) => (
                      <div
                        key={q.id} // Use question ID for key
                        className="border p-3 rounded bg-white mb-3 shadow-sm"
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>Question {questionIndex + 1} (Units: {q.weight})</strong>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => confirmDelete("question", sectionIndex, subIndex, questionIndex)}
                          >
                            <Trash size={16} /> Delete
                          </button>
                        </div>

                        <Form.Group className="mb-2">
                          <Form.Label>Question Text</Form.Label>
                          <ReactQuill
                            style={{ minHeight: "110px", marginBottom: "1rem" }}
                            theme="snow"
                            value={q.questionText}
                            placeholder="Question Text"
                            onChange={(content) =>
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "questionText",
                                content
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Question Code (e.g., Q1.1)</Form.Label>
                          <Form.Control
                            placeholder="Question Code"
                            value={q.questionCode}
                            onChange={(e) =>
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "questionCode",
                                e.target.value
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Guidance (optional)</Form.Label>
                          <ReactQuill
                            style={{ minHeight: "110px", marginBottom: "1rem" }}
                            theme="snow"
                            value={q.guidance}
                            placeholder="Guidance"
                            onChange={(content) =>
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "guidance",
                                content
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Question Type</Form.Label>
                          <Form.Select
                            value={q.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              const updatedOptions =
                                newType === "SINGLE_CHOICE" ? [...FIXED_OPTIONS] : [];
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "type",
                                newType
                              );
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "options",
                                updatedOptions
                              );
                            }}
                          >
                            <option value="SINGLE_CHOICE">Single Choice</option>
                            {/* Add other types as needed */}
                          </Form.Select>
                        </Form.Group>

                        {(q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE") && (
                          <Form.Group className="mb-2">
                            <Form.Label>Options (comma-separated)</Form.Label>
                            <Form.Control
                              placeholder="Option1, Option2, Option3"
                              value={q.options?.join(", ") || ""}
                              onChange={(e) => {
                                updateSubsectionQuestionField(
                                  sectionIndex,
                                  subIndex,
                                  questionIndex,
                                  "options",
                                  e.target.value.split(",").map((opt) => opt.trim())
                                );
                              }}
                            />
                            {q.type === "SINGLE_CHOICE" && (
                              <Form.Text className="text-muted">
                                Single Choice questions default to "Yes, In-progress, No, Not Applicable".
                              </Form.Text>
                            )}
                          </Form.Group>
                        )}

                        <Form.Group className="mb-2">
                          <Form.Check
                            type="checkbox"
                            label="Requires Evidence Upload"
                            checked={q.uploadEvidence}
                            onChange={(e) =>
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "uploadEvidence",
                                e.target.checked
                              )
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Check
                            type="checkbox"
                            label="Required Question"
                            checked={q.required}
                            onChange={(e) =>
                              updateSubsectionQuestionField(
                                sectionIndex,
                                subIndex,
                                questionIndex,
                                "required",
                                e.target.checked
                              )
                            }
                          />
                        </Form.Group>
                        {/* Conditional logic can be added here if needed */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="d-flex gap-3 mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowPreviewModal(true)}
        >
          <Eye className="mr-2" size={20} /> Preview
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
        // disabled={loading || !questionnaireStructure || !questionnaireTitle || sections.length === 0}
        >
          {loading ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white border-b-0 rounded-t-lg">
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action cannot be undone. Are you sure you want to delete this{" "}
          <strong className="text-danger">{deleteTarget?.type}</strong>?
        </Modal.Body>
        <Modal.Footer className="bg-light border-t-0 rounded-b-lg">
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-blue-500 text-white border-b-0 rounded-t-lg">
          <Modal.Title>Preview Template</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
          {renderPreview()}
        </Modal.Body>
        <Modal.Footer className="bg-gray-100 border-t-0 rounded-b-lg">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuestionnaireEditor;