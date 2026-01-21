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
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const LeavePage = React.lazy(() => import('./pages/LeavePage'));
const OrgChartPage = React.lazy(() => import('./pages/OrgChartPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage'));
const EmployeeProfilePage = React.lazy(() => import('./pages/EmployeeProfilePage'));
const ActivityLogsPage = React.lazy(() => import('./pages/ActivityLogsPage'));

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
                                <Route path="/templates" element={<ProtectedRoute><TaskTemplates /></ProtectedRoute>} />
                                <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetailsPage /></ProtectedRoute>} />
                                <Route path="/bot" element={<ProtectedRoute><BotPage /></ProtectedRoute>} />
                                <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
                                <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfilePage /></ProtectedRoute>} />
                                <Route path="/departments" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
                                <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
                                <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
                                <Route path="/leave" element={<ProtectedRoute><LeavePage /></ProtectedRoute>} />
                                <Route path="/org-chart" element={<ProtectedRoute><OrgChartPage /></ProtectedRoute>} />
                                <Route path="/inbox" element={<ProtectedRoute><Dashboard><InboxPage /></Dashboard></ProtectedRoute>} />
                                <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                                <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogsPage /></ProtectedRoute>} />
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
