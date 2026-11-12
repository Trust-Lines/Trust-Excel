# Komut: Production Board proje menüsü (sağ tık)

> Bu metni T-ERP'deki Claude'a olduğu gibi ver. Kendi başına yeterli. Görünüm T-ERP tasarım
> sisteminde, **davranış Trust System'deki ile birebir aynı**. API çağrıları T-ERP'nin
> `/api/trust/*` proxy'si üzerinden (bkz. `T-ERP-INTEGRATION.md`). Kaynak kod:
> `projects-page-source.md` içinde `components/ProjectMenu.tsx`, `components/AddToGroupModal.tsx`,
> `components/ProjectBlock.tsx` (`handleEditProject`, `handleToggleUrgent`).

---

## Proje numarası hücresi (menünün açıldığı yer)

Tablonun en solundaki renkli, büyük hücre. Projenin **bütün satırları boyunca tek, dikey birleşik**
hücre: yükseklik = satır sayısı × 40 px. 110 px geniş. Yatay kaydırmada solda sabit kalır.

- **İçerik:** proje numarası. Ortalı, beyaz, **800 kalınlık**, Projects'te 18 px, Missing Extra'da
  14 px (case kodu daha uzun), hafif yazı gölgesi.
  - `P123` biçimindeyse baştaki `P` gösterilmez (`123`). Diğer numaralar olduğu gibi (`STNE 440`).
  - Missing Extra'da proje no yerine case kodu: `440-EX-2`.
- **Zemin rengi** (öncelik sırasıyla):
  1. **yeşil `#9FCF63`**: projenin bütün satırları SENT
  2. **kırmızı `#E53E3E`**: proje Urgent işaretli ya da bir satırın konteyner tarihi 0–10 gün
     içinde
  3. **mavi `#6A99D1`**: bir satırın PO'su SIGNED ya da READY TO SIGN
  4. **turuncu `#DE8244`**: diğer durumlar
  Renk canlı hesaplanır: bir satır değişince hemen güncellenir.
- **"OLD DUPLICATE" rozeti:** numara `…_OLD_<zaman>` ile bitiyorsa numaranın altında küçük, koyu
  yarı saydam, beyaz bir rozet çıkar.
  - Üzerine gelince: "Renamed on {tarih} when this code was recreated".
  - Bu, aynı numaralı yeni bir proje açıldığında ya da Move Region ile aynı numaralı bir proje o
    bölgeye taşındığında eskisinin aldığı işarettir. Veriyi değiştirme, sadece göster.
- **Seçim kutusu (Half atama):** Projects ve Missing Extra'da sol üst köşede (6 px içeride) 16 px
  bir onay kutusu.
  - Half araç çubuğundaki seçim içindir ("Select All", "Assign to First/Second Half").
  - Kutuya tıklamak menüyü açmaz, sadece seçer.
- **Sol tık:** hiçbir şey yapmaz (imleç yine de el işareti).
- **Sağ tık:** aşağıdaki **proje menüsünü** açar. Proje başlığına sağ tıklamak da aynı menüyü
  açar.
- Rol PROJECT # kolonunu göremiyorsa hücre gizlenir.

---

## Menü nasıl açılır

- **Proje numarası hücresine** ya da **proje başlığına** (koyu gri bant: proje adı + adres)
  **sağ tıklayınca** açılır. Tarayıcının kendi sağ tık menüsü açılmaz. Açıkken tekrar sağ
  tıklamak kapatır. Sol tık bir şey yapmaz.
- Nereye sağ tıklanırsa tıklansın menü **proje başlığının hemen altında, sol kenarına hizalı**
  açılır (4 px boşluk), yani proje numarası hücresinin üst kısmının üstünde. Beyaz kutu, ince gri
  çerçeve, 6 px köşe, gölgeli, en az 200 px geniş. Sayfa kaydırılsa da başlığa bağlı kalır.
- Kapanma: menü dışına tıklamak, **Esc**, ya da bir işlemin bitmesi.
- Kayıt sürerken menü yarı saydam olur ve tıklanmaz.
- Menü her açılışta temiz başlar: açık düzenleme alanı kalmaz, tip seçimleri projenin şu anki
  tipleri olur.

## Menü maddeleri (yukarıdan aşağı, aradaki çizgilerle)

```
📋 Belge Hazırla              (mavi)
──────────────
🔺 Make Urgent                (kırmızı)   ↔  🔽 Remove Urgent (yeşil)
🏷 Add to Group...            (sadece Projects sekmesi; hiç grup yoksa "Create Group")
──────────────
Edit Name
Edit Address
Edit Types
Move Region
──────────────
🗑 Delete Project             (kırmızı, üzerine gelince açık kırmızı zemin)
```

Sekmelere göre:
- **Projects:** hepsi.
- **Missing Extra / Direct Orders:** "Add to Group" yok, gerisi aynı. Missing Extra'da işlemler
  case üzerinde yapılır.
- Bütün maddeler rolün yetkisine bağlı. Proje düzenleme yetkisi olmayan rolde menü salt okunur
  olmalı ya da hiç açılmamalı.

---

## 1. Belge Hazırla

Projenin **fiyat listesi / belge** sayfasına gider: Trust System `/price-list?projectId={id}`.
- O sayfada proje için kalem kalem fiyat listesi hazırlanır: tip blokları, kategoriler, ürün
  kodu, açıklama, fotoğraf, satıcı, adet, tutar, genel toplam.
- Ayrıca imza / onay bölümü ("Signatures & Approvals"), PDF ve Dropbox klasör bilgisi var.
- **T-ERP'de bu sayfa henüz yoksa:** Trust System'de **yeni sekmede** aç:
  `https://trust-excel.vercel.app/price-list?projectId={projectId}`. Sayfayı şimdi taşıma.

## 2. Make Urgent / Remove Urgent

- Proje acil değilse **"Make Urgent"** (kırmızı yazı, 🔺), acilse **"Remove Urgent"** (yeşil
  yazı, 🔽).
- Tıklayınca menü kapanır, `PATCH /projects/{id}` gövde `{ "isUrgent": true | false }`.
  - Missing Extra'da: `PATCH /missing-extra/cases/{id}`
  - Direct Orders'ta: `PATCH /direct-orders/{id}`
- Ekranı hemen (iyimser) güncelle. Hata olursa geri al ve "Failed to update urgent status."
  göster.
- **Etkisi:** proje numarası hücresi **kırmızı** (`#E53E3E`) olur. Projenin bütün satırları SENT
  ise yeşil yine önceliklidir. Remove Urgent'te renk normal kurala döner:
  - konteyner tarihi 10 gün içindeyse kırmızı
  - PO imzalıysa mavi
  - değilse turuncu

## 3. Add to Group… (PF grupları, sadece Projects)

PF grupları, projelerin **tiplerini** (proje + tip çifti) numaralı gruplara ve sıralara (rank)
koyar. Örneğin "Group 3 içinde rank 1: 440 Millwork, rank 2: 478 Shelving". Filtre çubuğundaki
"Groups" görünümü tabloyu bu gruplara göre dizer. Tip hücresinde rank rozeti görünür.

Menü maddesi: hiç grup yoksa **"Create Group"**, varsa **"Add to Group..."**. Tıklayınca menü
kapanır, **pencere** açılır:

- **Başlık:** "Add to Group", altında proje adı. Kırmızı tonlu başlık. Sağ üstte ×.
- **Type:** projenin tipleri (açılır liste). Bu oturumda eklenmiş olanların yanında
  "(already added)". Projenin hiç satırı yoksa: "This project has no items yet."
- **Group:** "+ Create New Group" ya da mevcut gruplar ("Group 1", "Group 2", …).
- **Rank** (sadece mevcut grup seçiliyse): o gruptaki mevcut sıralar ("Rank 1", "Rank 2", …) ve
  "**+ New rank (n)**" (en büyük sıra + 1).
- Seçilen tip o grupta zaten varsa: "This type is already in that group." ve **Add** pasif.
- **Add** (işlem sürerken "Adding…"):
  - "+ Create New Group" seçiliyse: `POST /pf-groups { projectId, type: "MILLWORK" }`. Sunucu
    sıradaki numarayla yeni grup açar, tip rank 1 olur. **Pencere açık kalır** ve hedef bu yeni
    grup olur. Sonraki eklemeler aynı gruba gider.
  - Mevcut grup seçiliyse: `POST /pf-groups/{groupId}/members { projectId, type, rank }`.
  - Ekleme sonrası kısa bir "eklendi" vurgusu gösterilir. Tip listesi **gruba henüz eklenmemiş
    bir sonraki tipe** geçer.
  - Hata olursa pencerede kırmızı mesaj.
- **Pencere sadece × ile ya da arka plana tıklayarak kapanır.** Böylece art arda birden çok tip
  eklenebilir. Arka plana basılı tutup içeride bırakmak kapatmaz.
- Gruplar canlı güncellenir: başka biri değiştirince liste yenilenir.
- Diğer grup işlemleri filtre çubuğundaki "Groups" yönetim penceresinde:
  - sırayı değiştir: `PATCH /pf-groups/members/{memberId}/reorder { direction }`
  - üyeyi çıkar: `DELETE /pf-groups/members/{memberId}`
  - grubu sil: `DELETE /pf-groups/{groupId}`

## 4. Edit Name

- Tıklayınca madde, menünün içinde **yazı alanına** dönüşür. Mevcut ad dolu ve odakta gelir.
  Altında küçük gri: "Press Enter to save".
- **Enter**: `PATCH /projects/{id} { "name": "…" }`. Başarılıysa menü kapanır, proje başlığı yeni
  adla güncellenir. **Esc**: düzenlemeden çıkar.
- Missing Extra'da case adı, Direct Orders'ta DO adı.

## 5. Edit Address

- Edit Name ile aynı: yazı alanı, "Press Enter to save", Enter kaydeder, Esc iptal.
- `PATCH /projects/{id} { "address": "…" }`. Başlıktaki adres satırı güncellenir.

## 6. Edit Types

Projenin hangi tipleri olduğunu değiştirir. Tablodaki tip grupları buna göre eklenir / kalkar.

**İçerik (menünün içinde açılır):**
- Başlık: "Select project types:"
- Onay kutuları:
  - standart tipler: **Millwork, Shelving, Ceiling, Image, Furniture, Decoration**
  - projede olan özel tipler (yanında küçük "(custom)")
  - projede olanlar işaretli gelir
- **Yeni özel tip:**
  - alan "New custom type" + **Add** butonu (Enter da çalışır)
  - Add, `POST /custom-types { name, code, isGlobal: true }` gönderir; `code` adın harf ve
    rakamlarından, büyük harf, en fazla 10 karakter
  - Bu ad zaten varsa sunucu mevcut tipi döndürür; onun yazımı kullanılır
  - Eklenen tip listede **işaretli** görünür
  - Hatalar: "Name needs at least one letter or digit", "This type already exists"
- **Save Types** butonu (mavi; kaydederken "Saving...").

**Save Types ne yapar** (sırayla):
1. **Çıkarılan tiplerin bütün satırları silinir:** her biri için
   `DELETE /projects/{projectId}/items/{itemId}`. Satırlar çöp kutusuna gider, geri alınabilir.
   Bunlar PF kodu, satıcı, tarih, fiyat taşıyan gerçek satırlar olabilir.
2. **Eklenen her tip için bir boş satır açılır:**
   - standart tip: `POST /projects/{projectId}/items { type: "SHELVING" }`
   - özel tip: `{ customTypeId }`
   - yeni satır satıcısız, PF kodsuz, PO/PF = NOT SIGNED, Status = NOT ORDERED
3. Tablo yeni tiplerle güncellenir, menü kapanır.

**T-ERP'de ek güvenlik:** Trust System burada onay sormuyor. T-ERP'de, çıkarılan tiplerden
**satırı olan** varsa Save'den önce sor. Örnek metin: "Millwork tipinin 3 satırı silinecek
(çöp kutusuna gider). Devam?"

Missing Extra'da satır uçları: silme `DELETE /missing-extra/items/{itemId}`, ekleme
`POST /missing-extra/cases/{caseId}/items`. Direct Orders'ta:
`DELETE|POST /direct-orders/{projectId}/items…`.

## 7. Move Region

- Tıklayınca menünün içinde başlık "Move project to another region:" ve **projenin şu anki
  bölgesi dışındaki** bölgeler buton olarak listelenir:
  **TLines NE, TLines SE, TLines NW, TLines CVW, TLines HQ, TLines TC**
  (API değerleri `TLINES_NE, TLINES_SE, TLINES_NW, CVW, TLINES_HQ, TLINES_TC`).
- Bölgeye tıklayınca: `PATCH /projects/{id}/move-region { "bucket": "TLINES_SE" }`.
  - Missing Extra: `PATCH /missing-extra/cases/{id}/move-region`
  - Direct Orders: `PATCH /direct-orders/{id}/move-region`
- Başarılıysa menü kapanır, proje **yeni bölgenin altına taşınır**. Listeyi yenile ya da projeyi
  yeni bölüme taşı.
- **Sunucu kuralı (Projects):** hedef bölgede **aynı proje numarasında** başka bir proje varsa,
  o eski projenin numarasının sonuna `_OLD_<zaman>` eklenir; taşınan proje numarasını korur.
  Aynı bölgeye taşımak hata verir ("Project is already in this region").
- Hata olursa mesajı göster. Trust System'de "Failed to update project bucket. Please try again."

## 8. Delete Project

- Kırmızı madde. Tıklayınca **onay** sorulur. Projenin adı geçmeli. Örnek: "Are you sure you want
  to delete the project? "{ad}"".
- Onaylanırsa: `DELETE /projects/{id}` (Missing Extra: `DELETE /missing-extra/cases/{id}`, Direct
  Orders: `DELETE /direct-orders/{id}`). Menü kapanır, proje tablodan kalkar.
- **Proje kalıcı silinmez, çöp kutusuna gider** (Trash Bin, oradan geri alınabilir). Trust
  System'in onay metni "permanently deleted" diyor ama bu doğru değil. T-ERP'de doğru yaz:
  "Çöp kutusuna taşınacak, oradan geri alınabilir."

---

## Ortak kurallar

- Her işlemden sonra **sunucunun cevabını** ekrana uygula. Başka kullanıcıların ekranı canlı
  güncellemeyle yenilenir.
- Aynı anda iki kez tıklanmasın: işlem sürerken menüyü kilitle.
- Hata mesajı sunucu cevabının `message` alanında.
- **Canlı veri:** bu işlemleri sadece adı **"TEST"** olan bir projede dene. Özellikle Edit Types
  (satır siler), Move Region ve Delete Project gerçek projelerde denenmez.

## Kontrol listesi

- [ ] Proje no hücresi proje boyunca tek; renk kuralı doğru; `P` öneki gizli; Missing Extra'da
      case kodu; OLD DUPLICATE rozeti; Half seçim kutusu menüyü açmadan seçiyor
- [ ] Proje no hücresine ve proje başlığına sağ tıklayınca menü başlığın altında açılıyor; sol tık
      bir şey yapmıyor; Esc, dışarı tıklama ve tekrar sağ tık kapatıyor
- [ ] Belge Hazırla doğru projeyle fiyat listesi sayfasını açıyor (T-ERP'de yoksa Trust System,
      yeni sekme)
- [ ] Make / Remove Urgent: proje no kırmızı oluyor / normale dönüyor; yazı ve renk değişiyor
- [ ] Add to Group: Type / Group / Rank, "+ Create New Group", "+ New rank", "already in that
      group", pencere ekledikten sonra açık kalıyor ve sıradaki tipe geçiyor
- [ ] Edit Name / Edit Address: Enter kaydediyor, Esc iptal, başlık güncelleniyor
- [ ] Edit Types: işaretli tipler, (custom) etiketi, yeni özel tip ekleme, Save Types → çıkarılan
      tipin satırları çöp kutusuna (T-ERP'de onaylı), eklenen tipe boş satır
- [ ] Move Region: mevcut bölge listede yok, taşıyınca proje yeni bölgenin altında
- [ ] Delete Project: onaylı, "çöp kutusuna" yazıyor, proje kalkıyor ve Trash Bin'de görünüyor
- [ ] Missing Extra ve Direct Orders'ta doğru endpoint'ler; Projects dışında "Add to Group" yok
