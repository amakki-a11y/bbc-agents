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

function App() {
    return (
        <Router>
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
