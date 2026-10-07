/**
 * fix-me-pf-codes.js
 *
 * Missing & Extra PF kodu düzeltme scripti.
 * Bug: orderType değiştiğinde PF kodu yeniden üretilip sayı artıyordu.
 * Fix: Her item grubunu (projectNo + vendorId + type) createdAt sırasıyla
 *      yeniden numaralandır. YSM+MILLWORK için orderType bazlı sabit index.
 *
 * Kullanım:
 *   node scripts/fix-me-pf-codes.js            -- önizleme (dry run)
 *   node scripts/fix-me-pf-codes.js --apply    -- gerçekten uygula
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

// ── PF Kodu Hesaplama ─────────────────────────────────────────────────

const TYPE_LETTERS = {
  MILLWORK: 'M',
  SHELVING: 'S',
  CEILING: 'C',
  IMAGE: 'I',
  FURNITURE: 'F',
};

/**
 * YSM+MILLWORK için orderType'a göre sabit index döner.
 * Diğer durumlar için null döner (sequential index kullanılır).
 */
function ysmMillworkFixedIndex(orderType) {
  if (!orderType) return null;
  const name = orderType.toUpperCase().trim();
  if (name.includes('CUSTOM')) return { letter: 'M', index: 3 };
  if (name.includes('SELECTIVE')) return { letter: 'M', index: 2 };
  if (name.includes('FURNITURE')) return { letter: 'F', index: 1 };
  return { letter: 'M', index: 1 };
}

/**
 * Bir grup içindeki item listesi için doğru PF kodlarını hesaplar.
 * @param {Array} items - { id, orderType, createdAt } sıralı liste
 * @param {string} vendorCode
 * @param {string} projectCode - projectNo veya derivedProjectCode
 * @param {string} type
 * @returns {Map<string, string>} id → doğru pfCode
 */
function computeCorrectPfCodes(items, vendorCode, projectCode, type) {
  const typeLetter = TYPE_LETTERS[type] || 'X';
  const result = new Map();

  const isYsmMillwork = vendorCode === 'YSM' && type === 'MILLWORK';

  if (isYsmMillwork) {
    // Her item orderType'a göre sabit kod alır
    for (const item of items) {
      const fixed = ysmMillworkFixedIndex(item.orderType);
      const letter = fixed ? fixed.letter : typeLetter;
      const idx = fixed ? fixed.index : 1;
      const code = `${vendorCode}-${projectCode}-${letter}${String(idx).padStart(2, '0')}`;
      result.set(item.id, code);
    }
  } else {
    // createdAt sırasına göre 01, 02, 03...
    const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sorted.forEach((item, i) => {
      const code = `${vendorCode}-${projectCode}-${typeLetter}${String(i + 1).padStart(2, '0')}`;
      result.set(item.id, code);
    });
  }

  return result;
}

// ── ExpensesMissingExtraItem düzeltme ────────────────────────────────

async function fixExpensesMEItems() {
  console.log('\n── ExpensesMissingExtraItem ─────────────────────────────────');

  const items = await prisma.expensesMissingExtraItem.findMany({
    where: { pfCode: { not: null } },
    include: {
      project: { select: { projectNo: true } },
      vendor: { select: { code: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Toplam kayıt: ${items.length}`);

  // Grupla: projectNo + vendorId + type
  const groups = new Map();
  for (const item of items) {
    if (!item.vendor || !item.type) continue;
    const key = `${item.project.projectNo}||${item.vendorId}||${item.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let fixCount = 0;
  const updates = [];

  for (const [key, groupItems] of groups) {
    const [projectNo, , type] = key.split('||');
    const vendorCode = groupItems[0].vendor.code;
    const correct = computeCorrectPfCodes(groupItems, vendorCode, projectNo, type);

    for (const item of groupItems) {
      const expected = correct.get(item.id);
      if (item.pfCode !== expected) {
        console.log(`  [ME] ${item.id} | ${item.pfCode} → ${expected}  (${projectNo} / ${vendorCode} / ${type})`);
        updates.push({ id: item.id, pfCode: expected });
        fixCount++;
      }
    }
  }

  if (fixCount === 0) {
    console.log('  Düzeltme gerekmiyor, tüm kodlar doğru.');
    return;
  }

  console.log(`\n  Düzeltilecek: ${fixCount} kayıt`);

  if (!DRY_RUN) {
    for (const { id, pfCode } of updates) {
      await prisma.expensesMissingExtraItem.update({ where: { id }, data: { pfCode } });
    }
    console.log('  ✓ Uygulandı.');
  } else {
    console.log('  (Dry run — uygulamak için --apply ekle)');
  }
}

// ── MissingExtraItem düzeltme ─────────────────────────────────────────

async function fixMissingExtraItems() {
  console.log('\n── MissingExtraItem ─────────────────────────────────────────');

  const items = await prisma.missingExtraItem.findMany({
    where: { pfCode: { not: null } },
    include: {
      case: { select: { derivedProjectCode: true } },
      vendor: { select: { code: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Toplam kayıt: ${items.length}`);

  // Grupla: derivedProjectCode + vendorId + type
  const groups = new Map();
  for (const item of items) {
    if (!item.vendor || !item.type) continue;
    const key = `${item.case.derivedProjectCode}||${item.vendorId}||${item.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let fixCount = 0;
  const updates = [];

  for (const [key, groupItems] of groups) {
    const [projectCode, , type] = key.split('||');
    const vendorCode = groupItems[0].vendor.code;
    const correct = computeCorrectPfCodes(groupItems, vendorCode, projectCode, type);

    for (const item of groupItems) {
      const expected = correct.get(item.id);
      if (item.pfCode !== expected) {
        console.log(`  [MEI] ${item.id} | ${item.pfCode} → ${expected}  (${projectCode} / ${vendorCode} / ${type})`);
        updates.push({ id: item.id, pfCode: expected });
        fixCount++;
      }
    }
  }

  if (fixCount === 0) {
    console.log('  Düzeltme gerekmiyor, tüm kodlar doğru.');
    return;
  }

  console.log(`\n  Düzeltilecek: ${fixCount} kayıt`);

  if (!DRY_RUN) {
    for (const { id, pfCode } of updates) {
      await prisma.missingExtraItem.update({ where: { id }, data: { pfCode } });
    }
    console.log('  ✓ Uygulandı.');
  } else {
    console.log('  (Dry run — uygulamak için --apply ekle)');
  }
}

// ── Ana akış ─────────────────────────────────────────────────────────

async function main() {
  console.log(`\nMissing & Extra PF Kodu Düzeltme Scripti`);
  console.log(`Mod: ${DRY_RUN ? 'DRY RUN (önizleme)' : 'APPLY (gerçek güncelleme)'}`);
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@')}`);

  await fixExpensesMEItems();
  await fixMissingExtraItems();

  console.log('\nTamamlandı.\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
