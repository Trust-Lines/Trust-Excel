# Muhasebe (Suppliers) Modülü — Taşıma Prompt'u

> Bu metni yeni sistemdeki AI ajanına / geliştiriciye olduğu gibi ver. Kaynak: Trust-system, `/suppliers/:vendorCode/p` sayfası.

---

## GÖREV

Yeni sisteme, eski sistemdeki **Supplier (Tedarikçi) Muhasebe** ekranının birebir aynı işlevini ekle. Ekran bir tedarikçinin (vendor) tüm proje kalemlerini listeler ve her kalem için **ödeme, kalan borç, vadesi gelen ödeme ve fatura** bilgilerini tutar. Aşağıda veri modeli, 4 tablonun ilişkisi, her hücrenin veri girişi ve hesaplama formülleri anlatılıyor. Formülleri aynen uygula.

---

## 1. SAYFA YAPISI

- URL: `/suppliers/:vendorCode/:tab` → `tab` = `p` (Projects), `me` (Missing/Extra), `do` (Direct Orders). Bu prompt **P** sekmesini anlatır; ME ve DO aynı 4 tablo düzenini kendi kalem tablolarıyla (MissingExtraItem, DirectOrderItem) tekrarlar.
- Üstte **tedarikçi seçici** (arama + dropdown, vendor `code` ile URL'e yazılır).
- **Supplier Header** (tedarikçi profil kartı, bkz. §6).
- **Sekmeler**: `{VENDOR} P | {VENDOR} ME | {VENDOR} DO` (sadece yetkili sekmeler görünür; yetkisiz sekmeye girilirse ilk yetkili sekmeye yönlendir).
- **Filtre çubuğu** (bkz. §7) ve **Export Excel** butonu.
- İçerik: **Bölge (region/bucket) → Proje → Kalem** hiyerarşisi. Her proje için **4 tablo yan yana, aynı satır hizasında** çizilir:

```
| 1) PROJECTS (kalemler) | 2) ACCOUNTING | 3) PAYMENTS | 4) INVOICE / RECEIPT |
```

- **Tek satır = tek ProjectItem.** 4 tablo ayrı veri tabloları DEĞİL; hepsi aynı `ProjectItem` kaydının farklı kolonlarını gösterir/düzenler. Satır sırası 4 tabloda da aynı olmalı (aynı sıralama fonksiyonu kullanılır), aksi halde hizalama bozulur.
- Bölge sırası sabit: `TLines NE, TLines SE, TLines NW, TLines CVW, TLines HQ, TLines TC`.
- Her bölgenin sonunda **bölge toplam satırı**, sayfa sonunda **genel toplam satırı**.
- Sadece `item.vendor.code === vendorCode` olan kalemler listelenir; vendor'a ait kalemi olmayan proje gösterilmez.

---

## 2. VERİ MODELİ

### Vendor (tedarikçi)
| alan | tip | not |
|---|---|---|
| id | string (cuid) | PK |
| code | string | URL'deki kod (ör. `SHN`) |
| name | string | |
| isActive | bool | |

### Project
| alan | tip | not |
|---|---|---|
| id | string | PK |
| bucket | enum `TLINES_NE, TLINES_SE, CVW, TLINES_NW, TLINES_HQ, TLINES_TC` | bölge |
| projectNo | string | `projectNo + bucket` unique |
| name, address | string | |
| halfYear | int? | ör. 2026 |
| halfOfYear | enum `FIRST_HALF, SECOND_HALF`? | yarıyıl filtresi için |
| deletedAt | datetime? | soft delete |

### ProjectItem (TÜM muhasebe verisi burada)
İlişkiler: `Project 1—N ProjectItem` (cascade delete), `Vendor 1—N ProjectItem`.

**Proje/operasyon alanları (Tablo 1):**
`type` (MILLWORK, SHELVING, CEILING, IMAGE, FURNITURE, DECORATION veya customType), `pfCode`, `vendorId`, `orderType`, `pfSignStatus`, `poSignStatus`, `status`, `std, etd, rtd, rtr, rdy, ftd, snd` (tarihler), `containerNo`, `containerDate`, `paymentRule` (yüzde, string ör. `"30"`).

**Para alanları — hepsi `Decimal(12,2)`, nullable:**
| alan | anlam | hangi tablo |
|---|---|---|
| pfUsd / pfTl | Proforma tutarı USD / TL | 1 |
| invoice | Fatura tutarı (INV/USD) | 1 |
| invoiceTl | Fatura tutarı (INV/TL) | 1 |
| paidUsd1, paidUsd2 | 1. ve 2. USD ödeme | 2 ve 3 |
| paidTl1, paidTl2 | 1. ve 2. TL ödeme | 2 ve 3 |

**Tarih alanları:** `paidUsd1Date, paidUsd2Date, paidTl1Date, paidTl2Date` (her ödemenin tarihi), `invoiceDate`.

**Fatura metin alanları (Tablo 4):** `invoiceTransactionNo` (string), `invoiceNumber` (string), `quickBook` (string; sadece `"Done"` veya boş).

**Diğer:** `deletedAt` (soft delete), `duePaid` (bool, P'de kullanılmıyor).

### Enum'lar
- `SignStatus`: NOT_SIGNED, READY_TO_SIGN, SIGNED, SIGNED_NO_PRICE, SIGNED_WITH_PRICE, WAITING_TLINES_TO_SIGN, WAITING_T_TO_SIGN, SIGNED_WITH_EST_PRICE
- `ItemStatus` (sırayla): HOLD_T, HOLD_PM, HOLD_BOOKS, NOT_ORDERED, TO_ORDER, BOOKS_IN_PROGRESS, ORDERED, WAITING_PAYMENT, ASSEMBLY, READY_TO_RECEIVE, RECEIVED, READY, SENT_TO_TLINES, PARTIAL_SENT, SENT

### SupplierProfile (Vendor 1—1)
`vendorId (unique), companyName, bankName, iban, officialName, noteDate`. GET'te yoksa boş profil otomatik oluşturulur.

### ProjectItemChangeLog + AuditLog
Her alan değişikliği `field, oldValue, newValue, changedByUserId, createdAt` olarak loglanır.

> Not: Eski sistemde `SupplierInvoiceReceiptRow` diye ayrı bir tablo var ama **artık kullanılmıyor** (legacy). Fatura bilgisi doğrudan ProjectItem üzerinde tutuluyor. Yeni sisteme taşıma.

---

## 3. DÖRT TABLO — KOLONLAR, VERİ GİRİŞİ, HESAPLAR

### TABLO 1 — PROJECTS (Proje kalemleri)
Ana proje tablosunun aynısı, vendor'a filtrelenmiş hali. Supplier modunda **PO Sign Status** ve **Expenses USD/TL** kolonları gizli.

Kolonlar: `Project No | Type | PF Code | Vendor | Order Type | PF Sign Status | Status | STD | ETD | RTD | RTR | RDY | FTD | SND | PF USD | PF TL | Payment Rule | Container No | Container Date | INV/USD | INV/TL`

- Düzenleme: hücre içi (inline) edit, blur'da `PATCH` ile tek alan kaydedilir.
- Para hücreleri (pfUsd, pfTl, invoice, invoiceTl) için ek "price note" desteği var (`priceNotes` JSON).
- **Status değişince tarih otomasyonu** (backend): sıra `ORDERED→std, WAITING_PAYMENT→-, READY_TO_RECEIVE→rtr, RECEIVED→rtd, READY→rdy, SENT_TO_TLINES→ftd, PARTIAL_SENT→-, SENT→snd`. İleri atlamada aradaki boş tarihler bugünle doldurulur; geri dönüşte hedeften sonraki tarihler temizlenir. HOLD_*, NOT_ORDERED, ASSEMBLY tarih değiştirmez. ETD hiç otomatik değişmez.
- **PF Code**: pfSignStatus kod verilebilir bir duruma geçince (READY_TO_SIGN / WAITING_* / SIGNED) otomatik üretilir, NOT_SIGNED'a dönünce silinir.
- Bölge toplam satırı: `Σ pfUsd`, `Σ pfTl`, `Σ invoice`, `Σ invoiceTl`.

### TABLO 2 — ACCOUNTING (Muhasebe)
Kolon grupları (aralarında boşluk):
```
[PAID USD 1 | Tarih] [PAID USD 2 | Tarih] [PAID TL 1 | Tarih] [PAID TL 2 | Tarih] [REMAINING USD | REMAINING TL] [NOT ORDERED USD | NOT ORDERED TL]
```
Kolon key'leri: `paidUsd1, paidUsd1Date, paidUsd2, paidUsd2Date, paidTl1, paidTl1Date, paidTl2, paidTl2Date, remainingUsd, remainingTl, notOrderedUsd, notOrderedTl`

**Veri girişi:**
- `paid*` = elle girilen para (input). Sadece rakam ve tek nokta, max 2 ondalık, yazarken binlik ayırıcı (`,`). Focus'ta ham sayı, blur'da formatlı gösterilir. **Blur'da kaydet** → `PATCH { paidUsd1: 1234.5 }`. 0 değeri null değil 0 olarak kaydedilir.
- `paid*Date` = date input, blur'da kaydet → ISO string veya null.
- **"Rem:" kısayolu**: paid alanına focus olunca altında `Rem: $X` balonu çıkar; tıklanınca kalan tutar o alana yazılıp kaydedilir. X = (o para birimindeki fatura) − (aynı para birimindeki diğer paid alanı). Ör. usd1 için `max(0, invoiceAsUsd − paidUsd2)`.
- `remaining*` ve `notOrdered*` = **salt okunur, hesaplanır.**

**Hesaplama (satır bazında):**
```
invoice        = item.invoice
invoiceAsUsd   = item.pfTl > 0 ? 0 : invoice      // pfTl doluysa kalem TL kalemidir
invoiceAsTl    = item.pfTl > 0 ? invoice : 0
totalPaidUsd   = paidUsd1 + paidUsd2
totalPaidTl    = paidTl1 + paidTl2

if pfSignStatus != 'SIGNED':
    remainingUsd hücresinde kırmızı "NOT SIGNED" yazısı, remainingTl boş
    notOrderedUsd = invoiceAsUsd ; notOrderedTl = invoiceAsTl
elif status == 'NOT_ORDERED':
    notOrderedUsd = invoiceAsUsd ; notOrderedTl = invoiceAsTl ; remaining = 0
else:
    remainingUsd = max(0, invoiceAsUsd − totalPaidUsd)
    remainingTl  = max(0, invoiceAsTl  − totalPaidTl)
```
Proje ve genel toplam satırlarında bu kolonların toplamları gösterilir.

### TABLO 3 — PAYMENTS (Vadesi gelen ödeme)
Kolonlar:
```
[DUE PAYMENT USD | DUE PAYMENT TL] [PAYMENTS 1 USD | TL] [PAYMENTS 2 USD | TL]
```
Key'ler: `dueUsd, dueTl, payUsd1, payTl1, payUsd2, payTl2`

**Önemli:** `payUsd1/payUsd2/payTl1/payTl2` ayrı alan DEĞİL — **Accounting'deki `paidUsd1/paidUsd2/paidTl1/paidTl2` ile aynı DB alanına yazar** (aynı veriye ikinci bir giriş noktası). Biri değişince diğeri de güncellenmeli. Mapping: `payUsd1→paidUsd1, payUsd2→paidUsd2, payTl1→paidTl1, payTl2→paidTl2`.

**Due Payment hesabı (salt okunur):**
```
GREEN_STATUSES = [READY_TO_RECEIVE, RECEIVED, READY, SENT_TO_TLINES, PARTIAL_SENT, SENT]

if pfSignStatus != 'SIGNED':           due = 0
elif status == 'WAITING_PAYMENT':
    pct = paymentRule / 100            // ör. "30" → 0.30 (avans)
    dueUsd = max(0, invoiceAsUsd * pct − totalPaidUsd)
    dueTl  = max(0, invoiceAsTl  * pct − totalPaidTl)
elif status in GREEN_STATUSES:         // mal hazır/teslim → tamamı vadeli
    dueUsd = max(0, invoiceAsUsd − totalPaidUsd)
    dueTl  = max(0, invoiceAsTl  − totalPaidTl)
else:                                  // ORDERED, NOT_ORDERED, HOLD vb.
    due = 0
```
Yani: ödeme yapıldıkça due otomatik düşer. Proje/genel toplamlar: Σ due, Σ payments.

### TABLO 4 — INVOICE / RECEIPT (Fatura)
Kolonlar: `TRANSACTION NO | INVOICE NUMBER | QUICK BOOK | DATE`

| UI key | DB alanı | giriş tipi |
|---|---|---|
| transactionNo | invoiceTransactionNo | serbest metin, blur'da kaydet |
| invoiceNumber | invoiceNumber | serbest metin, blur'da kaydet |
| quickBook | quickBook | **toggle**: tıklayınca `"Done"` ↔ `""` (boşken `-` gösterilir), anında kaydet |
| invoiceDate | invoiceDate | date input, blur'da ISO veya null |

QuickBook = faturanın muhasebe yazılımına (QuickBooks) işlenip işlenmediğinin işareti.

---

## 4. TABLOLAR ARASI İLİŞKİ ÖZETİ

```
Vendor ──1:N── ProjectItem ──N:1── Project (bucket = bölge)
   │                │
   └─1:1─ SupplierProfile
                    │
   Tablo 1 (Projects)   → pfUsd, pfTl, invoice, invoiceTl, status, pfSignStatus, paymentRule ... (GİRDİ)
   Tablo 2 (Accounting) → paid* + paid*Date (GİRDİ)  → remaining*, notOrdered* (ÇIKTI)
   Tablo 3 (Payments)   → pay* (= paid*, aynı alan, GİRDİ) → due* (ÇIKTI)
   Tablo 4 (Invoice)    → invoiceTransactionNo, invoiceNumber, quickBook, invoiceDate (GİRDİ)
```
Hesap zinciri: **Tablo 1'deki `invoice`, `pfTl` (para birimi tespiti), `pfSignStatus`, `status`, `paymentRule`** + **Tablo 2/3'teki `paid*`** → Tablo 2 remaining/notOrdered ve Tablo 3 due. Tablo 1'de status veya imza değişince Tablo 2/3 anında yeniden hesaplanmalı.

---

## 5. API (eski sistemdeki karşılıkları)

| İşlem | Endpoint |
|---|---|
| Projeleri+kalemleri getir | `GET /api/projects` (vendor filtresi frontend'de) |
| Kalem alanı güncelle (tüm 4 tablo) | `PATCH /api/projects/items/:itemId` body: `{ <alan>: <değer> }` — dönen tam item ile state güncellenir |
| ME kalemi | `PATCH /api/missing-extra/items/:itemId` |
| DO kalemi | `PATCH /api/direct-orders/:projectId/items/:itemId` |
| Profil | `GET / PATCH /api/supplier-profiles/:vendorId` |
| Kullanıcının supplier yetkileri | `GET /api/permissions/supplier/my-permissions` |

- Kayıt sonrası backend changelog + audit log yazar ve Socket.IO ile `entity:patched` yayınlar.
- Sayfa `suppliers` odasına katılır; `project-item:created/deleted`, `project:created/updated/deleted` olaylarında 300 ms debounce ile yeniden yükler, `entity:patched` ile tek satırı canlı günceller. Yeniden bağlanınca tam yenileme.

---

## 6. SUPPLIER HEADER (Profil kartı)
Vendor kodu/adı + düzenlenebilir alanlar: **Company Name, Bank Name, IBAN, Official Name, Note Date**. `PATCH /api/supplier-profiles/:vendorId`.

---

## 7. FİLTRELER (hepsi çoklu seçim, frontend'de satır bazında)
- **Type**: item.customType.name || item.type (büyük/küçük harf duyarsız)
- **Status**: ItemStatus listesi
- **Container**: containerNo (case-insensitive, boşsa elenir)
- **QuickBook**: `done` (quickBook dolu) / `not_done`; ikisi birden = filtre yok
- **Payment** (USD bazlı, pfUsd'ye göre):
  `totalPaid = paidUsd1+paidUsd2; remaining = pfUsd − totalPaid` → `not_paid` (totalPaid=0), `fully_paid` (remaining ≤ 0), `partially_paid` (diğer)
- **Half** (proje seviyesinde): token `"2026:FIRST_HALF"` veya `"UNASSIGNED"`
- Dropdown seçenekleri sadece o vendor'un kalemlerinde gerçekten bulunan değerlerden üretilir.

---

## 8. YETKİLENDİRME
- Sayfa erişimi: `suppliers_vendors` page key.
- Tablo yetkisi key formatı: `supplier:{P|ME|DO}:{projects|accounting|payments|invoice}` → her biri için `view / edit / export`.
- Kolon kuralı: her kolon için `hidden | readonly | editable`.
- Kolon düzenlenebilir = **tablo edit yetkisi VE kolon `editable`**.
- Bir tablonun tüm kolonları gizliyse tablo hiç çizilmez ve genişliği yerleşimden düşer (kalan tablolar sola kayar).
- Tablo 1 (Projects) kolonları ana sistemdeki "Projects Columns" yetkileriyle; Tablo 2-3-4 "Supplier Tracking" yetkileriyle yönetilir.
- Toplam satırları da yetkiye bağlı: ilgili para kolonlarından en az biri görünür değilse toplam gösterilmez.

---

## 9. EXCEL EXPORT
Mevcut filtreli görünümü bölge → proje → kalem yapısıyla, görünür kolonlarla Excel'e aktarır (dosya: vendor kodu + sekme). Ayrıca tüm tedarikçileri tek dosyada export seçeneği var.

---

## 10. DİKKAT / KARAR VERİLECEK NOKTALAR
1. **Para birimi tespiti**: Accounting ve Payments, faturayı yalnızca `invoice` alanından alır ve `pfTl > 0` ise TL, değilse USD sayar; `invoiceTl` alanını kullanmaz. Supplier Total sayfası ise `invoice` (USD) ve `invoiceTl` (TL) alanlarını ayrı ayrı kullanır. Yeni sistemde bu tutarsızlığı tekrarlama: `invoice` → USD, `invoiceTl` → TL olarak ayrı ayrı kullan (önerilen) ya da eski davranışı bilinçli koru.
2. **Payments 1/2 ile Paid 1/2 aynı alandır.** Ayrı kolonlar açma; tek kaynak, iki görünüm.
3. Para alanları Decimal(12,2); 0 ile null'ı ayır (0 = ödendi olarak 0 girildi).
4. Tüm kayıtlar alan bazlı (field-level) PATCH + changelog; toplu kaydet butonu yok.
5. Soft delete (`deletedAt`) olan proje/kalemler listelenmez.
