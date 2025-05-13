import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaEdit, FaUser, FaBuilding, FaListUl, FaIdBadge } from 'react-icons/fa';


const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const BASE_URL = '/api/';
        // const BASE_URL = 'http://localhost:8090/api/';
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.userId) throw new Error('User not found in localStorage');

        const res = await fetch(BASE_URL +'user/profile/' + user.userId);
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status" style={{ width: '5rem', height: '5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 text-primary">Fetching your profile details...</p>
    </div>
  );
}


  if (!profile) {
    return <p className="text-danger text-center">Failed to load profile.</p>;
  }

  return (
    <div className="card shadow mt-5 mx-auto" style={{ maxWidth: '600px' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <FaUserCircle size={50} className="me-3 text-primary" />
            <div>
              <h4 className="card-title mb-0">{profile.fullName || profile.username}</h4>
              <p className="text-muted mb-0">{profile.email}</p>
            </div>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={() => alert('Edit profile coming soon...')}>
            <FaEdit className="me-1" />
            Edit Profile
          </button>
        </div>
        <hr />
        <p><FaUser className="me-2 text-secondary" size={20} /><strong>Username:</strong> {profile.username}</p>
        <p><FaIdBadge className="me-2 text-secondary" size={20} /><strong>Role:</strong> {profile.role}</p>
        <p><FaBuilding className="me-2 text-secondary" size={20} /><strong>Organization Name:</strong> {profile.orgName || 'N/A'}</p>
        <p><FaBuilding className="me-2 text-secondary" size={20} /><strong>Organization Type:</strong> {profile.orgType || 'N/A'}</p>
        <p><FaListUl className="me-2 text-secondary" size={20} /><strong>Registration Numbers:</strong> {profile.registrationNumbers?.join(', ') || 'None'}</p>
      </div>
    </div>
  );
};

export default Profile;