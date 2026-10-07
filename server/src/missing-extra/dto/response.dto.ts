import { ProjectBucket, CaseType, ProjectItemType, SignStatus, ItemStatus, ProjectHalf } from '@prisma/client';

export interface MissingExtraCaseResponse {
  id: string;
  baseProjectId: string | null;
  baseProjectNo: string;
  baseProjectName: string;
  section: ProjectBucket;
  caseType: CaseType;
  caseIndex: number;
  derivedProjectCode: string;
  types: string[];
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  createdAt: string;
  updatedAt: string;
  baseProject?: {
    id: string;
    projectNo: string;
    name: string;
  } | null;
  items?: MissingExtraItemResponse[];
}

export interface MissingExtraItemResponse {
  id: string;
  caseId: string;
  type: ProjectItemType | null;
  customTypeId: string | null;
  pfCode: string | null;
  vendorId: string | null;
  orderType: string | null;
  poSignStatus: SignStatus | null;
  pfSignStatus: SignStatus | null;
  status: ItemStatus | null;
  statusNote: string | null;
  std: string | null;
  etd: string | null;
  rtd: string | null;
  rtr: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  containerNo: string | null;
  paymentRule: string | null;
  pfUsd: number | null;
  pfTl: number | null;
  paidUsd1: number | null;
  paidUsd2: number | null;
  paidTl1: number | null;
  paidTl2: number | null;
  invoice: number | null;
  invoiceTl: number | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  invoiceDate: string | null;
  duePaid: boolean;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  containerDate: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    code: string;
    name: string;
  } | null;
  customType?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface GroupedMissingExtraCasesResponse {
  TLINES_NE: MissingExtraCaseResponse[];
  TLINES_SE: MissingExtraCaseResponse[];
  TLINES_NW: MissingExtraCaseResponse[];
  CVW: MissingExtraCaseResponse[];
  TLINES_HQ: MissingExtraCaseResponse[];
  TLINES_TC: MissingExtraCaseResponse[];
}