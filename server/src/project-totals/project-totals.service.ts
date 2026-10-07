import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectTotalMoney,
  ProjectTotalTab,
  ProjectTotalCompany,
  ProjectTotalResponse,
  ExpensesTotalBucket,
  ExpensesTotalMoney,
} from './dto/project-total.dto';

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyMoney(): ProjectTotalMoney {
  return { pfUsd: 0, pfTl: 0 };
}

// Invoice (discounted price) replaces pf when entered
function effAmount(invoice: any, pf: any): number {
  const inv = toNum(invoice);
  return inv > 0 ? inv : toNum(pf);
}

function emptyExpMoney(): ExpensesTotalMoney {
  return { usd: 0, tl: 0 };
}

function groupExpensesByBucket(
  items: { expensesUsd: any; expensesTl: any; bucket: string }[],
): Map<string, ExpensesTotalMoney> {
  const map = new Map<string, ExpensesTotalMoney>();
  for (const item of items) {
    if (!map.has(item.bucket)) map.set(item.bucket, emptyExpMoney());
    const m = map.get(item.bucket)!;
    m.usd += toNum(item.expensesUsd);
    m.tl += toNum(item.expensesTl);
  }
  return map;
}

function sumMoney(a: ProjectTotalMoney, b: ProjectTotalMoney): ProjectTotalMoney {
  return {
    pfUsd: a.pfUsd + b.pfUsd,
    pfTl: a.pfTl + b.pfTl,
  };
}

// Fixed company list matching the ProjectBucket enum
const COMPANY_LIST: { bucket: string; displayName: string }[] = [
  { bucket: 'TLINES_NE', displayName: 'TLines NE' },
  { bucket: 'TLINES_SE', displayName: 'TLines SE' },
  { bucket: 'TLINES_NW', displayName: 'TLines NW' },
  { bucket: 'CVW', displayName: 'TLines CVW' },
  { bucket: 'TLINES_HQ', displayName: 'TLines HQ' },
  { bucket: 'TLINES_TC', displayName: 'TLines TC' },
];

@Injectable()
export class ProjectTotalsService {
  constructor(private prisma: PrismaService) {}

  async getProjectTotals(): Promise<ProjectTotalResponse> {
    // Fetch items from all three tables with their parent bucket/section
    const [
      projectItems, directOrderItems, missingExtraItems, trustExpenseItems,
      expensesPItems, expensesDOItems, expensesMEItems,
    ] = await Promise.all([
      // Soft-deleted items and items under soft-deleted parents are excluded,
      // matching what the project/expenses pages display
      this.prisma.projectItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          pfUsd: true,
          pfTl: true,
          invoice: true,
          invoiceTl: true,
          project: { select: { bucket: true } },
        },
      }),
      this.prisma.directOrderItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          pfUsd: true,
          pfTl: true,
          invoice: true,
          invoiceTl: true,
          project: { select: { bucket: true } },
        },
      }),
      this.prisma.missingExtraItem.findMany({
        where: { deletedAt: null, case: { deletedAt: null } },
        select: {
          pfUsd: true,
          pfTl: true,
          invoice: true,
          invoiceTl: true,
          case: { select: { section: true } },
        },
      }),
      this.prisma.trustExpenseItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          expensesUsd: true,
          expensesTl: true,
          project: { select: { bucket: true } },
        },
      }),
      this.prisma.expensesPItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          expensesUsd: true,
          expensesTl: true,
          project: { select: { bucket: true } },
        },
      }),
      this.prisma.expensesDirectOrderItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          expensesUsd: true,
          expensesTl: true,
          project: { select: { bucket: true } },
        },
      }),
      this.prisma.expensesMissingExtraItem.findMany({
        where: { deletedAt: null, project: { deletedAt: null } },
        select: {
          expensesUsd: true,
          expensesTl: true,
          project: { select: { bucket: true } },
        },
      }),
    ]);

    // Group and sum by bucket
    const groupByBucket = (
      items: { pfUsd: any; pfTl: any; bucket: string }[],
    ): Map<string, ProjectTotalMoney> => {
      const map = new Map<string, ProjectTotalMoney>();
      for (const item of items) {
        if (!map.has(item.bucket)) map.set(item.bucket, emptyMoney());
        const m = map.get(item.bucket)!;
        m.pfUsd += toNum(item.pfUsd);
        m.pfTl += toNum(item.pfTl);
      }
      return map;
    };

    // Normalize items to { pfUsd, pfTl, bucket } — invoice replaces pf when entered
    const normalizedProject = projectItems.map((i) => ({
      pfUsd: effAmount(i.invoice, i.pfUsd),
      pfTl: effAmount(i.invoiceTl, i.pfTl),
      bucket: i.project.bucket,
    }));

    const normalizedDO = directOrderItems.map((i) => ({
      pfUsd: effAmount(i.invoice, i.pfUsd),
      pfTl: effAmount(i.invoiceTl, i.pfTl),
      bucket: i.project.bucket,
    }));

    const normalizedME = missingExtraItems.map((i) => ({
      pfUsd: effAmount(i.invoice, i.pfUsd),
      pfTl: effAmount(i.invoiceTl, i.pfTl),
      bucket: i.case.section,
    }));

    const projectMap = groupByBucket(normalizedProject);
    const doMap = groupByBucket(normalizedDO);
    const meMap = groupByBucket(normalizedME);

    // Build per-company results
    const companies: ProjectTotalCompany[] = COMPANY_LIST.map(({ bucket, displayName }) => {
      const pMoney = projectMap.get(bucket) || emptyMoney();
      const doMoney = doMap.get(bucket) || emptyMoney();
      const meMoney = meMap.get(bucket) || emptyMoney();

      const tabs: ProjectTotalTab[] = [
        { label: 'Projects', money: pMoney },
        { label: 'Direct Order', money: doMoney },
        { label: 'Missing & Extra', money: meMoney },
      ];

      const total = sumMoney(sumMoney(pMoney, doMoney), meMoney);

      return { bucket, displayName, tabs, total };
    });

    // Trust Expenses totals (goes under TRUST_EXP)
    const teTotals = emptyMoney();
    for (const item of trustExpenseItems) {
      teTotals.pfUsd += toNum(item.expensesUsd);
      teTotals.pfTl += toNum(item.expensesTl);
    }

    // Group expenses by bucket for the expenses block
    const expPMap = groupExpensesByBucket(
      expensesPItems.map((i) => ({ expensesUsd: i.expensesUsd, expensesTl: i.expensesTl, bucket: i.project.bucket })),
    );
    const expDOMap = groupExpensesByBucket(
      expensesDOItems.map((i) => ({ expensesUsd: i.expensesUsd, expensesTl: i.expensesTl, bucket: i.project.bucket })),
    );
    const expMEMap = groupExpensesByBucket(
      expensesMEItems.map((i) => ({ expensesUsd: i.expensesUsd, expensesTl: i.expensesTl, bucket: i.project.bucket })),
    );
    const expTEMap = groupExpensesByBucket(
      trustExpenseItems.map((i) => ({ expensesUsd: i.expensesUsd, expensesTl: i.expensesTl, bucket: i.project.bucket })),
    );

    const expensesTotals: ExpensesTotalBucket[] = COMPANY_LIST.map(({ bucket }) => ({
      bucket,
      projects: expPMap.get(bucket) || emptyExpMoney(),
      directOrder: expDOMap.get(bucket) || emptyExpMoney(),
      missingExtra: expMEMap.get(bucket) || emptyExpMoney(),
      trustExpenses: expTEMap.get(bucket) || emptyExpMoney(),
    }));

    // Grand totals per row type + overall
    let gtProjects = emptyMoney();
    let gtDirectOrder = emptyMoney();
    let gtMissingExtra = emptyMoney();

    for (const company of companies) {
      gtProjects = sumMoney(gtProjects, company.tabs[0].money);
      gtDirectOrder = sumMoney(gtDirectOrder, company.tabs[1].money);
      gtMissingExtra = sumMoney(gtMissingExtra, company.tabs[2].money);
    }

    const gtTotal = sumMoney(sumMoney(gtProjects, gtDirectOrder), gtMissingExtra);

    return {
      companies,
      grandTotal: {
        projects: gtProjects,
        directOrder: gtDirectOrder,
        missingExtra: gtMissingExtra,
        total: gtTotal,
      },
      trustExpenseTotals: teTotals,
      expensesTotals,
    };
  }
}
