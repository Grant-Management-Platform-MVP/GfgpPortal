import React, { useEffect, useState } from "react";
import axios from "axios";
import RiskPerformanceChart from "./RiskPerformanceChart";


 const BASE_URL = import.meta.env.VITE_BASE_URL;

const transformRiskChartData = (apiData) => {
  return apiData.map((grantee) => {
    const base = {
      grantee: grantee.granteeName,
      overall: grantee.overallCompliance,
    };

    grantee.sections.forEach((section) => {
      base[section.sectionTitle] = section.compliance;
    });

    return base;
  });
};

const extractAllSectionNames = (apiData) => {
  const sectionSet = new Set();
  apiData.forEach((entry) => {
    entry.sections.forEach((section) => sectionSet.add(section.sectionTitle));
  });
  return Array.from(sectionSet);
};

const RiskPerformanceChartWrapper = () => {
  const [chartData, setChartData] = useState([]);
  const [sectionNames, setSectionNames] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/gfgp/reports/risk-performance`)
      .then((res) => {
        const raw = res.data;
        setChartData(transformRiskChartData(raw));
        setSectionNames(extractAllSectionNames(raw));
      })
      .catch((err) => console.error("Fetching risk chart data failed", err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Grantee Risk & Performance</h2>
      <RiskPerformanceChart data={chartData} sectionNames={sectionNames} />
    </div>
  );
};

export default RiskPerformanceChartWrapper;