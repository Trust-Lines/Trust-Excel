# Komut: T-ERP "Production Board"u Trust System Projects tablosunun tam karşılığı yap

> Bu metni T-ERP projesinde çalışan Claude'a olduğu gibi ver. Yanına şunları koy:
> - `../t-erp-projects-port/projects-page-source.md`: Trust System Projects sayfasının bütün kodu
>   (başta dosya → satır dizini var). Aşağıda adı geçen her dosya orada.
> - `../T-ERP-INTEGRATION.md`: API bağlantısı (proxy `/api/trust/*`).
>
> Bu belge, tabloyu **hiç görmemiş biri** de doğru kursun diye yazıldı. Her kural Trust System'in
> çalışan kodundan alındı. Emin olmadığın bir şeyi uydurma; kaynak koda bak.

---

## 0. Ne yapıyoruz

T-ERP'de **Production Board** sayfası var: Projects, Direct Orders, Missing Extra sekmeleri.
Görünüm T-ERP'nin tasarım sisteminde kalacak: font, buton, filtre, sekme, sayfa başlığı, menüler,
modallar. Ama **tablonun yapısı, davranışı ve iş kuralları** Trust System'deki Projects tablosuyla
birebir aynı olmalı. Şu anki T-ERP ekranında bunların çoğu eksik ya da yanlış (bkz. bölüm 12).

Veri ve iş kuralları Trust System sunucusunda: PF kodu üretimi, status → tarih otomasyonu,
mükerrer kontrolleri. T-ERP sadece **gönderir ve sunucunun döndürdüğünü gösterir**. Hiçbir kuralı
T-ERP'de yeniden hesaplama. Aşağıda kuralları anlatmamın sebebi, ekranın neyi neden gösterdiğini
anlaman ve doğru alanı göndermen.

---

## 1. Kavramlar: tablo neyi gösteriyor

```
Bölge (Region / Bucket)          ör. "TLines NE"        → kırmızı bant
 └─ Proje                         ör. 440 · Cherry Hill  → koyu gri başlık (ad + adres)
     └─ Tip grubu                 Millwork, Shelving, Ceiling, Image, Furniture, Decoration (+ özel tipler)
         └─ Satır = 1 PF          her satır ayrı bir sipariş formu (PF): kendi satıcısı, kendi PF kodu,
                                  kendi durumları, tarihleri, fiyatları
     └─ TOTAL satırı              projenin para toplamları
```

- **Proje** = bir müşteri işi (numara + ad + adres + bölge).
- **Satır (item / PF)** = o projede bir satıcıdan verilen **tek bir sipariş formu**. Aynı tipte
  birden çok satır olabilir. Örneğin Millwork'te 3 farklı PF: biri YSM'den M01, biri YSM'den M02,
  biri KYA'dan M01. **Her PF ayrı satırdır ve kendi PF koduna sahiptir.**
- **PO** (Purchase Order), PF'ten farklıdır: **bir tip grubunda kaç satır olursa olsun PO tektir.**
  PO Sign Status hücresi o tip grubunun bütün satırlarını **dikey olarak kaplayan tek bir hücredir**
  (bkz. bölüm 4).
- Yeni proje açılınca, seçilen her tip için **boş bir satır** otomatik oluşur: satıcısız,
  PF kodsuz, PO/PF = NOT SIGNED, Status = NOT ORDERED.

---

## 2. Sayfa iskeleti

Yukarıdan aşağı:

1. **Sayfa başlığı + sekmeler** (T-ERP tasarımı): Projects · Direct Orders · Missing Extra.
   Sağda Export Excel, Add Project (Missing Extra sekmesinde "Create Missing/Extra").
2. **Filtre çubuğu** (bölüm 9): arama, Vendor, Type, Status, Container, Half, ToDo / Receive
   Follow Up, imza bekleyen hızlı filtreler, Groups.
3. **Half atama araç çubuğu** (Projects ve Missing Extra): "Select All (n)", "n selected", Year,
   "Assign to First Half", "Assign to Second Half". Proje bloklarında seçim kutusu (checkbox) çıkar.
4. **Tablo**: bölgeler sırayla:
   `TLines NE → TLines SE → TLines NW → TLines CVW → TLines HQ → TLines TC`.
   Boş bölge gösterilmez. Bölge içinde projeler **en yeni oluşturulan üstte**.
5. **Ekranın en altına sabit yatay kaydırma çubuğu** (bölüm 10).

### Yapışkan (sticky) davranış
Kaynak: `styles.css`.
- **Bölge bandı** (`.section-separator`): kırmızı `#B02417`, 56 px yüksek, beyaz kalın yazı,
  ortalı. Dikey kaydırmada sayfa üst barı + filtre çubuğunun **hemen altına yapışır**.
- **Kolon başlık satırı**: siyah zemin, beyaz, 11 px, BÜYÜK HARF, 32 px. Bölge bandının altına
  yapışır.
- **Sol iki kolon (Project # ve Type)** yatay kaydırmada **solda sabit kalır** (`position: sticky;
  left: 0`). Toplam genişlik 250 px. Sağdaki kolonlar altından kayar.

---

## 3. Kolonlar (sırası ve genişliği aynen)

Satır yüksekliği **40 px**, TOTAL satırı **32 px**.

| # | Kolon | Genişlik | Ne | Kim doldurur |
|---|---|---|---|---|
| 1 | PROJECT # | 110 | proje numarası, **bütün proje boyunca tek hücre** (dikey birleşik) | proje |
| 2 | TYPE | 140 | tip adı, **tip grubu boyunca tek hücre** (dikey birleşik) | proje |
| 3 | PF CODE | 180 | satırın PF kodu | **sunucu üretir** (özel tiplerde elle) |
| 4 | VENDOR | 220 | "KOD - Ad", ör. `YSM - YESIM MOBILYA` | kullanıcı |
| 5 | ORDER TYPE | 200 | sipariş tipi, ör. `STANDARD / BASIC` | kullanıcı |
| 6 | PO SIGN STATUS | 140 | **tip grubu boyunca tek hücre** | kullanıcı (bütün grup) |
| 7 | PF SIGN STATUS | 140 | satırın PF imza durumu | kullanıcı |
| 8 | STATUS | 140 | satırın üretim/sevk durumu | kullanıcı |
| 9 | STD | 140 | Start/Order date (sipariş verildi) | otomatik + elle |
| 10 | ETD | 140 | Estimated date, **sadece elle** | kullanıcı |
| 11 | RTR | 140 | Ready to receive date | otomatik + elle |
| 12 | RTD | 140 | Received date | otomatik + elle |
| 13 | RDY | 140 | Ready date | **sadece otomatik** (salt okunur) |
| 14 | FTD | 140 | Sent to TLines date | otomatik + elle |
| 15 | SND | 140 | Sent date | **sadece otomatik** (salt okunur) |
| 16 | PF / USD | 160 | PF tutarı $ | kullanıcı |
| 17 | PF / TL | 160 | PF tutarı ₺ | kullanıcı |
| 18 | INV / USD | 160 | fatura $ | kullanıcı |
| 19 | INV / TL | 160 | fatura ₺ | kullanıcı |
| 20 | PAYMENT RULE | 180 | ödeme kuralı (avans) | kullanıcı |
| 21 | CONTAINER # | 140 | konteyner adı(ları) | kullanıcı |
| 22 | CONTAINER DATE | 140 | konteyner tarihi | kullanıcı |

Gösterim kuralları:
- **Tarih** formatı her yerde `dd/MM/yyyy`. Boşsa boş.
- **Para**: `39,000.00` (binlik virgül, 2 hane). USD önünde `$`, TL önünde `₺`. Para hücrelerinin
  zemini çok açık mavi `rgba(147,197,253,0.1)`. Boş tutar boş görünür, "$0.00" yazma (TOTAL hariç).
- Kolonlar **rol yetkisine göre gizlenir / salt okunur olur** (`useColumnPermissions`). Gizli
  kolon tamamen kalkar, boşluk bırakmaz.
- Rolün görmediği **tipler** bulanık (blur 4px, %45 saydam) ve tıklanamaz görünür.

---

## 4. Birleşik (dikey) hücreler: en çok yanlış yapılan kısım

Tablo bir Excel gibi **birleşik hücreler** kullanır:

| Hücre | Kapladığı alan | Yüksekliği |
|---|---|---|
| PROJECT # | projenin bütün satırları | satır sayısı × 40 px |
| TYPE | o tip grubunun bütün satırları | grup satır sayısı × 40 px |
| **PO SIGN STATUS** | o tip grubunun bütün satırları | grup satır sayısı × 40 px |

**PO kuralı:** Bir tip grubunda 1 satır da olsa 7 satır da olsa **tek PO hücresi** vardır. Hücre
grubun en üstünden en altına uzanır, yazı dikeyde ortalı ve solda (8 px boşluk). Rengi PO
durumunun rengidir (bölüm 5).
- **Gösterilen değer:** grubun satırlarından türetilir. Hepsi SIGNED → SIGNED; biri WAITING
  TLINES TO SIGN → o; değilse biri WAITING T TO SIGN → o; değilse biri READY TO SIGN → o;
  değilse NOT SIGNED.
- **Değiştirince:** seçilen değer **o tipteki bütün satırlara** yazılır,
  `PATCH /projects/items/:itemId { poSignStatus }`. İstekleri **sırayla** at, paralel atma:
  sunucu PF numarası verirken çakışmasın.

**TYPE hücresi:**
- Tip adı yazar. Grubun bütün satırları **SENT veya SENT TO TLINES** ise koyu yeşil `#15803d`,
  beyaz kalın yazı, solda 3 px `#052e16` çizgi.
- Tip bir PF grubundaysa sol üstte küçük kırmızı rozet çıkar (rank numarası, `#b91c1c`).
- **Tıklayınca** "Edit {Tip} Item" paneli açılır (`InlineEditPanel.tsx`):
  - grubun satırları arasında ‹ › ile gezilir ("2 of 3")
  - **Current PF Code** gösterilir (salt okunur)
  - Vendor ve Order Type seçilir; otomatik kayıt (Auto: ON/OFF)
  - **Add Item**: aynı tipte **yeni bir satır (yeni PF)** ekler

**PROJECT # hücresi rengi** (`lib/projectColor.ts`), öncelik sırasıyla:
1. **Yeşil `#9FCF63`**: projenin bütün satırları **SENT** (SENT TO TLINES sayılmaz)
2. **Kırmızı `#E53E3E`**: proje "Urgent" işaretli **ya da** herhangi bir satırın konteyner tarihi
   **0–10 gün** içinde
3. **Mavi `#6A99D1`**: en az bir satırın PO durumu SIGNED ya da READY TO SIGN
4. **Turuncu `#DE8244`**: hiçbiri değilse

Yazı beyaz, büyük. Numara `P123` biçimindeyse baştaki `P` gösterilmez.

---

## 5. Durumlar ve renkleri

Renkler `utils/statusStyles.ts` dosyasından geliyor. **Bu renkleri değiştirme**, T-ERP'nin
"badge" renklerine çevirme. Hücrenin **zemini** bu renk olur (küçük badge değil, hücre boyunca).

### STATUS (satır durumu)
Açılır listede bu sırayla:

| Değer (API) | Ekranda | Zemin | Yazı | Not |
|---|---|---|---|---|
| HOLD_T | HOLD / T | beyaz | siyah | Mr. T bekletiyor |
| HOLD_PM | HOLD / PM | beyaz | siyah | Proje yönetimi bekletiyor |
| HOLD_BOOKS | HOLD BOOKS | `#ea580c` | beyaz | |
| NOT_ORDERED | NOT ORDERED | `#dc2626` | beyaz | yeni satır bununla başlar |
| TO_ORDER | TO ORDER | `#fb7185` | siyah | sipariş sırasında |
| BOOKS_IN_PROGRESS | BOOKS IN PROGRESS | `#0ea5e9` | beyaz | |
| ORDERED | ORDERED | `#2563eb` | beyaz | STD bugüne ayarlanır |
| WAITING_PAYMENT | WAITING PAYMENT | `#a855f7` | beyaz | |
| ASSEMBLY | ASSEMBLY | `#fbbf24` | siyah | |
| READY_TO_RECEIVE | READY TO RECEIVE | `#f97316` | beyaz | RTR |
| RECEIVED | RECEIVED | `#fb923c` | siyah | RTD |
| READY | READY | `#86efac` | siyah | RDY |
| SENT_TO_TLINES | SENT TO TLINES | `#15803d` | beyaz | FTD |
| PARTIAL_SENT | PARTIAL SENT | beyaz | siyah | |
| SENT | SENT | `#15803d` | beyaz | SND |

### PF SIGN STATUS (satır başına) ve PO SIGN STATUS (tip başına)

| Değer (API) | Ekranda | Zemin | Yazı |
|---|---|---|---|
| NOT_SIGNED | NOT SIGNED | `#ff0000` | siyah |
| READY_TO_SIGN | READY TO SIGN | `#ffff00` | siyah |
| SIGNED | SIGNED | `#92d050` | siyah |
| WAITING_TLINES_TO_SIGN | WAITING TLINES TO SIGN | `#fb923c` | siyah |
| WAITING_T_TO_SIGN | WAITING T TO SIGN | `#a78bfa` | siyah |
| SIGNED_WITH_EST_PRICE | SIGNED WITH EST PRICE | `#4ade80` | siyah |

- PF listesi: NOT SIGNED, READY TO SIGN, SIGNED, WAITING T TO SIGN, SIGNED WITH EST PRICE.
- PO listesi: NOT SIGNED, READY TO SIGN, SIGNED, WAITING TLINES TO SIGN, WAITING T TO SIGN.
- Açılır listede **mevcut değer en üstte** gelir.
- Eski kayıtlarda `SIGNED_NO_PRICE` / `SIGNED_WITH_PRICE` görürsen **SIGNED** olarak göster.

### Status → tarih otomasyonu (sunucu yapar, sen sadece sonucu göster)
Sıra: `ORDERED(STD) → WAITING_PAYMENT → READY_TO_RECEIVE(RTR) → RECEIVED(RTD) → READY(RDY) →
SENT_TO_TLINES(FTD) → PARTIAL_SENT → SENT(SND)`
- **İleri** gidince: o adıma kadarki boş tarihler bugünle dolar.
- **Geri** gidince: hedeften sonraki tarihler silinir.
- **NOT ORDERED**: bütün bu tarihler silinir.
- HOLD / ASSEMBLY: tarih değişmez. **ETD'ye sunucu hiç dokunmaz.**
- Status kaydedildikten sonra **sunucunun döndürdüğü satırı** ekrana uygula: tarihler değişmiş
  olabilir.

---

## 6. PF kodu: nasıl oluşur, ne zaman görünür

**T-ERP PF kodu üretmez, yazmaz.** Sunucu üretir; sen satırı güncelleyince dönen `pfCode`'u
gösterirsin.

Biçim: **`{SATICI KODU}-{PROJE NO}-{TİP HARFİ}{SIRA}`**, ör. `YSM-440-M01`, `KYA-409-S02`.
- Tip harfleri: Millwork **M**, Shelving **S**, Ceiling **C**, Image **I**, Furniture **F**,
  Decoration **D**. Özel tipte, tipin kendi kodu.
- Sıra: aynı satıcı + proje + tip içinde artar (01, 02, …).
- **Sabit Millwork kodlu satıcılar** (GOS, TDR, YSM; satıcı ayarında `fixedMillworkCodes`):
  - STANDARD / BASIC → **M01**
  - STANDARD / SELECTIVE → **M02**
  - CUSTOM / SELECTIVE → **M03**
  - diğer her şey M04'ten başlar
  - Bu üç tipten biri aynı koda sahip birden çok satırda bulunabilir; bu bilerek böyle.
- Order type'ında **FURNITURE** geçen Millwork satırı **F** kodu alır (ör. `KYA-409-F01`).

**Ne zaman var:** PF kodu **sadece PF SIGN STATUS = WAITING T TO SIGN, WAITING TLINES TO SIGN,
SIGNED veya SIGNED WITH EST PRICE** iken vardır.
- NOT SIGNED / READY TO SIGN'da PF kodu **boş**. Bu bir hata değil, kural.
- PF durumu bu seviyeye çıkınca, satıcı, tip veya order type değişince sunucu kodu yeniden
  verebilir.
- Satıcı kaldırılırsa ya da PF durumu geri alınırsa kod silinir.
- **Kural:** satırda hangi alanı değiştirirsen değiştir, cevaptaki `pfCode` ve diğer bütün
  alanlarla ekranı güncelle.

PF CODE hücresi normal tiplerde **tıklanmaz** (salt okunur). Sadece **özel tip** satırlarında elle
yazılabilir.

---

## 7. Hücreye tıklayınca ne olur

Her hücre tıklanınca **hücrenin üstünde/altında küçük bir editör** açar. Satır yüksekliği
değişmez, editör hücreye yapışık bir popover'dır. Enter / dışarı tıklama kaydeder, Esc iptal
eder. Kaydetme: `PATCH /api/trust/projects/items/:itemId` **sadece değişen alanla**. Cevapla
satırı güncelle.

| Hücre | Editör | Gönderilen alan |
|---|---|---|
| VENDOR | aranabilir satıcı listesi (`GET /vendors`, "KOD - Ad"), en altta **"+ Add Vendor"** (yeni satıcı formu: ad zorunlu, kod isteğe bağlı, boşsa üretilir → `POST /vendors`) | `vendorId` |
| ORDER TYPE | aranabilir liste (`GET /order-types`), yeni değer yazılabilir | `orderType` |
| PO SIGN STATUS | durum listesi → **tipteki bütün satırlara** (bölüm 4) | `poSignStatus` |
| PF SIGN STATUS | durum listesi | `pfSignStatus` |
| STATUS | aranabilir durum listesi, her seçeneğin altında kısa açıklama | `status` |
| STD/ETD/RTR/RTD/FTD | tarih seçici + "temizle" | `std` … (ISO tarih ya da `null`) |
| RDY / SND | tıklanmaz | — |
| PF/USD, PF/TL, INV/USD, INV/TL | sayı girişi | `pfUsd`, `pfTl`, `invoice`, `invoiceTl` (sayı ya da `null`) |
| PAYMENT RULE | kural listesi (`GET /payment-rules`), yenisi eklenebilir (`POST /payment-rules`) | `paymentRule` |
| CONTAINER # | yazılabilir alan + çoklu seçim listesi (CONTAINER 1…20 ve daha önce kullanılanlar; `GET /containers/names`). Sadece sayı yazılırsa `23` → `CONTAINER 23`. Birden çok seçilirse virgülle | `containerNo` |
| CONTAINER DATE | tarih seçici | `containerDate` |

**VENDOR'a basınca özel durum: TR-STOCK.** Satıcı **TR-STOCK** (Trust Stock) seçilirse, bu satır
şirket stoğundan karşılanıyor demektir. Kaydedilince hemen **stok kullanım penceresi** açılır:
hangi üründen kaç adet alındı / ayrıldı / iade edildi, kim aldı. Endpoint'ler
`T-ERP-INTEGRATION.md`'de "TR-STOCK rows" başlığında. Kaynak: `components/StockUsageModal.tsx`.
Sağ tık menüsünde de "Use from Trust Stock" olarak çıkar.

**Sürükleyerek toplu değiştirme:** CONTAINER #, PF SIGN STATUS ve STATUS hücrelerinde fareyle
basılı tutup aşağı sürükleyerek birden çok satır seçilir. Seçili hücreler açık mavi `#bfdbfe`
olur. Bırakınca editör açılır; seçilen değer **seçili bütün satırlara** yazılır.

**Notlar (sağ tık):**
- **STATUS** hücresine sağ tık → "Not Ekle", not varsa "Notu Görüntüle / Notu Düzenle / Notu Sil"
  (`statusNote`, metin).
- **Para** hücrelerine sağ tık → fiyat notu (`priceNotes`: `{ pfUsd: "…", invoice: "…" }`
  biçiminde nesne).
- Not olan hücrenin sağ üstünde **8 px yeşil nokta** (`#22c55e`) görünür.

**Satıra sağ tık:** küçük menü: (TR-STOCK ise "Use from Trust Stock") ve **Delete Row**.
Silinen satır çöp kutusuna gider, geri alınabilir: `DELETE /projects/:projectId/items/:itemId`.

**Geri al:** **Ctrl+Z / Cmd+Z** son 3 tablo değişikliğini geri alır. Kısa bir toast gösterilir.
Bir input'a yazı yazılırken tarayıcının kendi geri alması çalışır.

---

## 8. Proje başlığı, proje menüsü, TOTAL

**Proje başlığı:** koyu gri `#404040` bant, en az 60 px, ortalı. Üstte proje adı (16 px kalın),
altta adres (12 px). **Sağ tık** proje menüsünü açar.

**Proje menüsü:**
- **Belge Hazırla**: fiyat listesi / belge sayfası. T-ERP'de yoksa Trust System'de yeni sekmede aç.
- **Make Urgent / Remove Urgent** (`PATCH /projects/:id { isUrgent }`): proje no kırmızı olur.
- **Add to Group…** (PF grupları, bölüm 9)
- **Edit Name**, **Edit Address** (`PATCH /projects/:id`)
- **Edit Types**: tip ekle / çıkar, yeni özel tip yarat. Eklenen tip için boş satır açılır,
  çıkarılan tipin satırları silinir (çöp kutusuna). Trust System onay sormuyor. T-ERP'de **ek
  güvenlik olarak**, satırı olan bir tipi çıkarmadan önce onay iste.
- **Move to Region** (`PATCH /projects/:id/move-region { bucket }`)
- **Delete Project**: onaylı; çöp kutusuna gider.

**TOTAL satırı** (her projenin altında, 32 px):
- Zemin `#404040`, beyaz kalın 11 px büyük harf.
- PROJECT # altı boş / saydam. "TOTAL" yazısı **SND kolonunda, sağa yaslı**.
- PF/USD, PF/TL, INV/USD, INV/TL altında o projenin toplamları: lacivert `#1e40af` zemin, beyaz,
  `$ 39,000.00` / `₺ 0.00`. Diğer kolonlar boş.
- Rolün göremediği satırlar toplama girmez. Para kolonu gizliyse toplamı da gizli.

---

## 9. Filtreler ve araçlar

Filtre çubuğu (`components/FilterBar.tsx`). Bütün filtreler **birlikte** çalışır (VE).
- **Arama**: proje numarasında arar. Sonuç sırası: tam eşleşen, numarası onunla başlayan, içinde
  geçen.
- **Vendor, Type, Status, Container, Half**: çoklu seçim listeleri. Seçilenler çip olarak
  görünür, tek tek kaldırılır, "Clear all" hepsini temizler. Satır bazlı süzer: eşleşen satırı
  olmayan proje gizlenir. Eşleşen projede de sadece eşleşen satırlar görünür.
- **ToDo** ve **Receive Follow Up** (Projects sekmesi): "Today's PFs" işaretleri
  (`GET/POST/DELETE /today-pf`). ToDo bugünün bitirilecek PF'lerini, Follow Up takip edilenleri
  gösterir. Edit menüsünde "Today's PFs & Follow Up" yönetim penceresi var.
- **İmza bekleyen hızlı filtreler** (çip):
  - PO Waiting TLines (turuncu)
  - PO Waiting T (mor)
  - PF Waiting T (mor)
  - To Order (pembe)
  - Books in Progress (mavi)
- **Groups** (PF grupları, `GET/POST /pf-groups` …): proje+tip çiftleri numaralı gruplara ve
  sıralara konur. "Group view" açılınca tablo bölge yerine **gruba göre** dizilir (Group 1, Group 2…
  bantları). Tip hücresinde rank rozeti görünür.
- **Half**: projeler yılın ilk / ikinci yarısına atanır (`PATCH /projects/bulk/half
  { projectIds, halfOfYear: FIRST_HALF|SECOND_HALF|null, halfYear }`). Filtre: "2026 First Half",
  "Unassigned".
- **Export Excel**: görünen tabloyu Excel'e, aynı renklerle (`utils/excel/exportProjectsExcel.ts`).

---

## 10. Altta sabit yatay kaydırma çubuğu

Tablo çok geniş (~3.700 px). Kullanıcı sayfanın ortasındayken yatay kaydırabilmeli.
- Ekranın **en altına sabitlenmiş** (`position: fixed; bottom: 0; left: 0; right: 0`), 14 px
  yüksek, `z-index` yüksek bir **kaydırma çubuğu** koy. İçinde 1 px yüksek, genişliği tablonun
  `scrollWidth`'ü kadar boş bir div olsun.
- Tablo kabının kendi yatay kaydırma çubuğunu gizle.
- İkisini **senkronla**: çubuk kayınca tablo `scrollLeft`, tablo kayınca (ör. shift+tekerlek,
  trackpad) çubuk. Döngüye girmemesi için bir "senkronlanıyor" bayrağı kullan, bayrağı
  `requestAnimationFrame`'de bırak.
- Tablo genişliği değişince (filtre, kolon gizleme, veri yükleme) iç div genişliğini güncelle:
  `ResizeObserver`.
- Sol iki kolon sticky kaldığı için kayarken proje no ve tip hep görünür.
- Kaynak: `components/OperationalBoardGrid.tsx` (`bottomBarRef`, `handleMainScroll`,
  `handleBottomBarScroll`) ve `styles.css` `.global-scroll-bottom-bar`.

---

## 11. Missing Extra ve Direct Orders sekmeleri

İkisi de **aynı tabloyu, aynı kolonları, aynı davranışları** kullanır. Farklar:

### Missing Extra
Bir projeye sonradan eklenen **eksik / ekstra / değişim** işleri. Her biri bir **case**'tir ve
tabloda **ayrı bir proje bloğu** gibi görünür.
- Case türü: **MISSING** (eksik), **EXTRA** (ekstra), **REPLACEMENT** (değişim).
- **Case kodu** proje numarası yerine geçer: `{ana proje no}-{MS|EX|RE}-{sıra}`, ör. `440-EX-2`
  (Extra'nın 2.'si). Sıra aynı proje + tür içinde 1, 2, 3…
- Blok başlığı: `{ana proje adı} ({TÜR})`, ör. "Webster city (EXTRA)".
- PF kodu case koduyla: `YSM-440-EX-2-M01`. Sabit Millwork kuralı ve F kuralı aynı. Missing
  Extra'da PF kodu **satıcı atanınca** verilir.
- **Create Missing/Extra** formu:
  - Ana proje: listeden seç **ya da** "legacy" için elle numara + ad
  - Bölge (section)
  - Tür: MISSING / EXTRA / REPLACEMENT
  - Tipler (en az bir)
  - İsteğe bağlı sıra numarası (doluysa çakışma kontrol edilir)
- Endpoint'ler:
  - `GET /missing-extra/cases`, `GET /missing-extra/cases/:id`, `POST /missing-extra/cases`
  - `PATCH /missing-extra/cases/:id`, `PATCH /missing-extra/cases/:id/move-region`,
    `DELETE /missing-extra/cases/:id`
  - satırlar: `POST /missing-extra/cases/:caseId/items`, `PATCH /missing-extra/items/:itemId`,
    `DELETE /missing-extra/items/:itemId`
  - `PATCH /missing-extra/cases/bulk/half`
- Case'in bölgesi API'de `section` alanıdır, projedeki `bucket` ile aynı değerler.

### Direct Orders
Bir müşteri projesine bağlı olmayan **doğrudan siparişler**.
- Proje no `DO-001` gibi. Aynı numara aynı bölgede bir kez.
- PF kodu: `{SATICI}-PDO{numara}-{harf}{sıra}`, ör. `DO-008` → `YSM-PDO008-M01`. PF kodu
  **satıcı atanınca** verilir.
- Endpoint'ler:
  - `GET /direct-orders`, `GET /direct-orders/:id`, `POST /direct-orders`
  - `PATCH /direct-orders/:id`, `PATCH /direct-orders/:id/move-region`, `DELETE /direct-orders/:id`
  - satırlar: `POST /direct-orders/:projectId/items`,
    `PATCH /direct-orders/:projectId/items/:itemId`, `DELETE /direct-orders/:projectId/items/:itemId`
  - `PATCH /direct-orders/bulk/half`

---

## 12. Şu anki T-ERP ekranında gördüğüm eksikler (öncelik sırasıyla)

Ekran görüntüsünden:

1. **TYPE ve PO SIGN STATUS her satırda ayrı tekrarlanıyor.** İkisi de tip grubu boyunca **tek
   birleşik hücre** olmalı (bölüm 4). PO tek; PF'ler satır satır.
2. **Durumlar küçük badge olarak çizilmiş.** Trust System'de durum rengi **hücrenin zemini**,
   hücre boyunca. Renkler bölüm 5'teki değerler.
3. **PO Status ve PF Sign Status aynı görünüyor.** PO tip başına tek; PF satır başına.
4. **PF CODE ve VENDOR boş, ORDER TYPE "-" kutusu.** Satıcı / order type seçimi (bölüm 7) ve
   sunucudan gelen PF kodu (bölüm 6) yok. Boş değer boş görünmeli, "-" kutusu değil.
5. **Satır başına `$0.00` / `₺0.00`.** Boş tutar boş görünmeli. Sadece TOTAL'de sıfır yazılır.
6. **TOTAL satırı**: "TOTAL" SND kolonunda sağa yaslı; toplamlar lacivert `#1e40af` zeminli.
7. **Proje no rengi** kurala göre değişmeli (yeşil / kırmızı / mavi / turuncu, bölüm 4). Şu an
   hepsi turuncu.
8. **Sticky** bölge bandı, kolon başlığı ve sol iki kolon; **altta sabit yatay kaydırma çubuğu**
   (bölüm 2, 10).
9. **Hücre editörleri**, sağ tık menüleri, notlar, sürükleyerek toplu değiştirme, Ctrl+Z
   (bölüm 7).
10. **Proje başlığında sağ tık menüsü** (bölüm 8), Half araç çubuğu, ToDo / Follow Up / imza
    filtreleri / Groups (bölüm 9).
11. **Missing Extra case kodları ve Create Missing/Extra formu**, Direct Orders `DO-` numaraları
    (bölüm 11).
12. **Canlı güncelleme**: başkası değiştirince hücre kendiliğinden güncellenmeli
    (`T-ERP-INTEGRATION.md` bölüm 3).

Bölge bandı, proje başlığı (koyu gri, ad + adres) ve proje no hücresinin dikey birleşmesi zaten
doğru. Onları koru.

---

## 13. Tasarım sınırı: neresi T-ERP, neresi Trust System

| T-ERP tasarım sistemi | Trust System ile aynı kalacak |
|---|---|
| sayfa başlığı, sekmeler, butonlar, filtre çubuğu, çipler, arama, araç çubukları | kolon sırası ve genişlikleri, satır yükseklikleri (40 / 32) |
| editör popover'larının kabuğu, menüler, modallar, toast | birleşik hücreler (Project #, Type, PO) |
| font ailesi (tablo içinde de T-ERP fontu kullanılabilir) | durum renkleri (hücre zemini), proje no renk kuralı |
| ikonlar | bölge bandı kırmızı `#B02417`, proje başlığı `#404040`, TOTAL `#404040` + `#1e40af` |
| | sticky davranışlar ve alttaki sabit kaydırma çubuğu |

---

## 14. Veri güvenliği

T-ERP **canlı** veriye bağlı.
- Geliştirirken sadece okuma. Yazmayı adı **"TEST"** olan ayrı bir projede dene, işin sonunda
  sil (çöp kutusuna gider).
- Gerçek projelerde deneme düzenlemesi, toplu işlem, silme, Half atama yapma.
- **Asla çağırma:**
  - `/missing-extra/dev/clear` ve `/missing-extra/dev/reset`: kapatıldılar, yine de dokunma
  - `POST /direct-orders/fix-missing-pf-codes`
  - toplu "düzeltme" scriptleri
- Döngüyle istek atma. Dakikada 200 istek sınırı var. PO değişikliğinde satırları sırayla gönder.

---

## 15. Bitti sayılması için kontrol listesi

Trust System (https://trust-excel.vercel.app/project-tracking/projects) ile yan yana açıp kontrol et:
- [ ] Aynı bölgeler, aynı projeler, aynı satırlar, aynı sırada; projeler en yeni üstte
- [ ] Project #, Type ve PO SIGN STATUS dikey birleşik; PO tip başına tek
- [ ] Durum renkleri hücre zemini olarak, tablodaki değerlerle birebir
- [ ] Proje no rengi kurala uyuyor (urgent → kırmızı, hepsi SENT → yeşil, PO imzalı → mavi)
- [ ] TEST projesinde:
  - [ ] satıcı seç → PF SIGN STATUS'u WAITING T TO SIGN yap → PF kodu sunucudan geliyor ve Trust
        System'dekiyle aynı
  - [ ] Status'u ORDERED yap → STD bugün
  - [ ] READY → RDY dolu
  - [ ] NOT ORDERED → tarihler siliniyor
  - [ ] PO değiştir → tipteki bütün satırlar değişiyor
  - [ ] TR-STOCK seçilince stok penceresi açılıyor (sadece TEST'te dene)
  - [ ] not ekle → yeşil nokta
  - [ ] Ctrl+Z → geri alıyor
  - [ ] satır sil → çöp kutusunda
- [ ] TOTAL satırı doğru yerde, doğru renklerde, toplamlar doğru
- [ ] Bölge bandı, kolon başlığı ve sol iki kolon yapışık; alttaki sabit kaydırma çubuğu tabloyu
      kaydırıyor, tablo kayınca çubuk da kayıyor
- [ ] Filtreler (Vendor, Type, Status, Container, Half, ToDo, Follow Up, imza çipleri, Groups) aynı
      sonucu veriyor
- [ ] Missing Extra: case kodları `440-EX-2` biçiminde, başlık "Ad (EXTRA)", PF kodları case kodlu;
      Create Missing/Extra formu çalışıyor
- [ ] Direct Orders: `DO-` numaraları, `PDO` PF kodları
- [ ] Trust System'de bir hücreyi değiştir → T-ERP'de yenilemeden görünüyor (ve tersi)
- [ ] Rol yetkisiyle gizli kolon T-ERP'de de gizli

Bitince yaptığın değişikliklerin listesini yaz: hangi dosyada ne değişti, neyi bilerek farklı
bıraktın ve neden.
