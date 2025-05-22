import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#198754', '#ffc107', '#dc3545', '#6c757d'];
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

const getPieData = (template, grantees, granteeAnswers) => {
  const statusCounts = { Met: 0, 'Partially Met': 0, 'Not Met': 0, 'N/A': 0 };

  grantees.forEach((g) => {
    template.sections.forEach((section) => {
      section.questions.forEach((q) => {
        const response = granteeAnswers[g.id]?.[q.id]?.answer;
        const label = getStatusLabel(response);
        statusCounts[label]++;
      });
    });
  });

  return STATUS_KEYS.map((key) => ({
    name: key,
    value: statusCounts[key]
  }));
};

const ComparisonPieChart = ({ grantees, granteeAnswers, template }) => {
  const pieData = getPieData(template, grantees, granteeAnswers);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={120} label>
          {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ComparisonPieChart;
