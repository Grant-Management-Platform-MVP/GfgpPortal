import React, { useEffect, useState } from 'react';
import {
  FaUserCircle,
  FaEdit,
  FaUser,
  FaBuilding,
  FaListUl,
  FaIdBadge
} from 'react-icons/fa';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_BASE_URL;
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.userId) throw new Error('User not found in localStorage');

        const res = await fetch(BASE_URL + 'user/profile/' + user.userId);
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
    return <p className="text-danger text-center mt-5">Failed to load profile.</p>;
  }

  return (
    <div className="bg-light py-5 px-3">
      <div
        className="card shadow-lg mx-auto animate__animated animate__fadeIn"
        style={{ maxWidth: '700px', borderRadius: '1rem' }}
      >
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <FaUserCircle size={60} className="me-3 text-primary" />
              <div>
                <h3 className="mb-1 fw-bold">{profile.fullName || profile.username}</h3>
                <p className="text-muted mb-0">{profile.email}</p>
              </div>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => alert('Edit profile coming soon...')}
            >
              <FaEdit className="me-1" />
              Edit Profile
            </button>
          </div>
          <hr />
          <div className="row gy-3">
            <ProfileRow icon={<FaUser />} label="Full Name" value={profile.fullName} />
            <ProfileRow icon={<FaIdBadge />} label="Role" value={profile.organizationRole} />
            <ProfileRow icon={<FaBuilding />} label="Organization Name" value={profile.organizationName || 'N/A'} />
            <ProfileRow icon={<FaBuilding />} label="Organization Type" value={profile.orgType || 'N/A'} />
            <ProfileRow icon={<FaListUl />} label="Registration Numbers" value={profile.registrationNumbers?.join(', ') || 'None'} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ icon, label, value }) => (
  <div className="col-12 d-flex align-items-start">
    <div className="me-3">
      <span className="badge bg-secondary rounded-circle p-3">
        {React.cloneElement(icon, { size: 18, className: 'text-white' })}
      </span>
    </div>
    <div>
      <p className="mb-1 fw-semibold text-muted">{label}</p>
      <p className="mb-0 fs-6">{value}</p>
    </div>
  </div>
);

export default Profile;