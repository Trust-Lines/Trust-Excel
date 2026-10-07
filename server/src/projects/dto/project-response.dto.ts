import { Project, ProjectItem, Vendor } from '@prisma/client';

export interface ProjectItemWithVendor extends ProjectItem {
  vendor?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ProjectWithRelations extends Project {
  createdBy?: {
    id: string;
    email: string;
    name: string | null;
  };
  items?: ProjectItemWithVendor[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProjectsResponse {
  data: ProjectWithRelations[];
  meta: PaginationMeta;
}