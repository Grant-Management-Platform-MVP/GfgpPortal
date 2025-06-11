import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import GranteeSelect from '@components/GranteeSelect';
import GranteeSummaryCard from '@components/GranteeSummaryCard';
import SectionComparisonTable from '@components/SectionComparisonTable';
import ComparisonBarChart from '@components/ComparisonBarChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import Select from 'react-select';
import ComparisonPieChart from '@components/ComparisonPieChart';
import ComparisonLineChart from '@components/ComparisonLineChart';
import HighRiskSummary from '@components/HighRiskSummary';
import { isHighRisk } from '@utils/riskUtils';

const GranteeComparison = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [grantees, setGrantees] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrantees, setSelectedGrantees] = useState([]);
  const [chartType, setChartType] = useState('bar');

  const findMatchingTemplate = (grantee, templates) => {
    if (!grantee || !templates || templates.length === 0) {
      return null;
    }

    // 1. Try to find an exact match for tiered templates first (most specific)
    if (grantee.structure === 'tiered' && grantee.tieredLevel) {
      const foundTiered = templates.find(
        (tmpl) =>
          tmpl.structureType === 'tiered' && tmpl.tieredLevel === grantee.tieredLevel
      );
      if (foundTiered) {
        return foundTiered;
      }
    }

    // 2. If not a tiered grantee, or no specific tiered template found,
    //    look for a non-tiered template matching the structure.
    //    A non-tiered template should explicitly *not* have a 'tieredLevel'.
    const foundNonTiered = templates.find(
      (tmpl) =>
        tmpl.structureType === grantee.structure && !tmpl.tieredLevel // Added check: && !tmpl.tieredLevel
    );

    if (foundNonTiered) {
      return foundNonTiered;
    }

    console.warn(`No suitable template found for grantee: ${grantee.granteeName} (Structure: ${grantee.structure}, Tiered Level: ${grantee.tieredLevel || 'N/A'})`);
    return null;
  };

  const parseTemplateContent = (tmpl) => {
    const parsedContent = typeof tmpl.content === 'string' ? JSON.parse(tmpl.content) : tmpl.content;
    return {
      ...tmpl,
      ...parsedContent
    };
  };

  const exportToPDF = () => {
    const input = document.getElementById('comparisonContent');
    if (!input) {
      console.error("Comparison content element not found for PDF export.");
      return;
    }
    html2canvas(input, { useCORS: true, logging: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('grantee_comparison.pdf');
    }).catch(error => {
      console.error("Error generating PDF:", error);
    });
  };

  const exportToCSV = () => {
    const csvRows = [];

    if (selectedGrantees.length === 0) {
      console.warn("No grantees selected for CSV export.");
      return;
    }

    const referenceTemplate = selectedGranteesTemplates[selectedGrantees[0].id];

    if (!referenceTemplate || !referenceTemplate.sections) {
      console.warn("No reference template sections available for CSV export.");
      return;
    }

    const granteeDataForCSV = selectedGrantees.map(grantee => ({
      grantee,
      answers: parseAnswers(grantee.answers),
      template: selectedGranteesTemplates[grantee.id]
    }));


    referenceTemplate.sections.forEach((section) => {
      csvRows.push([`Section: ${section.title}`]);
      csvRows.push(['Question', ...selectedGrantees.map(g => g.granteeName || `Grantee #${g.userId}`)]);

      const allQuestionsInSection = (section.subsections || [])
        .flatMap(subsection => subsection.questions || []);

      allQuestionsInSection.forEach((q) => {
        const stripHtml = (html) => html.replace(/<[^>]+>/g, '');

        const questionRow = [stripHtml(q.questionText)];
        const evidenceRow = ['Evidence Attached?'];

        granteeDataForCSV.forEach(({ answers }) => {
          const answerData = answers[q.id];

          if (!answerData) {
            questionRow.push('—');
            evidenceRow.push('No');
          } else {
            const { answer, evidence } = answerData;
            questionRow.push(answer || '—');
            evidenceRow.push(evidence ? 'Yes' : 'No');
          }
        });

        csvRows.push(questionRow);
        csvRows.push(evidenceRow);
      });
      csvRows.push([]);
    });

    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'grantee_comparison.csv';
    link.click();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const granteesRes = await axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`);
        const granteeList = granteesRes.data;
        setGrantees(granteeList);

        const templatesRes = await axios.get(`${BASE_URL}gfgp/questionnaire-templates/fetch-all`);
        const allParsedTemplates = templatesRes.data.map(parseTemplateContent);
        setAllTemplates(allParsedTemplates);

        if (granteeList.length > 0) {
          setSelectedGrantees(granteeList.slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [BASE_URL]);

  const selectedGranteesTemplates = useMemo(() => {
    const templatesMap = {};
    if (selectedGrantees.length > 0 && allTemplates.length > 0) {
      selectedGrantees.forEach(grantee => {
        const matchingTemplate = findMatchingTemplate(grantee, allTemplates);
        if (matchingTemplate) {
          templatesMap[grantee.id] = matchingTemplate;
        } else {
          console.warn(`No matching template found for grantee: ${grantee.granteeName} (ID: ${grantee.id}) with structure: ${grantee.structure}, tieredLevel: ${grantee.tieredLevel || 'N/A'}). This grantee's data may not display correctly.`);
        }
      });
    }
    return templatesMap;
  }, [selectedGrantees, allTemplates]);

  const parseAnswers = (answers) => {
    try {
      const rawAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
      const flattened = {};
      if (rawAnswers) {
        Object.values(rawAnswers).forEach(section => {
          if (section && section.subsections) {
            Object.values(section.subsections).forEach(subsection => {
              if (subsection && subsection.questions) {
                Object.entries(subsection.questions).forEach(([questionId, answerData]) => {
                  flattened[questionId] = answerData;
                });
              }
            });
          }
        });
      }
      return flattened;
    } catch (e) {
      console.error("Error parsing or flattening answers:", e);
      return {};
    }
  };

  const granteeAnswers = useMemo(() => {
    return selectedGrantees.reduce((acc, grantee) => {
      acc[grantee.id] = parseAnswers(grantee.answers);
      return acc;
    }, {});
  }, [selectedGrantees]);

  const hasDataForDetailedComparison = selectedGrantees.length > 0 &&
    selectedGrantees.every(g => selectedGranteesTemplates[g.id] !== undefined);


  if (loading) {
    return <p className="text-center mt-5">Loading comparison data...</p>;
  }

  return (
    <div id="comparisonContent">
      <div className="container d-flex justify-content-end gap-2 mb-3">
        <button className="btn btn-outline-primary btn-sm" onClick={exportToPDF} disabled={!hasDataForDetailedComparison}>Export to PDF</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={exportToCSV} disabled={!hasDataForDetailedComparison}>Export to CSV</button>
      </div>
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-md-6">
            <Select
              options={grantees.map(g => ({ value: g, label: g.granteeName || `Grantee #${g.userId}` }))}
              isMulti
              value={selectedGrantees.map(g => ({ value: g, label: g.granteeName || `Grantee #${g.userId}` }))}
              onChange={(selected) => setSelectedGrantees(selected.map(s => s.value))}
              className="mb-3"
              placeholder="Select Grantees for Comparison..."
            />
          </div>
        </div>

        {/* Conditionally render comparison details based on hasDataForDetailedComparison */}
        {hasDataForDetailedComparison ? (
          <>
            {/* referenceTemplateForUI can only be derived if selectedGrantees has at least one item */}
            {selectedGrantees[0] && selectedGranteesTemplates[selectedGrantees[0].id] && (
              <>
                <div className="row mb-4">
                  <GranteeSummaryCard grantees={selectedGrantees} />
                </div>

                <SectionComparisonTable
                  template={selectedGranteesTemplates[selectedGrantees[0].id]}
                  grantees={selectedGrantees}
                  granteeAnswers={granteeAnswers}
                  selectedGranteesTemplates={selectedGranteesTemplates}
                  isHighRisk={isHighRisk}
                />

                <HighRiskSummary
                  template={selectedGranteesTemplates[selectedGrantees[0].id]}
                  grantees={selectedGrantees}
                  granteeAnswers={granteeAnswers}
                  selectedGranteesTemplates={selectedGranteesTemplates}
                  isHighRisk={isHighRisk}
                />

                <div className="card mt-5">
                  <div className="card-body">
                    <h5 className="card-title">Visual Breakdown</h5>
                    <div className="d-flex gap-2 mb-3">
                      <button className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('bar')}>Bar</button>
                      <button className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('pie')}>Pie</button>
                      <button className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('line')}>Line</button>
                    </div>

                    {chartType === 'bar' && <ComparisonBarChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={selectedGranteesTemplates[selectedGrantees[0].id]} selectedGranteesTemplates={selectedGranteesTemplates} />}
                    {chartType === 'pie' && <ComparisonPieChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={selectedGranteesTemplates[selectedGrantees[0].id]} selectedGranteesTemplates={selectedGranteesTemplates} />}
                    {chartType === 'line' && <ComparisonLineChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={selectedGranteesTemplates[selectedGrantees[0].id]} selectedGranteesTemplates={selectedGranteesTemplates} />}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-center mt-4 text-muted">
            Select one or more grantees from the dropdown above to view their assessment comparison.
          </p>
        )}
      </div>
    </div>
  );
};

export default GranteeComparison;