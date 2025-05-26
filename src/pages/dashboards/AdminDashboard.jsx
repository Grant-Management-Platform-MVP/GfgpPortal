import React from 'react';
import DashboardLayout from '@components/DashboardLayout';
import { Routes, Route, Link } from 'react-router-dom';
import Profile from '@common/ProfilePage';
import UserManagement from '@pages/admin/UserManagement';
import AdminQuestionnaireBuilder from '@components/questionnaires/QuestionnaireBuilder';
import TemplateList from '@components/questionnaires/TemplateList';
import QuestionnaireEditor from '@components/questionnaires/QuestionnaireEditor';
import AdminHome from '@pages/admin/AdminHome';
import RecommendationForm from '../admin/RecommendationForm';

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Admin Dashboard" userRole="admin">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="questionnaire-creation" element={<AdminQuestionnaireBuilder/>} />
        <Route path="questionnaire-management" element={<TemplateList />} />
        <Route path="questionnaire-editor/:id" element={<QuestionnaireEditor />} />
        <Route path="recommendations" element={<RecommendationForm/>} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;