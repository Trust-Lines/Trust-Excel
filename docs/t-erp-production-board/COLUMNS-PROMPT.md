# Komut: TYPE, PF CODE, VENDOR, ORDER TYPE kolonları: tıklayınca ne olur, içinde ne var

> Bu, `PROMPT.md`'nin (Production Board) **devamı ve ayrıntısı**. Sadece tablonun bu dört
> kolonunu anlatır: tıklayınca açılan ekranlar, içindeki her alan, kaydedince ne olduğu, sağ tık
> menüsü ve PF kodunun order type'a göre nasıl değiştiği.
> Kaynak kodlar `../t-erp-projects-port/projects-page-source.md` içinde (dosya adları aşağıda).
> Görünüm T-ERP tasarım sisteminde olacak; **davranış birebir aynı**.

---

## Kısa özet

| Kolon | Hücre | Tıklayınca | Kaydedince sunucuya giden |
|---|---|---|---|
| **TYPE** | tip grubu boyunca tek birleşik hücre | **"Edit {Tip} Item" paneli** (satıcı + order type + yeni PF ekleme) | `vendorId`, `orderType`; yeni satır için `POST` |
| **PF CODE** | satır başına | **hiçbir şey: salt okunur** | — (sunucu üretir) |
| **VENDOR** | satır başına, "KOD - Ad" | **aranabilir satıcı listesi** (yeni satıcı ekleme ve satıcı düzeltme dahil) | `vendorId` |
| **ORDER TYPE** | satır başına | **aranabilir order type listesi** (yenisini ekleme dahil) | `orderType` |
| satır (her hücre) | | **sağ tık → satır menüsü** | sil / stoktan kullan |

Her kayıttan sonra **sunucunun döndürdüğü satırı** ekrana uygula. Özellikle `pfCode`, `vendor`,
`orderType`, `poSignStatus` değişmiş olabilir. Satır güncelleme:
`PATCH /api/trust/projects/items/:itemId` (sadece değişen alan).

---

## 1. TYPE kolonu ve "Edit Item" paneli

Kaynak: `components/InlineEditPanel.tsx`, `components/ProjectBlock.tsx` (`handleTypeClick`,
`handleItemAdded`).

### Hücre
- Tip adı: Millwork, Shelving, Ceiling, Image, Furniture, Decoration ya da özel tip adı.
- **Tip grubunun bütün satırları boyunca tek hücre** (yükseklik = satır sayısı × 40 px).
- Grubun bütün satırları SENT / SENT TO TLINES ise koyu yeşil `#15803d`, beyaz kalın yazı,
  solda 3 px `#052e16` çizgi.
- Tip bir PF grubundaysa sol üstte küçük kırmızı rozet (`#b91c1c`, beyaz): grup içindeki rank
  numarası. Üzerine gelince "Group N, rank R".
- Rolün TYPE kolonunu düzenleme yetkisi yoksa tıklanmaz. Rolün göremediği tip bulanık ve tıklanmaz.

### Tıklayınca: panel
- **Konum:** tıklanan noktanın sağ altında açılır (8 px boşluk), ekrana sığmazsa yukarı / sola
  kayar. Genişlik 300–400 px, yaklaşık 320 px yükseklik. Hücre çok uzun olabileceği için
  hücrenin kenarı değil, **farenin tıkladığı nokta** referans alınır.
- Tip grubunun satırları **tablodaki sırayla** panele yüklenir. **İlk satır seçili** gelir.

**Panelin içi, yukarıdan aşağı:**

1. **Başlık:** "Edit {Tip} Item", ör. "Edit Millwork Item". Grupta birden çok satır varsa yanında
   "**2 of 3**".
2. **Add Item** butonu (yeşil çerçeveli). Sadece rolün `canAddItems` yetkisi varsa görünür.
   Tooltip: "Add another item of the same type".
3. **Auto: ON / OFF** düğmesi. Otomatik kayıt, varsayılan **ON**.
4. **‹ ›** önceki / sonraki satır. Sadece grupta birden çok satır varsa. Uçlarda pasif.
5. **×** kapat.
6. Hata varsa kırmızı kutu.
7. **Current PF Code**: seçili satırın PF kodu, gri kutuda, monospace, **salt okunur**. Kod
   yoksa bu alan hiç görünmez.
8. **Vendor**: aranabilir satıcı alanı ("Search vendors..."). Listenin altında
   **"+ Add New Vendor"**, yeni satıcı formunu açar (bölüm 3.4).
9. **Order Type**: aranabilir order type alanı ("Search order types..."). Yazılan değer listede
   yoksa eklenebilir (bölüm 4).
10. Değişiklik varsa: "Changes will be auto-saved in 300ms..." (yanıp sönen nokta).
11. Satıcı seçiliyse bilgi satırı: "PF code will be automatically generated when you save".

### Paneldeki olaylar
- **Otomatik kayıt:** Vendor ya da Order Type değişince 300 ms sonra kaydeder. Gönderilen alanlar
  `{ vendorId }` ve/veya `{ orderType }`; boşaltılırsa `null`. Ekranı önce iyimser günceller,
  sonra sunucu cevabıyla düzeltir. **Yeni PF kodu cevaptan gelir** ve "Current PF Code"da görünür.
- **Auto OFF iken:** değişiklik bekler. Satır değiştirmeden / kapatmadan önce kaydet.
- **‹ ›:** başka satıra geçer. Alanlar o satırın değerleriyle dolar.
- **Add Item:** aynı tipte **yeni bir satır = yeni bir PF** açar.
  - İstek: `POST /projects/:projectId/items`, gövde `{ type: "MILLWORK" }`; özel tipte
    `{ type: null, customTypeId }`.
  - Yeni satır satıcısız, PF kodsuz, Status = NOT ORDERED gelir.
  - **Panel yeni satıra geçer**, kullanıcı satıcısını seçer.
  - **PO durumu devralınır:** gruptaki satırların PO'su SIGNED / WAITING TLINES TO SIGN / WAITING
    T TO SIGN ise (bu öncelikle), yoksa READY TO SIGN ise, yeni satıra aynısı
    `PATCH { poSignStatus }` ile yazılır. Çünkü PO tip başına tektir, yeni satır da o PO'ya girer.
- **Kapatma:** × ya da panelin ve tıklanan hücrenin dışına tıklamak. **Esc**: değişiklik yoksa
  kapatır; varsa "You have unsaved changes. Are you sure you want to close?" diye sorar.
- **TR-STOCK:** satıcı TR-STOCK yapılırsa ya da yeni satır TR-STOCK ile oluşursa, stok kullanım
  penceresi açılır (bölüm 3.5).

---

## 2. PF CODE kolonu

Kaynak: sunucu `server/src/projects/services/pf-code-generation.service.ts`,
`server/src/common/helpers/fixed-millwork-codes.ts`, `server/src/projects/projects.service.ts`
(`poAllowsPfCode`).

### Hücre
- PF kodunu düz metin gösterir, ör. `YSM-440-M02`. Boşsa boş.
- **Projects ve Missing Extra'da salt okunur.** Tıklanınca editör açılmaz. Sunucu, istemciden
  gelen `pfCode`'u **yok sayar** ve kendisi üretir.
- Sadece **Direct Orders'ta özel tip satırlarında** elle yazılabilir (düz metin, monospace,
  Enter / dışarı tıklama kaydeder, Esc iptal). Trust Stock sayfasında da elle yazılır; o ayrı.

### PF kodu biçimi
**`{SATICI KODU}-{PROJE NO}-{TİP HARFİ}{İKİ HANELİ SIRA}`**

| Tip | Harf |
|---|---|
| Millwork | M |
| Shelving | S |
| Ceiling | C |
| Image | I |
| Furniture | F |
| Decoration | D |
| Özel tip | tipin kendi kısa kodu |

Missing Extra'da proje no yerine case kodu: `YSM-440-EX-2-M01`. Direct Orders'ta `YSM-PDO008-M01`.

### PF kodu ne zaman oluşur / değişir / silinir (Projects)
**Şart:** satırın **satıcısı var** ve **PF SIGN STATUS** = WAITING T TO SIGN, WAITING TLINES TO
SIGN, SIGNED ya da SIGNED WITH EST PRICE. NOT SIGNED ve READY TO SIGN'da **PF kodu yoktur**.
(Missing Extra ve Direct Orders'ta bu şart yok, satıcı atanınca kod verilir.)

Şart sağlanıyorsa sunucu kodu şu durumlarda verir ya da yeniden hesaplar:
- satıcı ilk kez atandı ya da değişti
- tip değişti
- PF durumu "kod verilir" seviyesine çıktı
- **order type değişti ve kod buna bağlı** (aşağıdaki iki kural)
- satırın kodu hiç yoktu (bir sonraki düzenlemede kendiliğinden verilir)

Kod **silinir**: satıcı kaldırılınca ya da PF durumu NOT SIGNED / READY TO SIGN'a geri alınınca.

### Order type'a göre PF kodu (iki kural)

**Kural A: sabit Millwork kodlu satıcılar.** Satıcı ayarında "Millwork PF kodu sipariş tipine
göre" işaretli olanlar (ör. **GOS, TDR, YSM**). Hangileri olduğunu sabit yazma; satıcı bilgisindeki
`fixedMillworkCodes: true` alanından oku.
Bu satıcıların **Millwork** satırlarında kodun numarası **order type'tan** gelir:

| Order type (harf dışı karakterler ve büyük/küçük harf önemsiz) | Kod |
|---|---|
| STANDARD / BASIC | **M01** |
| STANDARD / SELECTIVE | **M02** |
| CUSTOM / SELECTIVE (ya da SELECTIVE / CUSTOM) | **M03** |
| diğer her şey (boş order type dahil) | **M04, M05, …** (boştaki en küçük numara) |

- M01–M03 o projede kullanılmasa bile **ayrılmıştır**.
- Aynı order type'a sahip birden çok satır **aynı kodu paylaşır** (ör. iki satır M01). Bu bilerek
  böyle.
- Order type değişince kod **hemen** yeniden hesaplanır: STANDARD / BASIC → CUSTOM / SELECTIVE
  yapılırsa M01 → M03.
- Çöp kutusundaki satırlar numara tutmaz. Silinen M05'in numarası tekrar verilir.

**Kural B: FURNITURE.** Herhangi bir satıcıda, order type'ında **FURNITURE** geçen bir **Millwork**
satırı **F** harfi alır, ör. `KYA-409-F01`. Numarası o projede o satıcının F kodlarıyla birlikte
sayılır. Order type FURNITURE'a girince ya da çıkınca kod M ↔ F değişir.

**Diğer satıcılar ve tipler:** order type kodu etkilemez. Numara o satıcı + proje + tip içinde
sırayla artar (01, 02, …).

### Satır sırası (PF kodu sıralamayı etkiler)
Bir tip grubunun içinde satırlar:
1. **YSM**, sonra **GOS**
2. diğer satıcılar blok halinde, satıcının o tipte ilk göründüğü sırayla
3. satıcısız satırlar en sonda
4. satıcı içinde PF numarasına göre (M01, M02, …), sonra oluşturulma sırasına göre

Kaynak: `types.ts` → `sortItemsForDisplay`.

---

## 3. VENDOR kolonu

Kaynak: `components/CellVendorAutocomplete.tsx`, `components/AddVendorModal.tsx`,
`components/StockUsageModal.tsx`, `lib/trust-stock.ts` (`isStockVendorCode`).

### 3.1 Hücre
- "**KOD - Ad**", ör. `YSM - YAŞAM PLUS`, `TR-STOCK - TRUST-STOCK`. Satıcı yoksa boş.

### 3.2 Tıklayınca: satıcı seçici
- Hücrenin içinde bir **yazı alanı** açılır ("Select or type to filter..."). Mevcut değer seçili
  ve odakta gelir.
- Hücreye yapışık bir **açılır liste** açılır: en az 320 px geniş, en fazla 350 px yüksek,
  kaydırılabilir. Liste hemen açık gelir.
- **Liste içeriği** (`GET /vendors`):
  - sadece aktif satıcılar
  - "KOD - Ad", alfabetik
  - **YSM her zaman en üstte**: kalın yazı, solda 4 px sarı `#fbbf24` çizgi
- **Mevcut satıcı** listede vurgulu gelir (açık mavi `#e5f3ff`).
- **Arama:** 3+ karakter yazınca kod, ad ya da "KOD - Ad" içinde arar. Daha az karakterde bütün
  liste görünür.
- **Klavye:** ↓ ↑ gezinir, Enter / Tab seçer, Esc kapatır.
- **Seçince:** `PATCH { vendorId }`, editör kapanır, satır cevapla güncellenir. Yeni PF kodu
  gelebilir (bölüm 2).

### 3.3 Listedeki ek işlemler
- **Satıcıyı düzelt (✎):** her satırın sağında soluk bir kalem ikonu.
  - Tıklayınca o satır **yerinde iki küçük alana** dönüşür: Kod, Ad.
  - Save / Cancel, Enter / Esc.
  - Kod büyük harfe çevrilir.
  - `PATCH /vendors/:id { code, name }`.
  - Başarılıysa **tablodaki bütün satırlarda** o satıcının görünen adı hemen güncellenir.
  - Hata olursa uyarı.
- **"+ Create new vendor "{yazılan}"":** yazılan metin (2+ karakter) hiçbir satıcının kodu / adı
  ile **tam eşleşmiyorsa** listenin sonunda yeşil satır olarak çıkar. Tıklayınca **Add New Vendor**
  formu açılır, ad alanı yazılanla dolu gelir.

### 3.4 "Add New Vendor" formu
- **Vendor Name \*** (zorunlu; ör. "Premier Millwork Solutions"; benzersiz)
- **Vendor Code \*** (zorunlu; **2–10 karakter**, otomatik büyük harf; ör. "PMS"; benzersiz).
  Bu satıcının **bütün PF kodlarının başı** olur. Sunucu kodsuz kaydı **kabul etmez**.
- ☐ **"Millwork PF kodu sipariş tipine göre (Basic → M01, Selective → M02, Custom → M03)"**:
  `fixedMillworkCodes`, Kural A.
- Bilgi kutusu: "When you assign this vendor to project items, PF codes will be automatically
  generated: `{KOD}-[PROJECT_NO]-[TYPE][NUM]`".
- **Create Vendor** → `POST /vendors { name, code, fixedMillworkCodes }`.
  - Başarılıysa form kapanır, liste yenilenir, **yeni satıcı o satıra hemen atanır**.
  - Aynı kod / ad varsa sunucu 409 döner ("A vendor with code 'X' already exists"); mesajı formda
    göster.

### 3.5 TR-STOCK (Trust Stock) satıcısı
Kodu harf olarak "TRSTOCK" olan satıcı (`TR-STOCK`). Bu satır **şirket stoğundan karşılanıyor**
demektir.
- Satır TR-STOCK'a **ilk geçtiği anda** (bunu değiştiren kullanıcıda) **"Use from Trust Stock"**
  penceresi kendiliğinden açılır. Başlığında "Project 440 · Millwork · {PF kodu ya da 'no PF code'}".
- Satıra sağ tıklayınca da menüde "Use from Trust Stock" olarak çıkar.
- **Pencerenin içi:**
  - üstte stok PF'leri seçilir
  - ürün listesi:
    - kolonlar: Item Code, Description, Dimensions, Ordered, Received, Taken, Returned, Reserved,
      On Hand, Available, Status
    - "Filter items…" arama alanı
  - her ürün için bu satırın **TAKE / RESERVE / RETURN** adedi
  - "**This row:**" bu satırın şimdiye kadar aldıkları, her hareketin yanında geri al (×)
  - limitler:
    - "Max N can be taken"
    - "Max N can be reserved"
    - "Can return at most N"
    - depoda henüz alınmamış ürünlerde sınır sipariş adedidir
  - **kim aldı**: "Name (pick or type a new one)", zorunlu. Boşsa Save turuncu çerçeveli uyarı
    verir.
  - **Save**: bütün hareketler tek seferde, `POST /trust-stock/usage/movements`
- Endpoint'ler: `T-ERP-INTEGRATION.md` → "TR-STOCK rows".
- Stok yoksa: "Trust Stock is empty — upload PF PDFs on the Trust Stock page first."

---

## 4. ORDER TYPE kolonu

Kaynak: `components/CellOrderTypeAutocomplete.tsx`, sunucu `server/src/order-types`.

### Hücre
- Order type metni, ör. `STANDARD / BASIC`, `CUSTOM / SELECTIVE`, `FURNITURE`. Boşsa **boş**
  ("-" kutusu koyma).

### Tıklayınca
- Hücrede yazı alanı ("Select or type to filter...") ve hemen açık bir liste.
- **Liste:** `GET /order-types`, aktif olanlar, **alfabetik**. Mevcut değer vurgulu.
- **Arama:** yazdıkça adın içinde arar. Boşken bütün liste.
- **"+ Add order type "{yazılan}"":** yazılan metin (2+ karakter) listede **tam yoksa** en altta
  çıkar.
  - Seçince önce `POST /order-types { name }`, sonra satıra yazılır.
  - Ekleme yetkisi rolün `canManageMasterData` iznine bağlı; yoksa sunucu 403 döner.
  - Aynı ad varsa 409.
- **Klavye:** ↓ ↑, Enter / Tab seçer, Esc iptal.
- **Seçince:** `PATCH { orderType: "<metin>" }` (boşaltılırsa `null`). Geri al listesine girer.

### Order type'ın etkisi
- **PF kodunu değiştirebilir** (bölüm 2, Kural A ve B). Kaydettikten sonra cevaptaki `pfCode`'u
  mutlaka göster.
- Dashboard'daki "order type yok" uyarısı bu alanın boş olmasına bakar.

---

## 5. Sağ tık

Kaynak: `components/ProjectBlock.tsx` (`handleRowContextMenu`, `rowContextMenu`, `noteMenu`,
`priceNoteMenu`).

### Satıra sağ tık (TYPE, PF CODE, VENDOR, ORDER TYPE ve diğer hücreler)
Fare konumunda küçük bir menü (beyaz, yuvarlatılmış köşe, gölgeli; en az 180 px):
- Üstte gri küçük başlık: satırın tipi (ör. "MILLWORK").
- **Use from Trust Stock**: sadece satıcı TR-STOCK ise (bölüm 3.5).
- **Delete Row** (kırmızı): satırı siler, `DELETE /projects/:projectId/items/:itemId`.
  Çöp kutusuna gider, oradan geri alınabilir. Tip grubunun son satırı silinirse tip tablodan kalkar.
  Trust System onay sormuyor. **T-ERP'de ek güvenlik olarak onay sor**, özellikle satırın PF kodu
  ya da satıcısı varsa.
- Menünün dışına tıklama ya da tekrar sağ tık menüyü kapatır.

Rolün göremediği (bulanık) satırlarda sağ tık çalışmaz.

### Özel sağ tıklar (bilgi için)
- **STATUS** hücresi: not menüsü. "Not Ekle", not varsa "Notu Görüntüle / Notu Düzenle / Notu Sil".
- **PF/USD, PF/TL, INV/USD, INV/TL** hücreleri: o fiyat için not (`priceNotes`).
- **Proje başlığı**: proje menüsü (`PROMPT.md` bölüm 8).

---

## 6. Akış örnekleri (doğru çalıştığını bunlarla kontrol et)

**Örnek 1: normal satıcı**
1. Millwork satırında VENDOR → `KYA` seç. PF SIGN STATUS NOT SIGNED olduğu için **PF CODE boş
   kalır.**
2. PF SIGN STATUS → WAITING T TO SIGN. Cevapta `KYA-440-M01` gelir, PF CODE dolar.
3. Aynı tipe TYPE paneli → Add Item. Yeni satır, satıcı KYA. PF durumu NOT SIGNED → kod boş.
   WAITING T TO SIGN yapınca `KYA-440-M02`.

**Örnek 2: sabit kodlu satıcı (YSM)**
1. Millwork satırı, VENDOR YSM, PF SIGN STATUS SIGNED, ORDER TYPE `STANDARD / BASIC` → `YSM-440-M01`.
2. ORDER TYPE → `CUSTOM / SELECTIVE` → kod **`YSM-440-M03`** olur.
3. ORDER TYPE → `IMAGE` → **`YSM-440-M04`** (M04 boşsa).
4. İkinci bir satır `STANDARD / BASIC` → o da **`YSM-440-M01`**. Aynı kod, bilerek.

**Örnek 3: Furniture**
1. KYA Millwork satırı `KYA-409-M01`, ORDER TYPE → `FURNITURE` → **`KYA-409-F01`**.
2. ORDER TYPE başka bir şeye dönerse tekrar M koduna döner.

**Örnek 4: stok**
VENDOR → `TR-STOCK` → "Use from Trust Stock" penceresi açılır. Ürün seç, TAKE adedi gir, kim
aldığını yaz, Save. Satır sağ tık menüsünde "Use from Trust Stock" görünür.

Bu örnekleri **sadece adı "TEST" olan projede** dene (canlı veri). İşin sonunda TEST projesini sil.

---

## 7. Kontrol listesi

- [ ] TYPE hücresi tip boyunca tek. Tıklayınca panel tıklanan noktada açılıyor. Başlık
      "Edit X Item", "n of m", ‹ ›, Auto ON/OFF, ×
- [ ] Panelde Current PF Code (salt okunur), Vendor ve Order Type alanları, 300 ms sonra otomatik
      kayıt, Esc'te kaydedilmemiş değişiklik uyarısı
- [ ] Add Item yeni satır açıyor, panel yeni satıra geçiyor, PO durumu devralınıyor
- [ ] PF CODE Projects / Missing Extra'da tıklanmıyor; değer hep sunucudan
- [ ] PF kodu NOT SIGNED / READY TO SIGN'da boş; WAITING T TO SIGN'da doluyor
- [ ] YSM / GOS / TDR'de order type M01 / M02 / M03 / M04+ kuralına göre kod değişiyor;
      FURNITURE → F
- [ ] VENDOR listesi: YSM üstte ve vurgulu, 3 harfte arama, ✎ ile satıcı düzeltme, "+ Create new
      vendor" ve Add New Vendor formu (kod zorunlu, 2–10 karakter, sabit kod seçeneği)
- [ ] TR-STOCK seçilince stok penceresi açılıyor; sağ tıkta "Use from Trust Stock"
- [ ] ORDER TYPE listesi alfabetik, arama, "+ Add order type", yetkisizde hata mesajı
- [ ] Sağ tık menüsü: tip başlığı, (TR-STOCK) Use from Trust Stock, Delete Row (T-ERP'de onaylı)
- [ ] Her kayıttan sonra satır sunucu cevabıyla güncelleniyor (PF kodu dahil)
