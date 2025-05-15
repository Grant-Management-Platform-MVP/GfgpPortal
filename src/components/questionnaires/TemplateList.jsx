import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Spinner, Container} from "react-bootstrap";
import {
  Pencil,
  Layers,
  ListOrdered,
  BadgeCheck,
  Hourglass,
} from "lucide-react";

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(BASE_URL + "gfgp/questionnaire-templates/fetch-all");
        if (!response.ok) throw new Error("Failed to fetch templates");
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleEdit = (id) => {
    navigate(`/admin/questionnaire-editor/${id}`);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="lead">Loading questionnaires...</p>
      </Container>
    );
  }

  return (
    <div className="p-6 w-full">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex text-center gap-2">
        Questionnaire Templates
      </h2>

      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="table table-striped table-hover">
          <thead className="bg-gray-100 text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th scope="col" className="p-4 text-left whitespace-nowrap">Questionnaire Name</th>
              <th scope="col" className="p-4 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Layers size={14} /> GFGP Structure
                </div>
              </th>
              <th className="p-4 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <ListOrdered size={14} />Questionnaire Version
                </div>
              </th>
              <th className="p-4 text-left whitespace-nowrap">Status</th>
              <th className="p-4 text-left whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider divide-y divide-gray-200">
            {templates.map((template) => (
              <tr
                key={template.id}
                className="hover:bg-gray-50 transition duration-200"
              >
                <td className="p-4 font-medium text-gray-800">{template.title}</td>
                <td className="p-4 text-gray-600">{template.structureType}</td>
                <td className="p-4 text-gray-600">{template.version}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      template.published === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {template.published === "published" ? (
                      <BadgeCheck size={14} />
                    ) : (
                      <Hourglass size={14} />
                    )}
                    {template.published}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="btn btn-warning btn-lg flex items-center gap-2 px-3 py-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-400">
                  No templates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemplateList;
