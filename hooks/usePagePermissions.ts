import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PagePermissions {
  operationalBoardView: boolean;
  createProject: boolean;
  canAddItems: boolean;
  canManageMasterData: boolean;
}

interface UsePagePermissionsReturn {
  pagePermissions: PagePermissions;
  canAccessOperationalBoard: boolean;
  canCreateProject: boolean;
  canAddItems: boolean;
  canManageMasterData: boolean;
  hasPageAccess: (page: keyof PagePermissions) => boolean;
}

export const usePagePermissions = (): UsePagePermissionsReturn => {
  const { userAccessPolicy } = useAuth();

  const pagePermissions = useMemo((): PagePermissions => {
    // Default permissions if not specified
    const defaultPermissions: PagePermissions = {
      operationalBoardView: true,
      createProject: true,
      canAddItems: true,
      canManageMasterData: true,
    };

    // ✨ FIXED: More robust permission handling with explicit fallbacks
    if (!userAccessPolicy?.pagePermissions) {
      return defaultPermissions;
    }

    // Merge user permissions with defaults to ensure all permissions are defined
    const userPagePermissions = userAccessPolicy.pagePermissions;
    return {
      operationalBoardView: userPagePermissions.operationalBoardView ?? defaultPermissions.operationalBoardView,
      createProject: userPagePermissions.createProject ?? defaultPermissions.createProject,
      canAddItems: userPagePermissions.canAddItems ?? defaultPermissions.canAddItems,
      canManageMasterData: userPagePermissions.canManageMasterData ?? defaultPermissions.canManageMasterData,
    };
  }, [userAccessPolicy]);

  const canAccessOperationalBoard = pagePermissions.operationalBoardView;
  const canCreateProject = pagePermissions.createProject;
  const canAddItems = pagePermissions.canAddItems;
  const canManageMasterData = pagePermissions.canManageMasterData;

  const hasPageAccess = (page: keyof PagePermissions): boolean => {
    return pagePermissions[page] || false;
  };

  return {
    pagePermissions,
    canAccessOperationalBoard,
    canCreateProject,
    canAddItems,
    canManageMasterData,
    hasPageAccess,
  };
};

export default usePagePermissions;