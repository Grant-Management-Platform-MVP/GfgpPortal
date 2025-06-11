import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STATUS_KEYS = ['Met', 'Partially Met', 'Not Met', 'N/A'];

const getStatusLabel = (answer) => {
  switch (answer) {
    case 'Yes': return 'Met';
    case 'In-progress': return 'Partially Met';
    case 'No': return 'Not Met';
    case 'Not Applicable': return 'N/A';
    default: return 'N/A';
  }
};

const getGranteeChartData = (grantees, granteeAnswers, selectedGranteesTemplates) => {
  return grantees.map((g) => {
    const counts = {
      grantee: g.granteeName || `Grantee #${g.userId}`,
      Met: 0,
      'Partially Met': 0,
      'Not Met': 0,
      'N/A': 0,
    };

    const granteeSpecificTemplate = selectedGranteesTemplates[g.id];

    if (!granteeSpecificTemplate?.sections) {
      return counts;
    }

    granteeSpecificTemplate.sections.forEach((section) => {
      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = granteeAnswers[g.id]?.[q.id]?.answer;
        const label = getStatusLabel(answer);

        if (STATUS_KEYS.includes(label)) {
          counts[label]++;
        }
      });
    });

    return counts;
  });
};

const ComparisonBarChart = ({ grantees, granteeAnswers, selectedGranteesTemplates }) => {
  if (grantees.length === 0 || Object.keys(selectedGranteesTemplates).length === 0) return null;
  const chartData = getGranteeChartData(grantees, granteeAnswers, selectedGranteesTemplates);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="grantee" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Met" stackId="a" fill="#198754" />
        <Bar dataKey="Partially Met" stackId="a" fill="#ffc107" />
        <Bar dataKey="Not Met" stackId="a" fill="#dc3545" />
        <Bar dataKey="N/A" stackId="a" fill="#6c757d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ComparisonBarChart;