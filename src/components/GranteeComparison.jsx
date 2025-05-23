// File: GranteeComparison.jsx
import React, { useEffect, useState } from 'react';
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


const GranteeComparison = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [grantees, setGrantees] = useState([]);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGrantees, setSelectedGrantees] = useState([]);
  const [chartType, setChartType] = useState('bar');

  const fetchTemplate = async (structure) => {
    const res = await axios.get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`);
    const tmpl = res.data[0];
    const parsedContent = typeof tmpl.content === 'string' ? JSON.parse(tmpl.content) : tmpl.content;
    return {
      ...tmpl,
      ...parsedContent
    };
  };

  const exportToPDF = () => {
    const input = document.getElementById('comparisonContent');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save('grantee_comparison.pdf');
    });
  };

const exportToCSV = () => {
  const csvRows = [];

  template.sections.forEach((section) => {
    csvRows.push([`Section: ${section.title}`]);
    csvRows.push(['Question', ...selectedGrantees.map(g => g.granteeName || `Grantee #${g.userId}`)]);
    section.questions.forEach((q) => {
      const row = [q.questionText];
      selectedGrantees.forEach(grantee => {
        const ans = granteeAnswers[grantee.id]?.[q.id]?.answer || '—';
        row.push(ans);
      });
    csvRows.push(row);
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
        const res = await axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`);
        const granteeList = res.data;
        setGrantees(granteeList);

        if (granteeList.length > 0) {
          setSelectedGrantees(granteeList.slice(0, 2));
          const tmpl = await fetchTemplate(granteeList[0].structure);
          setTemplate(tmpl);
        }
      } catch (err) {
        console.error('Failed to fetch assessments', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const parseAnswers = (answers) => {
    try {
      return typeof answers === 'string' ? JSON.parse(answers) : answers || {};
    } catch {
      return {};
    }
  };

  const granteeAnswers = selectedGrantees.reduce((acc, grantee) => {
    acc[grantee.id] = parseAnswers(grantee.answers);
    return acc;
  }, {});


  if (loading) return <p className="text-center mt-5">Loading comparison...</p>;

  if (!template || selectedGrantees.length === 0) return <p>No data to compare.</p>;

  return (
    <div id="comparisonContent">
      <div className="container d-flex justify-content-end gap-2 mb-3">
        <button className="btn btn-outline-primary btn-sm" onClick={exportToPDF}>
          Export to PDF
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={exportToCSV}>
          Export to CSV
        </button>
      </div>
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-md-6">
            <Select
              options={grantees.map(g => ({
                value: g,
                label: g.granteeName || `Grantee #${g.userId}`
              }))}
              isMulti
              value={selectedGrantees.map(g => ({ value: g, label: g.granteeName || `Grantee #${g.userId}` }))}
              onChange={(selected) => setSelectedGrantees(selected.map(s => s.value))}
              className="mb-3"
            />
          </div>
          <div className="col-md-6">
            {/* <GranteeSelect label="Grantee B" grantees={grantees} onChange={setGranteeB} selected={granteeB} /> */}
          </div>
        </div>

        <div className="row mb-4">
          <GranteeSummaryCard grantees={selectedGrantees} />
        </div>
          <SectionComparisonTable
            template={template}
            grantees={selectedGrantees}
            granteeAnswers={granteeAnswers}
          />
        <div className="card mt-5">
          <div className="card-body">
            <h5 className="card-title">Visual Breakdown</h5>
            {/* <ComparisonBarChart
              grantees={selectedGrantees}
              granteeAnswers={granteeAnswers}
              template={template}
            /> */}

            <div className="d-flex gap-2 mb-3">
              <button className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('bar')}>Bar</button>
              <button className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('pie')}>Pie</button>
              <button className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setChartType('line')}>Line</button>
            </div>

            {chartType === 'bar' && <ComparisonBarChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={template} />}
            {chartType === 'pie' && <ComparisonPieChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={template} />}
            {chartType === 'line' && <ComparisonLineChart grantees={selectedGrantees} granteeAnswers={granteeAnswers} template={template} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GranteeComparison;