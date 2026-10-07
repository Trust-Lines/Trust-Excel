export enum PermissionsV2Mode {
  OFF = 'off',
  SHADOW = 'shadow',
  ENFORCE = 'enforce'
}

export interface PermissionsV2Config {
  mode: PermissionsV2Mode;
  logDecisions: boolean;
  enabledForTables: string[];
  enabledForUsers: string[];
}

export const getPermissionsV2Config = (): PermissionsV2Config => {
  const mode = (process.env.PERMISSIONS_V2_MODE as PermissionsV2Mode) || PermissionsV2Mode.OFF;

  return {
    mode,
    logDecisions: process.env.PERMISSIONS_V2_LOG_DECISIONS === 'true' || mode !== PermissionsV2Mode.OFF,
    enabledForTables: process.env.PERMISSIONS_V2_ENABLED_TABLES?.split(',') || [
      'operational-board-grid',
      'supplier-p-sheet',
      'supplier-me-sheet',
      'supplier-do-sheet'
    ],
    enabledForUsers: process.env.PERMISSIONS_V2_ENABLED_USERS?.split(',') || []
  };
};