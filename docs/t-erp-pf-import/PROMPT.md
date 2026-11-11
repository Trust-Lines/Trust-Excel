# Komut: Trust Stock "Upload PF PDF" özelliğini T-ERP'ye ekle

> Bu metni T-ERP projesinde çalışan Claude'a olduğu gibi ver. Yanına şunları koy:
> - `pf-import-source.md`: bu özelliğin Trust System'deki kodu (ekran + sunucu + PDF okuyucu)
> - `../T-ERP-INTEGRATION.md`: API bağlantısı (proxy `/api/trust/*`, anahtar, uçlar)

---

## Görev

T-ERP'deki **Trust Stock** sayfasına, üst bardaki **Upload PF PDF** butonunu ve arkasındaki
ekranı ekle. Kullanıcı bir PF (Production Form) PDF'i seçer. Sistem PDF'i okur, bulduğu
değerleri gösterir. Kullanıcı kontrol edip düzeltir, **Save** ile Trust Stock'a kaydeder.

Trust System'deki çalışan sürüm: https://trust-excel.vercel.app → Trust Stock → Upload PF PDF
(kodu `pf-import-source.md` içinde: `components/TrustStockPdfImportModal.tsx`).

**Tasarım kuralı:** Bu ekran **tamamen T-ERP'nin tasarım sistemiyle** yapılacak: T-ERP'nin
modal / drawer, buton, input, select, tablo, uyarı, toast ve yükleniyor bileşenleri, renkleri,
boşlukları. Trust System'deki inline stilleri kopyalama, sadece akışı ve alanları al.
(Projects tablosundaki "Excel görünümü aynen kalsın" kuralı burada **yok**.)

---

## Akış

### 1. PDF seçme
- Buton: **Upload PF PDF**. Açılan ekranda sürükle-bırak alanı ve "PDF seç" butonu olsun.
- Sadece `.pdf`, en fazla **4 MB** (Vercel istek sınırı 4.5 MB). Büyükse sunucuya göndermeden uyar.

### 2. Okuma ekranı: "tarama" animasyonu
PDF seçilince:
1. PDF'i tarayıcıda **pdf.js** (`pdfjs-dist`) ile sayfa sayfa canvas'a çiz (sol tarafta,
   kaydırılabilir). Aynı anda `POST /api/trust/trust-stock/pdf/preview` isteğini başlat.
2. İstek sürerken sayfanın üstünde yukarıdan aşağı inen bir **tarama çizgisi** (ince, parlak,
   hafif gölgeli bir yatay bant) ve çizginin önünde yanıp sönen bir **imleç** göster. Sayfalar
   sırayla taransın. Altta küçük bir durum yazısı olsun: "PDF okunuyor…".
3. Cevap gelince **gerçek** sonucu göster: cevaptaki `layout` her ürün satırının PDF'teki yerini
   veriyor. Satırları sırayla (yaklaşık 120–180 ms arayla) PDF'in üstünde vurgula: yarı saydam
   bir kutu ve yanında küçük bir etiket, örneğin `IN-FC-48/F12 BODY · 50`. Aynı anda sağdaki
   ürün tablosuna o satır eklensin (aşağı kayarak / fade-in).
4. Üst bilgiler (Stock code, PF code, Vendor, Type, Date) sağ panelde "yazılıyormuş gibi" kısa
   bir efektle dolsun.

Animasyon kuralları:
- **Animasyon sadece görsel.** Gösterilen her değer sunucunun cevabından gelir; uydurma
  veri, sahte satır ya da sahte ilerleme yüzdesi yok.
- Sunucu çok hızlı dönerse tarama en az ~1 saniye sürsün, sonra sonuç gelsin. Yavaşsa tarama
  döngüde devam etsin.
- **Hata hemen gösterilir**, animasyon bekletmez.
- `prefers-reduced-motion` açıksa animasyonu atla, sonucu doğrudan göster.
- Kullanıcı animasyonu "Atla" ile geçebilsin. Animasyon bitince ekran düzenlenebilir hale gelir.

**`layout` koordinatları:** PDF noktası (pt) cinsinden, orijin **sol alt köşe**, `page`
0'dan başlar. `y0 < y1`. pdf.js ile `scale` ölçekte çizilmiş bir sayfada:
```ts
const vp = page.getViewport({ scale });            // vp.height = sayfa yüksekliği × scale
const pageHeightPt = vp.height / scale;
const top    = (pageHeightPt - l.y1) * scale;     // ekranda üstten
const height = (l.y1 - l.y0) * scale;
// satırın tamamını vurgulamak için yatayda sayfanın tablo genişliğini kullan;
// l.x0..l.x1 sadece resim (PIC) hücresidir
```
`layout` ürün koduyla (`itemCode`) eşleşir. Her ürünün layout'u olmayabilir (PIC sütunu yoksa).
O ürün vurgusuz, sadece tabloya eklenerek gösterilir.

### 3. Kontrol / düzeltme ekranı
Animasyondan sonra (ya da atlanınca) form düzenlenebilir:

| Alan | Kaynak (preview cevabı) | Not |
|---|---|---|
| Stock code | `stockCode` | yanında `groupStatus`: `new` → "(yeni)", `exists` → "(mevcut stoğa eklenir)" |
| PF code | `pfCode` | monospace |
| Vendor | `vendor` (eşleşen satıcı) | select, `GET /api/trust/vendors`; PDF'teki ad `supplierName` ipucu olarak yazılsın |
| Type | `type` | MILLWORK, SHELVING, CEILING, IMAGE, FURNITURE, DECORATION |
| PF date | `pfDate` (yyyy-mm-dd) | date input |
| Order no | boş | isteğe bağlı |
| Currency | `currency` | USD / TL / EUR |
| Payment rule | `paymentRule` | avans yüzdesi, örn. "50" |

- `warnings` varsa üstte uyarı kutusunda listele (satıcı bulunamadı, okunamayan satır,
  zaten yüklü PF…).
- `duplicateOf` doluysa: "Bu PF zaten {groupCode} içinde" de ve **Save'i kapat**.
- Ürün tablosu: Item code, Description (altında `category` küçük gri), Qty, Unit, Total, sil.
  - Qty ya da Unit değişince Total = Unit × Qty (2 hane).
  - "+ Satır ekle".
  - Item code yazarken **katalogdan öner**: `GET /api/trust/trust-stock/catalog` →
    `[{ itemCode, description, dimensions, category, unitPrice, currency }]`. Seçilince boş
    olan açıklama / kategori / birim fiyat doldurulsun. Açıklama `description (dimensions)`.
  - Altta toplam adet ve toplam tutar (para birimi sembolüyle).
- Save şu durumlarda kapalı: stock code boş, PF code boş, hiç ürün yok, kodu boş bir ürün var,
  ya da `duplicateOf` dolu.

### 4. Kaydetme
`POST /api/trust/trust-stock/pdf/import`, **multipart/form-data**:
- `file`: aynı PDF dosyası (sunucu PDF'i saklar, "View PDF" ondan açılır)
- `data`: aşağıdaki alanların JSON metni. **Sadece bu alanlar.** Sunucu fazladan alanı
  reddeder, örneğin preview'deki `layout`, `warnings`, `vendor` nesnesi.
```ts
{
  stockCode: string,            // zorunlu
  pfCode: string,               // zorunlu
  vendorId: string | null,
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | 'DECORATION' | null,
  orderNo: string | null,
  pfDate: string | null,        // yyyy-mm-dd
  currency: 'USD' | 'TL' | 'EUR',
  totalPrice: number | null,    // ürün toplamlarının toplamı
  paymentRule: string | null,
  products: [{ itemCode: string, description?: string, category?: string | null,
               quantity: number, unitPrice?: number | null, totalPrice?: number | null }]  // en az 1
}
```
Başarılıysa ekranı kapat, toast göster ("STOCK-TR-04'e eklendi"), Trust Stock listesini yenile.
Ürünler stokta "Pending verification" olarak görünür, depoya gelince "Confirmed Received" girilir.

Proxy multipart'ı olduğu gibi iletmeli: gövdeyi `arrayBuffer` olarak, `Content-Type`
başlığını (boundary dahil) değiştirmeden. `T-ERP-INTEGRATION.md`'deki proxy örneği bunu yapıyor.

---

## Hatalar

| Durum | Cevap | Ekranda |
|---|---|---|
| PDF değil / dosya yok | 400 | "Sadece PDF" |
| 4 MB üstü | 413 ya da 400 | "Dosya çok büyük (en fazla 4 MB)" |
| Okunamadı | 200, `products` boş + `warnings` | uyarıları göster, elle satır eklenebilir |
| Doğrulama hatası (import) | 400, `message` | mesajı göster, form açık kalsın |
| PF zaten var (import) | 400, "… has already been imported." | mesajı göster |
| Rolün PF PDF yetkisi yok | 403 | butonu bu rolde hiç gösterme |

Hata mesajı cevabın `message` alanında. Animasyonu bekletmeden göster.

---

## Neyi yapmayacaksın

- **PDF okuyucuyu (parser) T-ERP'ye taşıma / yeniden yazma.** Okuma Trust System sunucusunda
  yapılıyor (`/pdf/preview`). `pf-pdf-parser.ts` sadece başvuru için ve en sonda backend
  taşınırken kullanılacak. PF kodu, satıcı eşleştirme, mükerrer kontrolü, stok grubunun
  açılması da sunucuda. T-ERP sadece gösterir ve gönderir.
- API anahtarını tarayıcıya koyma. Her istek T-ERP'nin `/api/trust/*` proxy'sinden gider.
- Trust System'in stil dosyalarını T-ERP'ye taşıma. Bu ekran T-ERP tasarım sistemiyle yapılır.

---

## ⚠️ Veri güvenliği

T-ERP canlı Trust System verisine bağlı.
- **Preview hiçbir şey kaydetmez.** İstediğin kadar PDF okut, animasyonu onunla geliştir.
- **Import gerçek kayıt açar**: stok grubu, PF satırı, ürünler ve saklanan PDF. Deneme için
  gerçek bir PF'i iki kez yükleme, mükerrer kontrolü zaten engeller. Test kaydı açtıysan
  Trust Stock'ta o stok grubunu sil, çöp kutusuna gider ve geri alınabilir.
- Döngüyle istek atma, toplu yükleme yapma. Dakikada 200 istek sınırı var.

---

## Bitti sayılması için kontrol listesi

- [ ] Trust Stock sayfasında **Upload PF PDF** butonu var, T-ERP tasarım sistemiyle
- [ ] PDF seçilince sayfalar çiziliyor, tarama çizgisi ve imleç görünüyor
- [ ] Cevap gelince ürün satırları PDF üstünde **doğru yerde** sırayla vurgulanıyor,
      sağdaki tabloya ekleniyor
- [ ] `prefers-reduced-motion` açıkken animasyon yok; "Atla" çalışıyor; hata animasyonu beklemiyor
- [ ] Alanlar düzenlenebiliyor, katalog önerisi çalışıyor, toplamlar doğru
- [ ] Zaten yüklü bir PF'te Save kapalı ve uyarı görünüyor
- [ ] (Sadece gerçek, yeni bir PF ile) Save → Trust Stock'ta yeni satır, "View PDF" açılıyor
- [ ] DevTools'ta API anahtarı görünmüyor; istekler `/api/trust/...` üzerinden gidiyor

Bitince yaptığın değişikliklerin kısa bir listesini yaz: hangi dosyalar, ne eklendi.
