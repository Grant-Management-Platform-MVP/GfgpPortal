import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronUp, Plus, Trash, Eye } from "lucide-react";
import { Modal, Button } from "react-bootstrap";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Fixed options for single choice questions
const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];

const DynamicQuestionnaireBuilder = () => {
  // State for the overall questionnaire structure and title
  const [structure, setStructure] = useState("");
  const [title, setTitle] = useState("");
  // State for managing sections, subsections, and questions
  const [sections, setSections] = useState([]);
  // State for controlling the preview modal visibility
  const [showModal, setShowModal] = useState(false);
  const [tieredLevel, setTieredLevel] = useState('');
  const [loading, setLoading] = useState(false);
  // Base URL for API calls (assuming it's set in environment variables)
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

  /**
   * Recalculates "unit" weights in a bottom-up manner for frontend display.
   * Each question contributes 1 unit. Subsections sum question units, sections sum subsection units.
   * These are not the final backend-normalized weights.
   * @param {Array} currentSections The current array of sections to recalculate weights for.
   * @returns {Array} The updated array of sections with calculated "unit" weights.
   */
  const recalculateSectionWeights = (currentSections) => {
    // Map over each section to calculate its total unit weight
    const updatedSections = currentSections.map(section => {
      let sectionTotalWeight = 0; // Initialize section's total unit weight

      // Map over each subsection within the current section
      const updatedSubsections = (section.subsections || []).map(subsection => {
        let subsectionTotalWeight = 0; // Initialize subsection's total unit weight

        // Sum up unit weights of all questions within the current subsection
        const updatedQuestions = (subsection.questions || []).map(question => {
          // Each question contributes 1 unit for frontend display
          const qWeight = 1;
          subsectionTotalWeight += qWeight; // Add to subsection's total unit weight
          return { ...question, weight: qWeight }; // Return question with its unit weight
        });

        // Assign the calculated total unit weight to the subsection
        // The parseFloat().toFixed(2) is used for consistency in number formatting,
        // though for integer counts it might not be strictly necessary.
        subsectionTotalWeight = parseFloat(subsectionTotalWeight.toFixed(2));
        // Add the subsection's total unit weight to the section's total unit weight
        sectionTotalWeight += subsectionTotalWeight;

        // Return the updated subsection with its questions and calculated unit weight
        return { ...subsection, questions: updatedQuestions, weight: subsectionTotalWeight };
      });

      // Assign the calculated total unit weight to the section
      sectionTotalWeight = parseFloat(sectionTotalWeight.toFixed(2));
      // Return the updated section with its subsections and calculated unit weight
      return { ...section, subsections: updatedSubsections, weight: sectionTotalWeight };
    });

    return updatedSections;
  };

  /**
   * Adds a new empty section to the questionnaire.
   */
  const addSection = () => {
    setSections((prevSections) => {
      const newSections = [
        ...prevSections,
        {
          sectionId: uuidv4(),
          title: "",
          description: "",
          weight: 0, // Initial weight, will be recalculated by frontend for display
          displayOrder: prevSections.length + 1,
          subsections: [],
          expanded: true,
        },
      ];
      // Recalculate weights for all sections after adding a new one
      return recalculateSectionWeights(newSections);
    });
  };

  /**
   * Adds a new empty subsection to a specified section.
   * @param {number} sectionIndex The index of the section to add the subsection to.
   */
  const addSubsection = (sectionIndex) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections]; // Shallow copy of sections array
      const sectionToUpdate = { ...updatedSections[sectionIndex] }; // Deep copy the specific section object

      const newSub = {
        subsectionId: uuidv4(),
        title: "",
        description: "",
        weight: 0, // Initial weight, will be recalculated by frontend for display
        questions: [],
      };

      sectionToUpdate.subsections = [
        ...(sectionToUpdate.subsections || []),
        newSub,
      ];

      updatedSections[sectionIndex] = sectionToUpdate; // Place the updated section back

      // Recalculate weights for all sections after adding a new subsection
      return recalculateSectionWeights(updatedSections);
    });
  };

  /**
   * Updates a field of a specific subsection.
   * @param {number} sectionIndex The index of the parent section.
   * @param {number} subIndex The index of the subsection to update.
   * @param {string} field The name of the field to update (e.g., 'title', 'description').
   * @param {*} value The new value for the field.
   */
  const updateSubsectionField = (sectionIndex, subIndex, field, value) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections];
      // Deep clone to ensure immutability
      const section = { ...updatedSections[sectionIndex] };
      const subsection = { ...section.subsections[subIndex] };

      subsection[field] = value;
      section.subsections = [...section.subsections];
      section.subsections[subIndex] = subsection;
      updatedSections[sectionIndex] = section;

      // No weight recalculation needed for just text field updates
      return updatedSections;
    });
  };

  /**
   * Adds a new empty question to a specified subsection.
   * @param {number} sectionIndex The index of the parent section.
   * @param {number} subIndex The index of the parent subsection.
   */
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
                      type: "SINGLE_CHOICE",
                      required: true,
                      options: [...FIXED_OPTIONS],
                      guidance: "",
                      conditional: null,
                      uploadEvidence: true,
                      weight: 1,
                      userResponse: {
                        answer: "",
                        justification: "",
                        evidence: null,
                      },
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

  /**
   * Updates a field of a specific question within a subsection.
   * @param {number} sectionIndex The index of the parent section.
   * @param {number} subIndex The index of the parent subsection.
   * @param {number} questionIndex The index of the question to update.
   * @param {string} field The name of the field to update (e.g., 'questionText').
   * @param {*} value The new value for the field.
   */
  const updateSubsectionQuestionField = (sectionIndex, subIndex, questionIndex, field, value) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      // Deep clone to ensure immutability
      const section = { ...updated[sectionIndex] };
      const subsection = { ...section.subsections[subIndex] };
      const question = { ...subsection.questions[questionIndex] };

      question[field] = value;
      subsection.questions = [...subsection.questions];
      subsection.questions[questionIndex] = question;
      section.subsections = [...section.subsections];
      section.subsections[subIndex] = subsection;
      updated[sectionIndex] = section;

      // No weight recalculation needed for just text field updates
      return updated;
    });
  };

  /**
   * Removes a section from the questionnaire.
   * @param {number} index The index of the section to remove.
   */
  const removeSection = (index) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      updated.splice(index, 1);
      // Recalculate weights for remaining sections
      return recalculateSectionWeights(updated);
    });
  };

  /**
   * Toggles the expanded state of a section in the UI.
   * @param {number} index The index of the section to toggle.
   */
  const toggleSection = (index) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      updated[index].expanded = !updated[index].expanded;
      return updated;
    });
  };

  /**
   * Updates a field of a specific section.
   * @param {number} index The index of the section to update.
   * @param {string} field The name of the field to update (e.g., 'title', 'description').
   * @param {*} value The new value for the field.
   */
  const updateSectionField = (index, field, value) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      updated[index][field] = value;
      return updated;
    });
  };

  /**
   * Removes a question from a specified subsection.
   * @param {number} sectionIndex The index of the parent section.
   * @param {number} subIndex The index of the parent subsection.
   * @param {number} questionIndex The index of the question to remove.
   */
  const removeSubsectionQuestion = (sectionIndex, subIndex, questionIndex) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections];

      // Deep clone to ensure immutability
      const updatedSubsection = {
        ...updatedSections[sectionIndex].subsections[subIndex],
        questions: [...updatedSections[sectionIndex].subsections[subIndex].questions],
      };

      // Remove the question
      updatedSubsection.questions.splice(questionIndex, 1);

      // Update the subsection in the sections array
      updatedSections[sectionIndex].subsections[subIndex] = updatedSubsection;

      // Recalculate weights after removing a question
      return recalculateSectionWeights(updatedSections);
    });
  };

  /**
   * Handles the submission of the questionnaire template to the backend.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);

    // --- Client-side Validation ---
    if (!structure) {
      toast.error("Please select a GFGP Structure.");
      setLoading(false);
      return;
    }
    if (structure === 'tiered' && !tieredLevel) {
      toast.error("Please select a Tiered Level (Gold, Silver, or Bronze).");
      setLoading(false);
      return;
    }
    if (!title) {
      toast.error("Please enter a title for the questionnaire.");
      setLoading(false);
      return;
    }
    // Generate a unique version code for the template
    let versionCode;
    if (structure === 'tiered') {
      versionCode = `${structure.toUpperCase()}_${tieredLevel.toUpperCase()}_${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
    } else {
      versionCode = `${structure.toUpperCase()}_${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
    }


    // Ensure sections data is up-to-date with current unit weights before submission
    const finalSections = recalculateSectionWeights(sections);

    console.log("Final sections for submission:", finalSections);
    console.log("Submitting with structure:", structure, "tieredLevel:", tieredLevel, "title:", title);


    // Construct the payload for the API call
    const payload = {
      structure,
      title,
      templateCode: versionCode,
      version: "1.0",
      // Conditionally include tieredLevel
      tieredLevel: structure === 'tiered' ? tieredLevel : null, // Send null for non-tiered
      contentJson: {
        templateCode: versionCode,
        version: "1.0",
        sections: finalSections, // Send the current sections state with unit weights
      },
    };

    try {
      const res = await fetch(BASE_URL + "gfgp/questionnaire-templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Questionnaire template created successfully.");
        // Reset form after successful submission
        setStructure("");
        setTieredLevel("");
        setTitle("");
        setSections([]);
      } else {
        const errorData = await res.json();
        toast.error(`Failed to create template: ${errorData.message || res.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      toast.error("An error occurred while submitting the template.");
    }
  };

  /**
   * Renders the preview of the questionnaire template.
   * Shows calculated unit weights and structure.
   */
  const renderPreview = () => {
    // Calculate the total unit weight of all sections for display
    // const totalSectionWeight = sections.reduce((sum, s) => sum + (s.weight || 0), 0);

    // Helper to sum subsection unit weights within a section for display
    const renderSubsectionWeightSum = (subsections) =>
      subsections.reduce((sum, sub) => sum + (sub.weight || 0), 0);

    return (
      <>
        <h5 className="text-xl font-semibold mb-2">{title}</h5>
        <p className="text-gray-700 mb-1"><strong>Structure:</strong> {structure}</p>
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
              <p className="text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: s.description }}/>

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
                  <p className="text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: sub.description }}/>
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {(sub.questions || []).map((q) => (
                      <li key={q.id} className="mb-1">
                        <strong dangerouslySetInnerHTML={{ __html: q.questionText }} /> (Code: {q.questionCode}, Type: {q.type}, Units: {q.weight})<br />
                        {q.guidance && <small className="text-gray-500"><em>Guidance: <span dangerouslySetInnerHTML={{ __html: q.guidance }} /></em></small>}<br />
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


  return (
    <div className="container py-4">
      <h1 className="mb-4 h3">Create Questionnaire</h1>
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">Select GFGP Structure</h5>
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
        <label htmlFor="title" className="form-label">Questionnaire Title</label>
        <input
          type="text"
          id="title"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., GFGP Advanced Template v1"
          required
        />
      </div>

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
                  onClick={() => removeSection(sectionIndex)}
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
                {/* <textarea
                  className="form-control mb-2"
                  placeholder="Section Description"
                  value={section.description}
                  onChange={(e) => updateSectionField(sectionIndex, "description", e.target.value)}
                /> */}
                <ReactQuill
                  style={{ minHeight: "110px", marginBottom: "1rem" }}
                  className="mb-2"
                  theme="snow"
                  placeholder="Section Description"
                  value={section.description}
                  onChange={(content) => updateSectionField(sectionIndex, "description", content)}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                    ],
                  }}
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
                {section.subsections?.map((sub, subIndex) => (
                  <div
                    key={sub.subsectionId}
                    className="card mb-3"
                  >
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
                      className="mb-2"
                      theme="snow"
                      placeholder="Subsection Description"
                      value={sub.description}
                      onChange={(content) =>
                        updateSubsectionField(sectionIndex, subIndex, "description", content)
                      }
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, false] }],
                          ['bold', 'italic', 'underline'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          ['link'],
                        ],
                      }}
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

                    {sub.questions?.map((q, questionIndex) => (
                      <div
                        key={q.id}
                        className="border p-3 rounded bg-light mb-3"
                      >
                        {/* <strong>Question {questionIndex + 1} (Units: {q.weight})</strong> */}
                        <input
                          className="form-control mb-2"
                          placeholder="Question Code (e.g., Q1.1)"
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
                        <hr />
                        <label className="form-label fw-medium mb-1">Question</label>
                        <ReactQuill
                          style={{ minHeight: "140px", marginBottom: "1rem" }}
                          className="mb-2"
                          theme="snow"
                          placeholder="Question"
                          value={q.questionText}
                          onChange={(value) =>
                            updateSubsectionQuestionField(
                              sectionIndex,
                              subIndex,
                              questionIndex,
                              "questionText",
                              value
                            )
                          }
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, false] }],
                              ['bold', 'italic', 'underline'],
                              [{ list: 'ordered' }, { list: 'bullet' }],
                              ['link'],
                            ],
                          }}
                        />
                        <label className="form-label fw-medium mb-1">Guidance(Optional)</label>
                        <ReactQuill
                          className="mb-2"
                          theme="snow"
                          placeholder="Guidance (optional)"
                          value={q.guidance}
                          onChange={(value) =>
                            updateSubsectionQuestionField(
                              sectionIndex,
                              subIndex,
                              questionIndex,
                              "guidance",
                              value
                            )
                          }
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'underline'],
                              [{ list: 'ordered' }, { list: 'bullet' }],
                              ['link'],
                            ],
                          }}
                          formats={['bold', 'italic', 'underline', 'list', 'bullet', 'link']}
                        />
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            id={`evidence-checkbox-${q.id}`}
                            className="form-check-input"
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
                          <label htmlFor={`evidence-checkbox-${q.id}`} className="form-check-label">Requires Evidence Upload</label>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            removeSubsectionQuestion(sectionIndex, subIndex, questionIndex)
                          }
                        >
                          <Trash size={16} className="mr-1" /> Remove Question
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="d-flex gap-3 mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowModal(true)}
        >
          <Eye className="mr-2" size={20} /> Preview
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !structure || (structure === 'tiered' && !tieredLevel) || !title || sections.length === 0}
        >
          {loading ? (
            <>
              {/* <Spinner size="sm" animation="border" className="me-2" /> */} Saving...
            </>
          ) : (
            'Create Questionnaire Template'
          )}
        </button>
      </div>

      {/* Preview Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-blue-500 text-white border-b-0 rounded-t-lg">
          <Modal.Title>Preview Template</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
          {renderPreview()}
        </Modal.Body>
        <Modal.Footer className="bg-gray-100 border-t-0 rounded-b-lg">
          <Button variant="secondary" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DynamicQuestionnaireBuilder;