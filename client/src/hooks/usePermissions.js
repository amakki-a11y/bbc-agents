import { useState, useEffect, useCallback, useMemo } from 'react';
import { http } from '../api/http';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to manage user permissions
 * Fetches permissions from the server and provides helper functions
 */
export const usePermissions = () => {
    const { isAuthenticated } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch permissions from server
    const fetchPermissions = useCallback(async () => {
        if (!isAuthenticated) {
            setPermissions([]);
            setRole(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await http.get('/roles/me/permissions');
            const data = response.data;

            setPermissions(data.permissionKeys || []);
            setRole({
                name: data.role,
                id: data.roleId,
                isSystemRole: data.isSystemRole
            });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch permissions:', err);
            setError(err.message);
            setPermissions([]);
            setRole(null);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    /**
     * Check if user has a specific permission
     * @param {string} permissionKey - Permission to check
     * @returns {boolean}
     */
    const hasPermission = useCallback((permissionKey) => {
        if (!permissionKey) return true;
        if (permissions.includes('*')) return true;
        return permissions.includes(permissionKey);
    }, [permissions]);

    /**
     * Check if user has ANY of the specified permissions
     * @param {string[]} permissionKeys - Permissions to check
     * @returns {boolean}
     */
    const hasAnyPermission = useCallback((permissionKeys) => {
        if (!permissionKeys || permissionKeys.length === 0) return true;
        if (permissions.includes('*')) return true;
        return permissionKeys.some(key => permissions.includes(key));
    }, [permissions]);

    /**
     * Check if user has ALL of the specified permissions
     * @param {string[]} permissionKeys - Permissions to check
     * @returns {boolean}
     */
    const hasAllPermissions = useCallback((permissionKeys) => {
        if (!permissionKeys || permissionKeys.length === 0) return true;
        if (permissions.includes('*')) return true;
        return permissionKeys.every(key => permissions.includes(key));
    }, [permissions]);

    /**
     * Check if user is a super admin (has all permissions)
     * @returns {boolean}
     */
    const isSuperAdmin = useMemo(() => {
        return permissions.includes('*') || role?.isSystemRole;
    }, [permissions, role]);

    return {
        permissions,
        role,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        refetch: fetchPermissions
    };
};

export default usePermissions;
