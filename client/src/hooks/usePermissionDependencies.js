import { useCallback, useMemo } from 'react';
import {
    PERMISSION_DEPENDENCIES,
    getPermissionName,
    getAllPermissionKeys
} from '../config/permissions';

/**
 * Custom hook for managing permission dependencies
 */
export const usePermissionDependencies = (selectedPermissions = []) => {
    /**
     * Resolve all dependencies for current selection
     * Returns selected + all required dependencies
     */
    const resolvePermissions = useCallback((selected) => {
        const resolved = new Set(selected);
        let changed = true;

        // Keep resolving until no new dependencies are added
        while (changed) {
            changed = false;
            for (const permKey of [...resolved]) {
                const dependencies = PERMISSION_DEPENDENCIES[permKey];
                if (dependencies) {
                    for (const dep of dependencies) {
                        if (!resolved.has(dep)) {
                            resolved.add(dep);
                            changed = true;
                        }
                    }
                }
            }
        }

        return Array.from(resolved);
    }, []);

    /**
     * Get permissions that depend on a given permission
     */
    const getDependentsOf = useCallback((permKey) => {
        const dependents = [];
        for (const [key, deps] of Object.entries(PERMISSION_DEPENDENCIES)) {
            if (deps.includes(permKey)) {
                dependents.push(key);
            }
        }
        return dependents;
    }, []);

    /**
     * Check if a permission can be safely deselected
     */
    const canDeselect = useCallback((permKey, currentSelected = selectedPermissions) => {
        const dependents = getDependentsOf(permKey);
        const blockedBy = dependents.filter(dep => currentSelected.includes(dep));

        return {
            canDeselect: blockedBy.length === 0,
            blockedBy,
            blockedByNames: blockedBy.map(key => getPermissionName(key))
        };
    }, [selectedPermissions, getDependentsOf]);

    /**
     * Check if a permission is a required dependency of another selected permission
     */
    const isRequiredBy = useCallback((permKey, currentSelected = selectedPermissions) => {
        const dependents = getDependentsOf(permKey);
        return dependents.filter(dep => currentSelected.includes(dep));
    }, [selectedPermissions, getDependentsOf]);

    /**
     * Get the dependencies of a permission
     */
    const getDependencies = useCallback((permKey) => {
        return PERMISSION_DEPENDENCIES[permKey] || [];
    }, []);

    /**
     * Handle selecting a permission - auto-selects dependencies
     */
    const selectPermission = useCallback((permKey, currentSelected = selectedPermissions) => {
        const newSelected = new Set(currentSelected);
        newSelected.add(permKey);

        // Add all dependencies
        const dependencies = PERMISSION_DEPENDENCIES[permKey] || [];
        dependencies.forEach(dep => newSelected.add(dep));

        return Array.from(newSelected);
    }, [selectedPermissions]);

    /**
     * Handle deselecting a permission - warns if others depend on it
     */
    const deselectPermission = useCallback((permKey, currentSelected = selectedPermissions) => {
        const { canDeselect: canDo, blockedBy } = canDeselect(permKey, currentSelected);

        if (!canDo) {
            return {
                success: false,
                blockedBy,
                message: `Cannot deselect "${getPermissionName(permKey)}" because it is required by: ${blockedBy.map(k => getPermissionName(k)).join(', ')}`
            };
        }

        const newSelected = currentSelected.filter(k => k !== permKey);
        return {
            success: true,
            newSelected
        };
    }, [selectedPermissions, canDeselect]);

    /**
     * Toggle a permission with dependency handling
     */
    const togglePermission = useCallback((permKey, currentSelected = selectedPermissions) => {
        const isSelected = currentSelected.includes(permKey);

        if (isSelected) {
            // Trying to deselect
            const result = deselectPermission(permKey, currentSelected);
            if (!result.success) {
                return {
                    ...result,
                    permissions: currentSelected
                };
            }
            return {
                success: true,
                permissions: result.newSelected,
                action: 'deselected'
            };
        } else {
            // Selecting - auto-add dependencies
            const newSelected = selectPermission(permKey, currentSelected);
            const addedDeps = newSelected.filter(k => !currentSelected.includes(k) && k !== permKey);

            return {
                success: true,
                permissions: newSelected,
                action: 'selected',
                addedDependencies: addedDeps,
                message: addedDeps.length > 0
                    ? `Also selected required: ${addedDeps.map(k => getPermissionName(k)).join(', ')}`
                    : null
            };
        }
    }, [selectedPermissions, selectPermission, deselectPermission]);

    /**
     * Check if selecting a permission would auto-select dependencies
     */
    const getAutoSelectInfo = useCallback((permKey, currentSelected = selectedPermissions) => {
        const dependencies = PERMISSION_DEPENDENCIES[permKey] || [];
        const willAutoSelect = dependencies.filter(dep => !currentSelected.includes(dep));

        return {
            hasAutoSelect: willAutoSelect.length > 0,
            willAutoSelect,
            willAutoSelectNames: willAutoSelect.map(k => getPermissionName(k))
        };
    }, [selectedPermissions]);

    /**
     * Get resolved permissions from current selection
     */
    const resolvedPermissions = useMemo(() => {
        return resolvePermissions(selectedPermissions);
    }, [selectedPermissions, resolvePermissions]);

    /**
     * Validate that all dependencies are satisfied
     */
    const validateDependencies = useCallback((permissionKeys) => {
        const missing = [];

        for (const permKey of permissionKeys) {
            const dependencies = PERMISSION_DEPENDENCIES[permKey];
            if (dependencies) {
                for (const dep of dependencies) {
                    if (!permissionKeys.includes(dep)) {
                        missing.push({
                            permission: permKey,
                            permissionName: getPermissionName(permKey),
                            requires: dep,
                            requiresName: getPermissionName(dep)
                        });
                    }
                }
            }
        }

        return {
            valid: missing.length === 0,
            missing
        };
    }, []);

    return {
        resolvePermissions,
        getDependentsOf,
        getDependencies,
        canDeselect,
        isRequiredBy,
        selectPermission,
        deselectPermission,
        togglePermission,
        getAutoSelectInfo,
        resolvedPermissions,
        validateDependencies
    };
};

export default usePermissionDependencies;
