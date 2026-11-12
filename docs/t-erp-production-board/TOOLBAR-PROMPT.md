# Komut: Production Board üst çubuğu: arama, filtreler, ToDo, Follow Up, imza çipleri, Groups, Half

> Bu metni T-ERP'deki Claude'a olduğu gibi ver. Kendi başına yeterli.
> **Görünüm T-ERP'nin tasarım sistemiyle** (buton, çip, açılır menü, modal, sekme, input). Renk ve
> metinleri aşağıdaki gibi kullan ama bileşenler T-ERP'nin olsun. **Davranış Trust System'deki
> ile birebir aynı.**
> Veri ve kurallar Trust System sunucusunda; bütün istekler T-ERP'nin `/api/trust/*` proxy'si
> üzerinden (ör. `GET /api/trust/today-pf`).

---

## 0. Yerleşim

```
[Projects] [Missing & Extra] [Direct Order]                                 ← sekmeler
Projects                                      [Proje ara...] [Export Excel] [+ Add Project]
⚲ Filters | Vendor ▾ | Type ▾ | Status ▾ | Container ▾ | Half ▾ | ✎ Edit | ToDo (6) | Receive Follow Up |
           PO Waiting TLines | PO Waiting T | PF Waiting T | To Order | Books in Progress | Groups (2)
           ……………………………………………………… [Clear all]  3 active filters
[seçili filtre çipleri: YSM ×  Millwork ×  ORDERED ×  2026 First Half ×  ToDo × …]
☐ Select All (54) | 0 selected | Year [2026] | Assign to First Half | Assign to Second Half | Clear Half
```

- Filtre çubuğu sayfa kaydırılırken **üstte yapışık** kalır.
- **Hangi sekmede ne var:**

| Öğe | Projects | Missing & Extra | Direct Order |
|---|---|---|---|
| Vendor / Type / Status / Container | ✓ | ✓ | ✓ |
| Half filtresi ve Half araç çubuğu | ✓ | ✓ | ✓ (kendi toplu endpoint'iyle) |
| Edit, ToDo, Receive Follow Up, Groups | ✓ | — | — |
| İmza / durum hızlı çipleri | ✓ | ✓ | ✓ |

- **Bütün filtreler birlikte (VE) çalışır:**
  - Aynı filtrenin içinde seçilenler "herhangi biri" (VEYA) olarak çalışır.
  - Filtreler **satır bazlı** çalışır: eşleşen satırlar kalır.
  - Hiç satırı kalmayan proje gizlenir. Half filtresi proje bazlıdır.
- Filtreler **kaydedilmez**: sayfa yenilenince sıfırlanır. (T-ERP'de URL'de tutmak isterseniz
  serbest.)

---

## 1. Arama ("Proje ara...")

- Sadece **proje numarasında** arar, büyük/küçük harf önemsiz.
- Sonuç sırası: **tam eşleşen** → numarası **onunla başlayan** → numarasının **içinde geçen**.
- Diğer filtrelerle birlikte çalışır. Bölgeler korunur, sadece bölge içindeki projeler süzülür ve
  sıralanır.

## 2. Export Excel

- **Projects sekmesinde:** tek Excel dosyası, **4 sayfa**:
  1. **Projects**: sayfadaki projeler, aynı kolon sırası ve aynı durum renkleriyle
  2. **Missing & Extra**: güncel veri çekilir
  3. **Direct Orders**: güncel veri çekilir
  4. **Project Total**
  - Dosya adı `Operational_Board_YYYY-MM-DD.xlsx`.
  - Rolün göremediği kolonlar Excel'e girmez.
- **Missing & Extra sekmesinde:** tek sayfa, `Missing_Extra_YYYY-MM-DD.xlsx`.
- **Direct Order sekmesinde:** kendi tablosunun tek sayfalık Excel'i.
- Kaynak: `utils/excel/exportProjectsAllTabsExcel.ts`, `utils/excel/exportProjectsExcel.ts`.

## 3. + Add Project (Missing & Extra'da "+ Create Missing/Extra")

Sağdan açılan form:
- **Region:** TLines NE / SE / NW / CVW / HQ / TC
- **Project number**, zorunlu ("Project number is required")
- **Project name**, zorunlu ("Project name is required"; ör. "Office Complex Renovation")
- **Address** (ör. "1234 Business Drive, City, State")
- **Types:** Millwork, Shelving, Ceiling, Image, Furniture, Decoration onay kutuları ve
  "Add custom type..." alanı
- **Dropbox klasör bilgisi** (isteğe bağlı):
  - Section (T Lines NE/SE/NW/CVW Projects)
  - Region
  - Status (Under Working / Done)
  - Client Type (Clients / Individuals)
  - Client Name
- **Create Project** (gönderirken "Creating..."):
  - `POST /projects { projectNo, name, address, bucket, types: ["MILLWORK", …], dropbox… }`
  - Sunucu her seçilen tip için **bir boş satır** açar.

---

## 4. Açılır filtreler: Vendor, Type, Status, Container, Half

Hepsi aynı bileşen:
- buton (seçili sayısı rozetle)
- açılan liste:
  - üstte arama ("Search vendor...", "Search type...", …)
  - altında onay kutulu seçenekler
  - en altta **"Clear all (n)"**

| Filtre | Seçenekler | Neyle eşleşir |
|---|---|---|
| **Vendor** | `GET /vendors` → "KOD - Ad" | satırın satıcısı |
| **Type** | Millwork, Shelving, Ceiling, Image, Furniture, Decoration | satırın tipi |
| **Status** | HOLD / T, HOLD / PM, HOLD BOOKS, NOT ORDERED, TO ORDER, BOOKS IN PROGRESS, ORDERED, WAITING PAYMENT, ASSEMBLY, READY TO RECEIVE, RECEIVED, READY, SENT TO TLINES, PARTIAL SENT, SENT | satırın Status'u |
| **Container** | tablodaki konteyner adları, büyük/küçük harf birleştirilmiş; "Container N" olanlar sayıya göre sıralı | satırın konteyner adı (birebir, harf duyarsız) |
| **Half** | verideki değerler: "2026 First Half", "2026 Second Half", …, "Unassigned" | projenin yarıyıl ataması (**proje bazlı**) |

**Seçili filtre çipleri:** filtre varken çubuğun altında bir sıra çip çıkar. Her seçili değer
için bir çip ve ×:
- satıcı kodu, tip, durum, konteyner, yarıyıl
- ToDo, Receive Follow Up
- imza çipleri, Groups

Sağda **"Clear all"** ve **"{n} active filters"**. Clear all **hepsini** sıfırlar: ToDo, Follow
Up, imza çipleri ve Groups dahil.

---

## 5. ✎ Edit

Küçük bir menü açar:
- **"Today's PFs & Follow Up"**: ToDo yönetim penceresi (bölüm 6). Sadece rolün
  **`todays_pf_manage`** sayfa izni varsa görünür.
- **"Groups"**: Manage Groups penceresi (bölüm 8). Herkese açık.

---

## 6. ToDo ve Receive Follow Up

İki ayrı **işaretleme listesi**. Ekip "bugün bitirilecek PF'leri" ve "teslimatı takip edilen
PF'leri" işaretler, tabloyu bunlara göre süzer.

Veri:
- `GET /today-pf` → işaretler
- `POST /today-pf` → ekle
- `DELETE /today-pf/{id}` → kaldır
- değişince canlı olay: `today-pf:updated` (bütün ekranlar listeyi yeniden çeker)

İşaret nesnesi:
```
{ id, kind: "PF" | "FOLLOWUP", projectId, projectNo, projectName, bucket,
  type, customTypeId, typeLabel, itemId, pfCode, vendorName, itemStatus,
  totalItems, filledItems, completedAt }
```

### 6.1 Çipler (filtre)
- **ToDo** (turuncu; aktifken zemin `#fff7ed`, çerçeve `#fed7aa`, yazı `#c2410c`):
  - Rozet: `kind: "PF"` işaret sayısı.
  - Açıkken tabloda sadece **işaretli proje + tip** satırları görünür. Bir tip işaretliyse o
    projenin o tipteki **bütün satırları** görünür.
- **Receive Follow Up** (yeşil; aktifken `#f0fdf4` / `#bbf7d0` / `#15803d`):
  - Rozet: `kind: "FOLLOWUP"` sayısı.
  - Açıkken sadece **işaretli tek tek PF satırları** (`itemId`) görünür.
- İkisi birlikte açıksa ikisinin birleşimi görünür.
- Tamamlanmış (done) işaretler de listede kalır ve filtreye dahildir; kaldırılana kadar durur.

### 6.2 Yönetim penceresi (Edit → "Today's PFs & Follow Up")
- **Pencere:** ortada, ~520 px.
  - Başlık "ToDo" (turuncu degrade, yıldız ikonu) ya da Follow Up sekmesindeyken yeşil degrade.
  - Sağ üstte ×.
  - Arka plana tıklayınca kapanır.
- **Sekmeler:**
  - **"PFs to complete" (n)**: turuncu `#ea580c`
  - **"Receive follow up" (n)**: yeşil `#16a34a`
  - Sayılar o türdeki işaret sayısı.
- **"CURRENTLY FLAGGED (n)" listesi**, en yeni üstte. Her işaret bir kart:
  - Sol kenarda 3 px şerit: turuncu / yeşil, tamamlandıysa yeşil.
  - Tamamlandıysa açık yeşil zemin ve **"✓ done"**.
  - **PFs to complete** kartı:
    - `311 — Image ✓ done`
    - altında **ilerleme çubuğu** ve `dolu / toplam` (ör. 8/9)
    - ilerleme = o projenin o tipindeki satırlardan **kaçının PF kodu var**
    - çubuk rengi: hepsi doluysa yeşil `#16a34a`, kısmen doluysa turuncu `#d97706`, hiç
      yoksa gri
  - **Receive follow up** kartı:
    - proje no, tip etiketi, PF kodu ("no PF code yet")
    - satıcı adı, satırın durumu
  - Sağda **×** (Remove): `DELETE /today-pf/{id}`.
  - Boşsa: "No PFs flagged yet." / "Nothing being followed up yet."
- **"ADD NEW"** bölümü:
  - **Proje seç:** "Search project by number or name..." alanı. Yazdıkça
    `{projectNo} — {ad}` listesi açılır.
  - **PFs to complete sekmesinde:**
    - Seçilen projenin **tipleri** listelenir. Her tipte `dolu/toplam` PF kodu ilerlemesi
      görünür.
    - Tıklanan tip işaretlenir: `POST /today-pf { projectId, type: "IMAGE" }`; özel tipte
      `{ projectId, customTypeId }`.
    - Zaten işaretli tip pasif görünür.
  - **Receive follow up sekmesinde:**
    - Seçilen projenin **tek tek PF'leri** listelenir: tip etiketi, PF kodu, satıcı, durum
      rozeti (sipariş verilmişse yeşil, verilmemişse sarı).
    - **Sadece ORDERED PF'ler eklenebilir**; diğerleri gri. Üstte not: "Only ORDERED PFs can be
      followed up — the others are greyed out".
    - Tıklanan PF: `POST /today-pf { projectId, kind: "FOLLOWUP", itemId }`.
    - Sunucu ORDERED olmayanı reddeder: "Only ORDERED PFs can be added to Follow Up".
  - Aynı şey tekrar eklenirse sunucu yeni kayıt açmaz, mevcut işareti yeniden aktif eder.
- **Otomatik tamamlanma (sunucu):** PFs to complete işareti, o tipin **bütün satırlarının PF kodu
  dolunca** kendiliğinden `completedAt` alır ve kart "✓ done" olur. Satırların PF kodu, PF SIGN
  STATUS WAITING T TO SIGN'a çıkınca gelir. Follow Up işaretleri elle kaldırılana kadar durur.
- Silinen projenin ya da silinen PF'in işaretleri listeden düşer.

---

## 7. İmza ve durum hızlı çipleri

Tek tıkla açılıp kapanan çipler. Birden çoğu açıksa **herhangi birine** uyan satırlar görünür
(VEYA). Diğer filtrelerle VE.

| Çip | Satır şartı | Aktif renk (zemin / çerçeve / yazı) |
|---|---|---|
| **PO Waiting TLines** | PO SIGN STATUS = WAITING TLINES TO SIGN | `#fff7ed` / `#fdba74` / `#c2410c` |
| **PO Waiting T** | PO SIGN STATUS = WAITING T TO SIGN | `#f5f3ff` / `#c4b5fd` / `#6d28d9` |
| **PF Waiting T** | PF SIGN STATUS = WAITING T TO SIGN | `#f5f3ff` / `#c4b5fd` / `#6d28d9` |
| **To Order** | STATUS = TO ORDER | `#fff1f2` / `#fda4af` / `#be123c` |
| **Books in Progress** | STATUS = BOOKS IN PROGRESS | `#f0f9ff` / `#7dd3fc` / `#0369a1` |

- Tooltip'ler: "PO status: WAITING TLINES TO SIGN", "Status: TO ORDER" gibi.
- **Canlı:** biri tabloda durumu değiştirince filtre **yenilemeden** güncellenir. Satır şarta
  girer ya da çıkar.

---

## 8. Groups (PF grupları)

PF grupları, projelerin **tiplerini** (proje + tip) numaralı gruplarda (**Group 1, Group 2…**) ve
grup içinde **sıralarda (rank / tier)** tutar.
- Örnek: "Group 1 → rank 1: 409 Millwork, 409 Shelving; rank 2: 478 Ceiling".
- Aynı rank'ta birden çok tip olabilir.
- Gruba ekleme **proje numarasına sağ tık → Add to Group…** ile yapılır, bu çubuktan değil.

Veri:
- `GET /pf-groups` → `[{ id, number, members: [{ id, projectId, projectNo, type, customTypeId,
  typeLabel, rank }] }]`
- canlı olayla yenilenir

### 8.1 Groups çipi (görünüm)
- **"Groups (n)"**: n = grup sayısı. Aktif renk `#fef2f2` / `#fecaca` / `#b91c1c`. Tooltip:
  "Show the grouped-view table".
- Açıkken tablo **bölgelere göre değil gruplara göre** dizilir:
  - Her grup için büyük bant: kırmızı degrade, beyaz, 22 px kalın, **"Group {n}"**.
  - Altında gruptaki projeler **rank sırasıyla**.
  - Bir proje bir grupta **bir kez** görünür ve sadece o gruba eklenmiş tiplerinin satırlarını
    gösterir.
  - Tablo aynı tablo, bütün düzenleme çalışır.
  - Tip hücresinde rank rozeti (küçük kırmızı) var.
  - Hiç grup yoksa: "No groups yet. Right-click a project number to create one."
  - Satırı olmayan tipler görünmez.

### 8.2 Manage Groups penceresi (Edit → Groups)
- **Başlık:** "Manage Groups" (kırmızı degrade, ızgara ikonu), ×.
- Her grup bir kart:
  - kırmızı başlık "Group {n}" ve sağda **"🗑 Delete group"**
  - kartın içinde **rank kutuları**: soldaki büyük sayı rank numarası
  - rank içinde, proje proje gruplanmış kutular: üstte proje no (ör. "409"), altında o projenin
    o rank'taki tipleri
  - proje no tekrar yazılmaz; her tipin kendi rank etiketi ve düğmeleri vardır
- **Her tipin yanında:**
  - **▲**: bir üst tier'a geçer, oradakilere katılır ("Move up a tier (joins whatever is already
    there)"). En üstteyse pasif.
    `PATCH /pf-groups/members/{memberId}/reorder { "direction": "up" }`
  - **▼**: bir alt tier'a geçer; zaten en alttaysa **yeni bir tier açar** ("Move down a tier
    (joins the next one, or starts a new one)"). `{ "direction": "down" }`
  - **×**: gruptan çıkarır ("Remove from group"). `DELETE /pf-groups/members/{memberId}`
- **Sunucu kuralları:**
  - tier numaraları her değişiklikten sonra **boşluksuz** yeniden numaralanır (1, 2, 3…)
  - grubun son üyesi çıkarılınca **grup da silinir**
  - grup numaraları silinince yeniden dağıtılmaz
- **Delete group:** bütün grubu siler, `DELETE /pf-groups/{groupId}`. Trust System onay
  sormuyor; **T-ERP'de onay sor**. Bu sadece gruplamayı siler; projelere ve satırlara dokunmaz.
- Altta not: "To add a new group or a new member, right-click a project number in the Projects
  grid."

---

## 9. Half (yarıyıl) araç çubuğu

Projeleri yılın **ilk ya da ikinci yarısına** atamak için. Half filtresi buna göre süzer.

- Her proje no hücresinin sol üstünde bir **seçim kutusu** var. Kutu menü açmaz, sadece seçer.
- Çubuk:
  - **"☐ Select All (n)"**: n = filtrelerden sonra **görünen** proje sayısı. İşaretlenince
    görünenlerin hepsi seçilir, tekrar tıklanınca seçim kalkar.
  - **"{k} selected"**
  - **Year**: sayı alanı, bu yıl varsayılan
  - **"Assign to First Half"** (mavi) / **"Assign to Second Half"** (yeşil): seçili
    projelere yazar
  - **"Clear Half"** (kırmızı): seçili projelerin atamasını kaldırır
  - Seçim yoksa üç buton da **pasif**
- **İstek:**
  - Projects: `PATCH /projects/bulk/half { projectIds, halfOfYear: "FIRST_HALF" | "SECOND_HALF" | null, halfYear: 2026 | null }`
  - Missing & Extra: `PATCH /missing-extra/cases/bulk/half` (gövdede `caseIds`)
  - Direct Order: `PATCH /direct-orders/bulk/half`
  - Clear Half'te ikisi de `null`.
- Başarılıysa **seçim temizlenir ve tablo yeniden yüklenir**. Kendi değişikliğin canlı olayla
  sana geri gelmez, bu yüzden elle yenile.
- Hata olursa çubukta kırmızı mesaj: "Failed to assign half".
- Half filtresi: projenin `halfYear` + `halfOfYear` değerine göre ("2026 First Half"); atanmamış
  projeler "Unassigned".

---

## 10. Veri güvenliği

Canlı veri. Filtreler, arama ve Groups görünümü sadece okur. Yazan işlemler:
- ToDo / Follow Up ekle / kaldır
- grup ▲▼×, Delete group
- Half ata / temizle
- Add Project

Bunları sadece adı **"TEST"** olan bir projede dene. Gerçek gruplarda, işaretlerde ve
yarıyıllarda deneme yapma. Toplu Half atamasını gerçek projelerde deneme.

## Kontrol listesi

- [ ] Arama: tam eşleşen önce, sonra "ile başlayan", sonra "içeren"
- [ ] Export Excel: Projects'te 4 sayfalı dosya, gizli kolonlar yok
- [ ] Vendor / Type / Status / Container / Half: arama, çoklu seçim, "Clear all (n)", çipler,
      "Clear all", "n active filters"; satır bazlı; projeler boşalınca gizleniyor
- [ ] Edit menüsü: "Today's PFs & Follow Up" sadece `todays_pf_manage` iznine, Groups herkese
- [ ] ToDo çipi işaretli proje+tip satırlarını, Follow Up çipi işaretli PF'leri gösteriyor;
      rozet sayıları doğru
- [ ] ToDo penceresi:
  - [ ] iki sekme, kartlar, ilerleme çubuğu ve renkleri, "✓ done", × kaldırma
  - [ ] proje arama ve tip ekleme
  - [ ] Follow Up'ta sadece ORDERED eklenebiliyor
- [ ] Bir tipin bütün PF kodları dolunca kart kendiliğinden "✓ done"
- [ ] Beş hızlı çip doğru şartlarla, kendi aralarında VEYA; durum değişince anında güncelleniyor
- [ ] Groups çipi: grup bantları, rank sırası, proje bir kez, sadece gruptaki tipler
- [ ] Manage Groups: ▲ ▼ × ve tier kuralları, son üye çıkınca grup siliniyor, Delete group onaylı
- [ ] Half: Select All görünenleri seçiyor, Year, First / Second / Clear, seçim yoksa pasif,
      sonrasında tablo yenileniyor; Half filtresi "2026 First Half" / "Unassigned"
