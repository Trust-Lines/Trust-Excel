import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PageDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  children?: PageDefinition[];
}

export interface TableDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  pageId?: string;
  isActive: boolean;
  page?: PageDefinition;
}

export interface ColumnDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  dataType?: string;
  group?: string;
  isGlobal: boolean;
  isMoney: boolean;
  width?: number;
  isEditableByDefault: boolean;
  isActive: boolean;
}

export interface ActionDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  category?: string;
  parentId?: string;
  isActive: boolean;
  children?: ActionDefinition[];
}

@Injectable()
export class ResourceRegistryService {
  private readonly logger = new Logger(ResourceRegistryService.name);

  // Cache for frequently accessed registry data
  private pagesCache: PageDefinition[] | null = null;
  private tablesCache: TableDefinition[] | null = null;
  private columnsCache: ColumnDefinition[] | null = null;
  private actionsCache: ActionDefinition[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Page Registry Methods
   */

  async getAllPages(includeInactive = false): Promise<PageDefinition[]> {
    if (this.shouldUseCache()) {
      return this.pagesCache || await this.loadPagesCache(includeInactive);
    }

    return await this.loadPagesCache(includeInactive);
  }

  async getPageByKey(pageKey: string): Promise<PageDefinition | null> {
    const pages = await this.getAllPages();
    return pages.find(p => p.key === pageKey) || null;
  }

  async getPageById(pageId: string): Promise<PageDefinition | null> {
    const page = await this.prisma.pageRegistry.findUnique({
      where: { id: pageId },
      include: {
        parent: true,
        children: { where: { isActive: true } }
      }
    });

    return page ? this.transformPageDefinition(page) : null;
  }

  async getPageHierarchy(): Promise<PageDefinition[]> {
    const pages = await this.getAllPages();

    // Build hierarchy tree
    const pageMap = new Map<string, PageDefinition>();
    const rootPages: PageDefinition[] = [];

    // First pass: create map
    for (const page of pages) {
      pageMap.set(page.id, { ...page, children: [] });
    }

    // Second pass: build hierarchy
    for (const page of pages) {
      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId)!.children!.push(pageMap.get(page.id)!);
      } else {
        rootPages.push(pageMap.get(page.id)!);
      }
    }

    return rootPages;
  }

  async validatePageKey(pageKey: string): Promise<boolean> {
    const page = await this.getPageByKey(pageKey);
    return page !== null && page.isActive;
  }

  /**
   * Table Registry Methods
   */

  async getAllTables(includeInactive = false): Promise<TableDefinition[]> {
    if (this.shouldUseCache()) {
      return this.tablesCache || await this.loadTablesCache(includeInactive);
    }

    return await this.loadTablesCache(includeInactive);
  }

  async getTableByKey(tableKey: string): Promise<TableDefinition | null> {
    const tables = await this.getAllTables();
    return tables.find(t => t.key === tableKey) || null;
  }

  async getTableById(tableId: string): Promise<TableDefinition | null> {
    const table = await this.prisma.tableRegistry.findUnique({
      where: { id: tableId },
      include: { page: true }
    });

    return table ? this.transformTableDefinition(table) : null;
  }

  async getTablesByPage(pageKey: string): Promise<TableDefinition[]> {
    const page = await this.getPageByKey(pageKey);
    if (!page) return [];

    const tables = await this.getAllTables();
    return tables.filter(t => t.pageId === page.id);
  }

  async validateTableKey(tableKey: string): Promise<boolean> {
    const table = await this.getTableByKey(tableKey);
    return table !== null && table.isActive;
  }

  /**
   * Column Registry Methods
   */

  async getAllColumns(includeInactive = false): Promise<ColumnDefinition[]> {
    if (this.shouldUseCache()) {
      return this.columnsCache || await this.loadColumnsCache(includeInactive);
    }

    return await this.loadColumnsCache(includeInactive);
  }

  async getColumnByKey(columnKey: string): Promise<ColumnDefinition | null> {
    const columns = await this.getAllColumns();
    return columns.find(c => c.key === columnKey) || null;
  }

  async getColumnById(columnId: string): Promise<ColumnDefinition | null> {
    const column = await this.prisma.columnRegistry.findUnique({
      where: { id: columnId }
    });

    return column ? this.transformColumnDefinition(column) : null;
  }

  async getColumnsByGroup(group: string, includeInactive = false): Promise<ColumnDefinition[]> {
    const columns = await this.getAllColumns(includeInactive);
    return columns.filter(c => c.group === group);
  }

  async getGlobalColumns(includeInactive = false): Promise<ColumnDefinition[]> {
    const columns = await this.getAllColumns(includeInactive);
    return columns.filter(c => c.isGlobal);
  }

  async getSupplierSpecificColumns(includeInactive = false): Promise<ColumnDefinition[]> {
    const columns = await this.getAllColumns(includeInactive);
    return columns.filter(c => !c.isGlobal);
  }

  async getMoneyColumns(includeInactive = false): Promise<ColumnDefinition[]> {
    const columns = await this.getAllColumns(includeInactive);
    return columns.filter(c => c.isMoney);
  }

  async validateColumnKey(columnKey: string): Promise<boolean> {
    const column = await this.getColumnByKey(columnKey);
    return column !== null && column.isActive;
  }

  async validateColumnKeys(columnKeys: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const columns = await this.getAllColumns();
    const validKeys = new Set(columns.map(c => c.key));

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const key of columnKeys) {
      if (validKeys.has(key)) {
        valid.push(key);
      } else {
        invalid.push(key);
      }
    }

    return { valid, invalid };
  }

  /**
   * Action Registry Methods
   */

  async getAllActions(includeInactive = false): Promise<ActionDefinition[]> {
    if (this.shouldUseCache()) {
      return this.actionsCache || await this.loadActionsCache(includeInactive);
    }

    return await this.loadActionsCache(includeInactive);
  }

  async getActionByKey(actionKey: string): Promise<ActionDefinition | null> {
    const actions = await this.getAllActions();
    return actions.find(a => a.key === actionKey) || null;
  }

  async getActionById(actionId: string): Promise<ActionDefinition | null> {
    const action = await this.prisma.actionRegistry.findUnique({
      where: { id: actionId },
      include: {
        parent: true,
        children: { where: { isActive: true } }
      }
    });

    return action ? this.transformActionDefinition(action) : null;
  }

  async getActionsByCategory(category: string): Promise<ActionDefinition[]> {
    const actions = await this.getAllActions();
    return actions.filter(a => a.category === category);
  }

  async getActionHierarchy(): Promise<ActionDefinition[]> {
    const actions = await this.getAllActions();

    // Build hierarchy tree
    const actionMap = new Map<string, ActionDefinition>();
    const rootActions: ActionDefinition[] = [];

    // First pass: create map
    for (const action of actions) {
      actionMap.set(action.id, { ...action, children: [] });
    }

    // Second pass: build hierarchy
    for (const action of actions) {
      if (action.parentId && actionMap.has(action.parentId)) {
        actionMap.get(action.parentId)!.children!.push(actionMap.get(action.id)!);
      } else {
        rootActions.push(actionMap.get(action.id)!);
      }
    }

    return rootActions;
  }

  async validateActionKey(actionKey: string): Promise<boolean> {
    const action = await this.getActionByKey(actionKey);
    return action !== null && action.isActive;
  }

  /**
   * Compound validation methods
   */

  async validateResourceAccess(
    pageKey: string,
    tableKey: string,
    columnKeys: string[],
    actionKey: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate page
    if (!(await this.validatePageKey(pageKey))) {
      errors.push(`Invalid page key: ${pageKey}`);
    }

    // Validate table
    if (!(await this.validateTableKey(tableKey))) {
      errors.push(`Invalid table key: ${tableKey}`);
    }

    // Validate columns
    const columnValidation = await this.validateColumnKeys(columnKeys);
    if (columnValidation.invalid.length > 0) {
      errors.push(`Invalid column keys: ${columnValidation.invalid.join(', ')}`);
    }

    // Validate action
    if (!(await this.validateActionKey(actionKey))) {
      errors.push(`Invalid action key: ${actionKey}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Legacy compatibility methods
   * These support the existing OPERATIONAL_BOARD_COLUMNS pattern
   */

  async getLegacyColumnDefinitions(): Promise<Record<string, any>> {
    const columns = await this.getGlobalColumns();
    const definitions: Record<string, any> = {};

    for (const column of columns) {
      definitions[column.key] = {
        key: column.key,
        label: column.name,
        group: column.group,
        width: column.width ? `${column.width}px` : '120px',
        isMoney: column.isMoney,
        isEditableByDefault: column.isEditableByDefault,
        description: column.description
      };
    }

    return definitions;
  }

  async getAllColumnKeysForValidation(): Promise<string[]> {
    const columns = await this.getAllColumns();
    return columns.map(c => c.key);
  }

  /**
   * Cache management
   */

  private shouldUseCache(): boolean {
    return this.cacheTimestamp > Date.now() - this.CACHE_TTL;
  }

  private async loadPagesCache(includeInactive = false): Promise<PageDefinition[]> {
    const pages = await this.prisma.pageRegistry.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: true,
        children: { where: { isActive: true } }
      },
      orderBy: { name: 'asc' }
    });

    this.pagesCache = pages.map(p => this.transformPageDefinition(p));
    this.cacheTimestamp = Date.now();
    return this.pagesCache;
  }

  private async loadTablesCache(includeInactive = false): Promise<TableDefinition[]> {
    const tables = await this.prisma.tableRegistry.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { page: true },
      orderBy: { name: 'asc' }
    });

    this.tablesCache = tables.map(t => this.transformTableDefinition(t));
    this.cacheTimestamp = Date.now();
    return this.tablesCache;
  }

  private async loadColumnsCache(includeInactive = false): Promise<ColumnDefinition[]> {
    const columns = await this.prisma.columnRegistry.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ group: 'asc' }, { name: 'asc' }]
    });

    this.columnsCache = columns.map(c => this.transformColumnDefinition(c));
    this.cacheTimestamp = Date.now();
    return this.columnsCache;
  }

  private async loadActionsCache(includeInactive = false): Promise<ActionDefinition[]> {
    const actions = await this.prisma.actionRegistry.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: true,
        children: { where: { isActive: true } }
      },
      orderBy: { name: 'asc' }
    });

    this.actionsCache = actions.map(a => this.transformActionDefinition(a));
    this.cacheTimestamp = Date.now();
    return this.actionsCache;
  }

  async invalidateCache(): Promise<void> {
    this.pagesCache = null;
    this.tablesCache = null;
    this.columnsCache = null;
    this.actionsCache = null;
    this.cacheTimestamp = 0;
    this.logger.debug('Registry caches invalidated');
  }

  /**
   * Transform methods
   */

  private transformPageDefinition(page: any): PageDefinition {
    return {
      id: page.id,
      key: page.key,
      name: page.name,
      description: page.description,
      parentId: page.parentId,
      isActive: page.isActive,
      children: page.children?.map((child: any) => this.transformPageDefinition(child))
    };
  }

  private transformTableDefinition(table: any): TableDefinition {
    return {
      id: table.id,
      key: table.key,
      name: table.name,
      description: table.description,
      pageId: table.pageId,
      isActive: table.isActive,
      page: table.page ? this.transformPageDefinition(table.page) : undefined
    };
  }

  private transformColumnDefinition(column: any): ColumnDefinition {
    return {
      id: column.id,
      key: column.key,
      name: column.name,
      description: column.description,
      dataType: column.dataType,
      group: column.group,
      isGlobal: column.isGlobal,
      isMoney: column.isMoney,
      width: column.width,
      isEditableByDefault: column.isEditableByDefault,
      isActive: column.isActive
    };
  }

  private transformActionDefinition(action: any): ActionDefinition {
    return {
      id: action.id,
      key: action.key,
      name: action.name,
      description: action.description,
      category: action.category,
      parentId: action.parentId,
      isActive: action.isActive,
      children: action.children?.map((child: any) => this.transformActionDefinition(child))
    };
  }
}