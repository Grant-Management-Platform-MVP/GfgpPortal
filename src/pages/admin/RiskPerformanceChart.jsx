import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList,
    Cell,
} from "recharts";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { Button } from 'react-bootstrap';


const RiskPerformanceChart = ({ data }) => {
    if (!data || !Array.isArray(data)) return <p>No data available</p>;


    const getSectionNames = (data) => {
        const sectionSet = new Set();
        data.forEach((entry) => {
            entry.sections.forEach((section) => {
                sectionSet.add(section.sectionTitle);
            });
        });
        return Array.from(sectionSet);
    };

    // Flatten data so each grantee has keys for overall + sections compliance
    const processChartData = (rawData) => {
        return rawData.map((entry) => {
            const sectionData = {};

            entry.sections.forEach((section) => {
                sectionData[section.sectionTitle] = section.compliance;
            });

            return {
                grantee: entry.granteeName,
                overall: entry.overallCompliance,
                ...sectionData,
            };
        });
    };


    const sectionNames = getSectionNames(data);
    const chartData = processChartData(data);

    const handleExportPDF = () => {
        const chartNode = document.getElementById("risk-chart-container");
        if (!chartNode) return;

        htmlToImage
            .toPng(chartNode)
            .then((dataUrl) => {
                const pdf = new jsPDF({
                    orientation: "landscape",
                    unit: "pt",
                    format: [chartNode.offsetWidth, chartNode.offsetHeight],
                });
                pdf.addImage(dataUrl, "PNG", 0, 0, chartNode.offsetWidth, chartNode.offsetHeight);
                pdf.save("risk_performance_chart.pdf");
            })
            .catch((error) => {
                console.error("Failed to export PDF:", error);
            });
    };

    const handleExportPNG = () => {
        const chartNode = document.getElementById("risk-chart-container");
        if (!chartNode) return;

        htmlToImage
            .toPng(chartNode)
            .then((dataUrl) => {
                const link = document.createElement("a");
                link.download = "risk_performance_chart.png";
                link.href = dataUrl;
                link.click();
            })
            .catch((error) => {
                console.error("Failed to export PNG:", error);
            });
    };


    const handleExportCSV = () => {
        if (!data || data.length === 0) return;

        // Flatten the data for CSV header
        const sectionNames = getSectionNames(data);
        const headers = ["Grantee", "Overall Compliance", ...sectionNames];

        // Prepare CSV rows
        const rows = chartData.map((entry) =>
            [
                entry.grantee,
                entry.overall,
                ...sectionNames.map((section) => entry[section] ?? 0),
            ].join(",")
        );

        // Create CSV string
        const csvContent = [headers.join(","), ...rows].join("\n");

        // Create a blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "risk_performance.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    const getRiskColor = (value) => {
        if (value < 60) return "#e74c3c";   // High Risk - Red
        if (value < 80) return "#f39c12";   // Medium Risk - Orange
        return "#2ecc71";                   // Low Risk - Green
    };

    const getRiskLevel = (value) => {
        if (value < 60) return "High Risk";
        if (value < 80) return "Medium Risk";
        return "Low Risk";
    };

    // Custom tooltip content
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;

        return (
            <div
                style={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    padding: 10,
                    fontSize: 14,
                    boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                }}
            >
                <p><strong>{label}</strong></p>
                {payload.map(({ name, value }, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                        <strong>{name}:</strong> {value ?? 0}%
                        <br />
                        <em>{getRiskLevel(value)}</em>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="chart-container" style={{ width: "100%", height: 400 }}>
            <div style={{ marginBottom: 10 }} className="text-end">
                <Button variant="primary" className="me-2" onClick={handleExportPNG}>Export as PNG</Button>
                <Button variant="success" className="me-2" onClick={handleExportPDF}>Export as PDF</Button>
                <Button variant="warning" onClick={handleExportCSV}>Export as CSV</Button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    barCategoryGap="20%"
                >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="grantee" type="category" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />

                    {/* Overall Compliance Bar */}
                    <Bar
                        dataKey="overall"
                        name="Overall Compliance"
                        barSize={20}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`overall-${index}`}
                                fill={getRiskColor(entry.overall)}
                            />
                        ))}
                        <LabelList
                            dataKey="overall"
                            position="right"
                            formatter={(v) =>
                                typeof v === "number" ? `${v.toFixed(0)}%` : "0%"
                            }
                        />
                    </Bar>

                    {/* Section Compliance Bars */}
                    {sectionNames.map((section) => (
                        <Bar
                            key={section}
                            dataKey={section}
                            name={section}
                            barSize={10}
                            radius={[0, 4, 4, 0]}
                            background={{ fill: "#f0f0f0" }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`${section}-${index}`}
                                    fill={getRiskColor(entry[section])}
                                />
                            ))}
                            <LabelList
                                dataKey={section}
                                position="right"
                                formatter={(value) =>
                                    typeof value === "number" ? `${value.toFixed(0)}%` : "0%"
                                }
                                style={{ fontSize: 10 }}
                            />
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RiskPerformanceChart;