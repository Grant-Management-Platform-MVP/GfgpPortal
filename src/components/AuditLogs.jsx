import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert } from 'react-bootstrap';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    axios.get(`${BASE_URL}gfgp/audit-logs/fetch`)
      .then((res) => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load audit logs", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading audit logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return <Alert variant="warning">No audit logs found.</Alert>;
  }

  return (
    <div>
      <h5 className="mb-3">Audit Logs </h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Org ID</th>
            <th>Organisation Name</th>
            <th>Action</th>
            <th>Details</th>
            <th>Structure</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id || index}>
              <td>{index + 1}</td>
              <td>{log.userId}</td>
              <td>{log.orgName}</td>
              <td>{log.action}</td>
              <td>{log.details}</td>
              <td>{log.structure || '—'}</td>
              <td>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AuditLogs;
