import React, { useEffect, useState } from 'react';
import DashboardLayout from '@components/DashboardLayout';
import axios from 'axios';
import { toast } from "react-toastify";

const GrantorDashboard = () => {
  const [grantees, setGrantees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    axios.get(BASE_URL +'gfgp/grantees')
      .then(res => setGrantees(res.data))
      .catch(err => console.error('Failed to fetch grantees', err))
      .finally(() => setLoading(false));
  }, []);

  const sendInvitation = async (email) => {
    setSendingTo(email);
    try {
      await axios.post(BASE_URL +'gfgp/grantees/invite', { email });
      toast.success(`Invitation sent to ${email}`);
    } catch (error) {
      console.error('Error sending invitation', error);
      toast.error(`Failed to send invitation to ${email}`);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <DashboardLayout title="Grantor Dashboard" userRole="grantor">
      <div className="alert alert-info">Here you can invite Grantees to take their assessments.</div>

      {loading ? (
        <p>Loading grantees...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {grantees.map((grantee, index) => (
                <tr key={grantee.id}>
                  <td>{index + 1}</td>
                  <td>{grantee.fullName}</td>
                  <td>{grantee.email}</td>
                  <td>{grantee.orgName}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => sendInvitation(grantee.email)}
                      disabled={sendingTo === grantee.email}
                    >
                      {sendingTo === grantee.email ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </td>
                </tr>
              ))}
              {grantees.length === 0 && (
                <tr><td colSpan="5" className="text-center">No grantees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GrantorDashboard;