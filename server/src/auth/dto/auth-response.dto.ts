export class UserDto {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  forcePasswordChange?: boolean;
  createdAt: Date;
}

export class RoleDto {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

export class PermissionDto {
  key: string;
  module: string;
  action: string;
}

export class ColumnVisibilityDto {
  columnKey: string;
  isHidden: boolean;
  isReadOnly: boolean;
}

export class PagePermissionsDto {
  operationalBoardView: boolean;
  createProject: boolean;
}

export class UserAccessPolicyDto {
  columnsHidden: string[];
  columnsReadOnly: string[];
  pagePermissions?: PagePermissionsDto;
  rowScopes?: any;
  modulePermissions?: any;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
  role: RoleDto;
  permissions: PermissionDto[];
  columnVisibility: ColumnVisibilityDto[];
}

export class MeResponseDto {
  user: UserDto;
  role: RoleDto;
  permissions: PermissionDto[];
  columnVisibility: ColumnVisibilityDto[];
  userAccessPolicy?: UserAccessPolicyDto;
  isAdmin: boolean; // 🚨 CRITICAL: Admin flag for frontend
}