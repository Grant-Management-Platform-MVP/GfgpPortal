import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FaUserCheck,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdOutlineApproval } from "react-icons/md";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch(BASE_URL + "admin/users");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(BASE_URL + `admin/${userId}/approve`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Approval failed");
      }

      toast.success("User approved and notified");
      fetchUsers();
    } catch (error) {
      toast.error("Could not approve user: " + error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    if (roleFilter !== "ALL") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [statusFilter, roleFilter, users]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const uniqueRoles = Array.from(new Set(users.map((u) => u.role))).filter(Boolean);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="d-flex align-items-center gap-2 mb-0">
          <FaUserCheck size={22} />
          User Management
        </h3>
      </div>

      {/* Filter Controls */}
      <div className="row g-3 mb-4">
        <div className="col-auto d-flex align-items-center gap-2">
          <FaFilter />
          <span className="fw-bold">Filters</span>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Fetching users...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="table-responsive shadow-sm rounded">
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                      <td>{user.fullName}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role || <em className="text-muted">N/A</em>}</td>
                      <td>{user.orgName || <em className="text-muted">N/A</em>}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            user.status === "ACTIVE"
                              ? "success"
                              : user.status === "PENDING_APPROVAL"
                              ? "warning text-dark"
                              : "secondary"
                          }`}
                        >
                          {user.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        {user.status === "PENDING_APPROVAL" ? (
                          <button
                            className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                            onClick={() => handleApprove(user.id)}
                          >
                            <MdOutlineApproval />
                            Approve
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > usersPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                <FaChevronLeft /> Prev
              </button>
              <span className="text-muted small">
                Page {currentPage} of{" "}
                {Math.ceil(filteredUsers.length / usersPerPage)}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage === Math.ceil(filteredUsers.length / usersPerPage)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement;
