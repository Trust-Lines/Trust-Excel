import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SupplierTotalMoney,
  SupplierTotalTab,
  SupplierTotalVendor,
  SupplierTotalResponse,
} from './dto/supplier-total.dto';

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyMoney(): SupplierTotalMoney {
  return {
    productionUsd: 0,
    productionTl: 0,
    paidUsd: 0,
    paidTl: 0,
    remainingUsd: 0,
    remainingTl: 0,
    futureUsd: 0,
    futureTl: 0,
  };
}

function sumMoney(a: SupplierTotalMoney, b: SupplierTotalMoney): SupplierTotalMoney {
  return {
    productionUsd: a.productionUsd + b.productionUsd,
    productionTl: a.productionTl + b.productionTl,
    paidUsd: a.paidUsd + b.paidUsd,
    paidTl: a.paidTl + b.paidTl,
    remainingUsd: a.remainingUsd + b.remainingUsd,
    remainingTl: a.remainingTl + b.remainingTl,
    futureUsd: a.futureUsd + b.futureUsd,
    futureTl: a.futureTl + b.futureTl,
  };
}

interface RawItem {
  vendorId: string;
  pfUsd: any;
  pfTl: any;
  invoice: any;
  invoiceTl: any;
  paidUsd1: any;
  paidUsd2: any;
  paidTl1: any;
  paidTl2: any;
  status: string | null;
  pfSignStatus: string | null;
  paymentRule: string | null;
}

/** Statuses at or beyond READY_TO_RECEIVE qualify for green (remaining) */
const GREEN_THRESHOLD_STATUSES = [
  'READY_TO_RECEIVE', 'RECEIVED', 'READY',
  'SENT_TO_TLINES', 'PARTIAL_SENT', 'SENT',
];

function aggregateItems(items: RawItem[]): SupplierTotalMoney {
  // Invariant: production = paid + remaining + future for every item,
  // so the page-level sanity check (production − paid − remaining − future)
  // always equals 0. Payments are therefore deducted from remaining/future
  // in every branch; overpayments show up as negative remaining/future
  // instead of being silently clipped.
  const money = emptyMoney();
  for (const item of items) {
    // Invoice (discounted price) replaces pf when entered
    const invUsd = toNum(item.invoice);
    const invTl = toNum(item.invoiceTl);
    const pfUsd = invUsd > 0 ? invUsd : toNum(item.pfUsd);
    const pfTl = invTl > 0 ? invTl : toNum(item.pfTl);
    const paidUsd = toNum(item.paidUsd1) + toNum(item.paidUsd2);
    const paidTl = toNum(item.paidTl1) + toNum(item.paidTl2);

    money.productionUsd += pfUsd;
    money.productionTl += pfTl;
    money.paidUsd += paidUsd;
    money.paidTl += paidTl;

    const isSigned = item.pfSignStatus === 'SIGNED';
    const isWaitingPayment = item.status === 'WAITING_PAYMENT';
    const isGreenEligible = GREEN_THRESHOLD_STATUSES.includes(item.status || '');

    if (isWaitingPayment && isSigned) {
      // Partial amount to green based on paymentRule percentage
      const pct = parseFloat(item.paymentRule || '0') / 100;
      const partialUsd = pfUsd * pct;
      const partialTl = pfTl * pct;
      money.remainingUsd += Math.max(0, partialUsd - paidUsd);
      money.remainingTl += Math.max(0, partialTl - paidTl);
      // Rest stays in future (yellow); any payment beyond the partial
      // amount is deducted here so the invariant holds
      money.futureUsd += pfUsd - partialUsd - Math.max(0, paidUsd - partialUsd);
      money.futureTl += pfTl - partialTl - Math.max(0, paidTl - partialTl);
    } else if (isGreenEligible && isSigned) {
      // Full remaining to green
      money.remainingUsd += pfUsd - paidUsd;
      money.remainingTl += pfTl - paidTl;
    } else {
      // Everything not yet paid goes to future (yellow)
      money.futureUsd += pfUsd - paidUsd;
      money.futureTl += pfTl - paidTl;
    }
  }
  return money;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable()
export class SupplierTotalsService {
  private readonly logger = new Logger(SupplierTotalsService.name);
  private cache: { data: SupplierTotalResponse; cachedAt: number } | null = null;

  constructor(private prisma: PrismaService) {}

  /** Invalidate cached supplier totals. Call after any item write that affects money/status fields. */
  invalidateCache(): void {
    this.cache = null;
  }

  async getSupplierTotals(): Promise<SupplierTotalResponse> {
    // Return cached result if still fresh
    if (this.cache && Date.now() - this.cache.cachedAt < CACHE_TTL_MS) {
      return this.cache.data;
    }

    // Fetch ALL vendors (no isActive filter) — every vendor always appears
    const allVendors = await this.prisma.vendor.findMany({
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, code: true },
    });

    // YSM always first, rest sorted by code
    const vendors = allVendors.sort((a, b) => {
      const aIsYSM = a.code.toUpperCase() === 'YSM';
      const bIsYSM = b.code.toUpperCase() === 'YSM';
      if (aIsYSM && !bIsYSM) return -1;
      if (!aIsYSM && bIsYSM) return 1;
      return a.code.localeCompare(b.code);
    });

    this.logger.log(`Supplier totals cache refreshed (${vendors.length} vendors)`);

    // Fetch items from all three tables in parallel
    const selectFields = {
      vendorId: true,
      pfUsd: true,
      pfTl: true,
      invoice: true,
      invoiceTl: true,
      paidUsd1: true,
      paidUsd2: true,
      paidTl1: true,
      paidTl2: true,
      status: true,
      pfSignStatus: true,
      paymentRule: true,
    };

    // Exclude soft-deleted items AND items whose parent (project/case) is soft-deleted,
    // so totals match what the supplier pages display
    const [projectItems, directOrderItems, missingExtraItems] = await Promise.all([
      this.prisma.projectItem.findMany({
        where: { vendorId: { not: null }, deletedAt: null, project: { deletedAt: null } },
        select: selectFields,
      }),
      this.prisma.directOrderItem.findMany({
        where: { vendorId: { not: null }, deletedAt: null, project: { deletedAt: null } },
        select: selectFields,
      }),
      this.prisma.missingExtraItem.findMany({
        where: { vendorId: { not: null }, deletedAt: null, case: { deletedAt: null } },
        select: selectFields,
      }),
    ]);

    // Group items by vendorId
    const groupByVendor = (items: any[]): Map<string, RawItem[]> => {
      const map = new Map<string, RawItem[]>();
      for (const item of items) {
        if (!item.vendorId) continue;
        if (!map.has(item.vendorId)) map.set(item.vendorId, []);
        map.get(item.vendorId)!.push(item as RawItem);
      }
      return map;
    };

    const projectMap = groupByVendor(projectItems);
    const doMap = groupByVendor(directOrderItems);
    const meMap = groupByVendor(missingExtraItems);

    // Build per-vendor totals — ALL vendors included, no filtering
    const vendorResults: SupplierTotalVendor[] = [];

    for (const vendor of vendors) {
      const pMoney = aggregateItems(projectMap.get(vendor.id) || []);
      const doMoney = aggregateItems(doMap.get(vendor.id) || []);
      const meMoney = aggregateItems(meMap.get(vendor.id) || []);

      const vendorTotal = sumMoney(sumMoney(pMoney, doMoney), meMoney);

      const tabs: SupplierTotalTab[] = [
        { label: 'Projects', money: pMoney },
        { label: 'Direct Order', money: doMoney },
        { label: 'Missing & Extra', money: meMoney },
      ];

      vendorResults.push({
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorCode: vendor.code,
        tabs,
        total: vendorTotal,
      });
    }

    let gt = emptyMoney();
    for (const v of vendorResults) {
      gt = sumMoney(gt, v.total);
    }

    const result: SupplierTotalResponse = { vendors: vendorResults, grandTotal: gt };
    this.cache = { data: result, cachedAt: Date.now() };
    return result;
  }
}
