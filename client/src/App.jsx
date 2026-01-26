import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const ProjectListView = React.lazy(() => import('./pages/ProjectListView'));
const TaskTemplates = React.lazy(() => import('./pages/TaskTemplates'));
const TaskDetailsPage = React.lazy(() => import('./pages/TaskDetailsPage'));
const BotPage = React.lazy(() => import('./pages/BotPage'));
const EmployeesPage = React.lazy(() => import('./pages/EmployeesPage'));
const DepartmentsPage = React.lazy(() => import('./pages/DepartmentsPage'));
const RolesPage = React.lazy(() => import('./pages/RolesPage'));
const RoleDetailsPage = React.lazy(() => import('./pages/RoleDetailsPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const LeavePage = React.lazy(() => import('./pages/LeavePage'));
const OrgChartPage = React.lazy(() => import('./pages/OrgChartPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage'));
const EmployeeProfilePage = React.lazy(() => import('./pages/EmployeeProfilePage'));
const ActivityLogsPage = React.lazy(() => import('./pages/ActivityLogsPage'));
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage'));
const AgentBrainPage = React.lazy(() => import('./pages/AgentBrainPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const AccessDeniedPage = React.lazy(() => import('./pages/AccessDeniedPage'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailsPage = React.lazy(() => import('./pages/ProjectDetailsPage'));

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <NotificationProvider>
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
                                <Route path="/projects/:id" element={<ProtectedRoute><Dashboard><ProjectListView /></Dashboard></ProtectedRoute>} />
                                <Route path="/projects" element={<ProtectedRoute permission="projects.view"><ProjectsPage /></ProtectedRoute>} />
                                <Route path="/projects/:projectId" element={<ProtectedRoute permission="projects.view"><ProjectDetailsPage /></ProtectedRoute>} />
                                <Route path="/templates" element={<ProtectedRoute><TaskTemplates /></ProtectedRoute>} />
                                <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetailsPage /></ProtectedRoute>} />
                                <Route path="/bot" element={<ProtectedRoute><BotPage /></ProtectedRoute>} />
                                {/* Company Settings Routes - Permission Protected */}
                                <Route path="/employees" element={<ProtectedRoute permission="employees.view"><EmployeesPage /></ProtectedRoute>} />
                                <Route path="/employees/:id" element={<ProtectedRoute permission="employees.view"><EmployeeProfilePage /></ProtectedRoute>} />
                                <Route path="/departments" element={<ProtectedRoute permission="departments.view"><DepartmentsPage /></ProtectedRoute>} />
                                <Route path="/roles" element={<ProtectedRoute permission="roles.view"><RolesPage /></ProtectedRoute>} />
                                <Route path="/roles/:roleId" element={<ProtectedRoute permission="roles.view"><RoleDetailsPage /></ProtectedRoute>} />
                                <Route path="/attendance" element={<ProtectedRoute permission="attendance.view_own"><AttendancePage /></ProtectedRoute>} />
                                <Route path="/leave" element={<ProtectedRoute permission="attendance.view_own"><LeavePage /></ProtectedRoute>} />
                                <Route path="/org-chart" element={<ProtectedRoute permission="employees.view"><OrgChartPage /></ProtectedRoute>} />
                                <Route path="/inbox" element={<ProtectedRoute><Dashboard><InboxPage /></Dashboard></ProtectedRoute>} />
                                <Route path="/goals" element={<ProtectedRoute permission="goals.view_own"><GoalsPage /></ProtectedRoute>} />
                                <Route path="/activity-logs" element={<ProtectedRoute permission="system.audit_logs"><ActivityLogsPage /></ProtectedRoute>} />
                                <Route path="/documents" element={<ProtectedRoute permission="documents.view"><DocumentsPage /></ProtectedRoute>} />
                                <Route path="/agent-brain" element={<ProtectedRoute permission="ai.view_logs"><AgentBrainPage /></ProtectedRoute>} />
                                <Route path="/users" element={<ProtectedRoute permission="users.view"><UsersPage /></ProtectedRoute>} />
                                <Route path="/access-denied" element={<ProtectedRoute><AccessDeniedPage /></ProtectedRoute>} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
