import { Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

/**
 * ProtectedRoute - Protects routes requiring authentication and optionally permissions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string} props.permission - Single permission required
 * @param {string[]} props.permissions - Multiple permissions (use with requireAll)
 * @param {boolean} props.requireAll - If true, ALL permissions required; if false, ANY permission
 * @param {React.ReactNode} props.fallback - Custom fallback component for permission denied
 */
const ProtectedRoute = ({
    children,
    permission,
    permissions,
    requireAll = false,
    fallback
}) => {
    const { isAuthenticated } = useAuth();
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

    const hasAccess = useMemo(() => {
        // If only checking authentication, always grant access
        if (!permission && !permissions) return true;

        // Single permission check
        if (permission) return hasPermission(permission);

        // Multiple permissions check
        if (permissions && permissions.length > 0) {
            return requireAll
                ? hasAllPermissions(permissions)
                : hasAnyPermission(permissions);
        }

        return true;
    }, [permission, permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Still loading permissions - show nothing or loading state
    if (loading && (permission || permissions)) {
        return null; // Or a loading spinner
    }

    // No access - show fallback or redirect to access denied
    if (!hasAccess) {
        if (fallback) return fallback;
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

export default ProtectedRoute;
