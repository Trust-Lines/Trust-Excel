# Komut: PF kodu kuralları ve T-ERP'de "PF kodu gelmiyor" sorununun çözümü

> Bu metni T-ERP'deki Claude'a olduğu gibi ver. Kendi başına yeterli.
> Bağlantı: T-ERP'nin `/api/trust/*` proxy'si → Trust System API (bkz. `T-ERP-INTEGRATION.md`).

---

## 0. En önemli kural: PF kodunu T-ERP üretmez

PF kodunu **Trust System sunucusu** üretir, değiştirir, siler. T-ERP'nin işi:
1. Satırda bir alan değişince sunucuya **doğru alanı** göndermek.
2. Sunucunun **cevabındaki satırı** (içindeki `pfCode` dahil) ekrana uygulamak.

T-ERP'de PF kodu hesaplayan, tahmin eden ya da elle yazdıran **hiçbir kod olmamalı**. Varsa
kaldır. Sunucu, Projects ve Missing Extra'da istemciden gelen `pfCode`'u zaten yok sayar.

---

## 1. Kod biçimi

| Sekme | Biçim | Örnek |
|---|---|---|
| Projects | `{SATICI KODU}-{PROJE NO}-{HARF}{SIRA}` | `GLA-478-M01` |
| Missing Extra | `{SATICI KODU}-{CASE KODU}-{HARF}{SIRA}` | `YSM-440-EX-2-M01` |
| Direct Orders | `{SATICI KODU}-PDO{numara}-{HARF}{SIRA}` | `DO-008` → `YSM-PDO008-M01` |

- **Harf:** Millwork **M**, Shelving **S**, Ceiling **C**, Image **I**, Furniture **F**,
  Decoration **D**. Özel tipte, tipin kendi kısa kodu (`customType.code`).
- **Sıra:** iki haneli (01, 02, …).

---

## 2. Kod NE ZAMAN var (Projects): ekrandaki boş PF'lerin asıl sebebi

Projects'te bir satırın PF kodu olması için **iki şart birden** gerekir:
1. Satırın **satıcısı** var (`vendorId` dolu).
2. Satırın **PF SIGN STATUS**'u şunlardan biri: **WAITING T TO SIGN, WAITING TLINES TO SIGN,
   SIGNED, SIGNED WITH EST PRICE**.

PF SIGN STATUS **NOT SIGNED** ya da **READY TO SIGN** ise **PF kodu yoktur, boştur.**
- **Sadece satıcı seçmek kod vermez.**
- Kod, PF SIGN STATUS "WAITING T TO SIGN" (ya da üstü) yapıldığı anda gelir.
- Bu bir hata değil, iş kuralı. Örneğin STNE 440 Millwork / TR-STOCK satırının kodu boşsa ve PF
  durumu NOT SIGNED ise doğru davranış budur.

**Missing Extra ve Direct Orders'ta bu şart yok:** satıcı atanınca kod verilir.

### Kod ne zaman verilir / yeniden hesaplanır (Projects)
İki şart sağlanıyorsa, satırda şunlardan biri olunca sunucu kodu verir ya da yeniden hesaplar:
- satıcı ilk kez atandı ya da değişti
- tip değişti
- PF SIGN STATUS "kod verilir" seviyesine çıktı
- order type değişti ve kod buna bağlı (kural 4A / 4B)
- satırın kodu hiç yoktu: bir sonraki herhangi bir düzenlemede kendiliğinden verilir

### Kod ne zaman silinir
- satıcı kaldırılırsa (`vendorId: null`)
- PF SIGN STATUS NOT SIGNED / READY TO SIGN'a geri alınırsa
- satıcı değişti ama PF durumu henüz kod seviyesinde değilse

---

## 3. Sıra numarası

**Normal satıcılar:** aynı satıcı + proje + harf içindeki en büyük numara + 1.
- Çöp kutusundaki satırların numaraları da sayılır, yani silinen numara tekrar verilmez.
- Sunucu çakışmayı kontrol eder ve tekrar dener.

---

## 4. Order type'a bağlı iki kural

### 4A. Sabit Millwork kodlu satıcılar
Satıcı kaydında `fixedMillworkCodes: true` olanlar (ör. GOS, TDR, YSM; listeyi sabit yazma,
satıcı bilgisinden oku). Bu satıcıların **Millwork** satırlarında:

| Order type (harf dışı karakterler ve büyük/küçük harf önemsiz) | Kod |
|---|---|
| STANDARD / BASIC | **M01** |
| STANDARD / SELECTIVE | **M02** |
| CUSTOM / SELECTIVE (ya da SELECTIVE / CUSTOM) | **M03** |
| diğer her şey, boş order type dahil | **M04'ten başlayarak boştaki en küçük numara** |

- M01–M03 kullanılmasa bile ayrılmıştır.
- Aynı order type'taki satırlar **aynı kodu paylaşır**, ör. iki satır `YSM-440-M01`. Bilerek böyle.
- Order type değişince kod hemen değişir: BASIC → CUSTOM / SELECTIVE yapılınca M01 → M03.
- Burada çöp kutusundaki satırlar numara tutmaz; boşalan numara tekrar verilir.

### 4B. FURNITURE
Hangi satıcı olursa olsun, order type'ında **FURNITURE** geçen **Millwork** satırı **F** harfi
alır, ör. `KYA-409-F01`. Order type FURNITURE'a girince ya da çıkınca kod M ↔ F değişir.

Diğer satıcı ve tiplerde order type kodu etkilemez.

---

## 5. T-ERP'de "PF kodu gelmiyor": adım adım kontrol et

Sırayla bak. Çoğu zaman sebep ilk üç maddeden biridir.

1. **PF SIGN STATUS ne?** NOT SIGNED / READY TO SIGN ise kodun boş olması **doğru** (bölüm 2).
   PF durumunu WAITING T TO SIGN yap, kod gelmeli.
2. **Doğru alan mı gidiyor?** Satıcı değişince gövde **`{ "vendorId": "<satıcının id'si>" }`**
   olmalı.
   - `vendor`, `vendorName`, `"GLA - GLAMOROUS"` gibi metinler **çalışmaz**; sunucu bunları
     tanımaz ve kod üretmez.
   - Diğer alanlar ve değerleri:
     - `pfSignStatus` (`"WAITING_T_TO_SIGN"` gibi enum değeri, ekrandaki "WAITING T TO SIGN" değil)
     - `orderType` (metin)
     - `type` (`"MILLWORK"`)
3. **Cevap ekrana uygulanıyor mu?** `PATCH /api/trust/projects/items/{itemId}` cevabı güncel satırı
   döndürür: `pfCode`, `vendor: { id, code, name }`, tarihler, durumlar.
   - Bu nesneyle satırın **tamamını** güncelle.
   - Sadece gönderdiğin alanı güncellersen yeni `pfCode` ekranda görünmez.
   - Sayfa yenilenince geliyorsa sorun budur.
4. **İstek gerçekten Trust System'e gidiyor mu?** DevTools → Network:
   - istek `/api/trust/projects/items/...` adresine mi gidiyor?
   - cevap 200 mü?
   - cevapta `pfCode` dolu mu?
   T-ERP kendi veritabanına yazıyorsa ya da proxy'ye uğramıyorsa kod asla gelmez.
5. **Proxy gövdeyi bozuyor mu?** Proxy `Content-Type: application/json` başlığını ve gövdeyi
   olduğu gibi iletmeli.
6. **Hata mı dönüyor?** 400 / 403 cevabının `message` alanını ekranda göster. Örneğin rolün bu
   kolonu düzenleme yetkisi yoksa 403 döner. Hataları sessizce yutma.
7. **Missing Extra / Direct Orders'ta** doğru adres mi?
   - Missing Extra: `PATCH /missing-extra/items/{itemId}`
   - Direct Orders: `PATCH /direct-orders/{projectId}/items/{itemId}`
   - yeni satır: Projects `POST /projects/{projectId}/items`, Missing Extra
     `POST /missing-extra/cases/{caseId}/items`, Direct Orders `POST /direct-orders/{projectId}/items`
     (gövde `{ type }` ya da `{ customTypeId }`)
8. **PO değişikliğinde** tipteki bütün satırlara **sırayla** gönder (paralel değil). Aksi halde
   aynı anda numara isteyen satırlar çakışabilir.
9. **Canlı güncelleme:** başka bir ekrandan yapılan değişiklik `entity:patched` olayıyla gelir.
   Olaydaki `patch` nesnesini satıra uygula; içinde `pfCode` olabilir.

### Hızlı deneme (sadece adı "TEST" olan bir projede)
1. TEST projesinde bir Millwork satırı seç. `PATCH { "vendorId": "<KYA'nın id'si>" }` →
   cevapta `pfCode: null` (PF durumu NOT SIGNED). **Doğru.**
2. `PATCH { "pfSignStatus": "WAITING_T_TO_SIGN" }` → cevapta `pfCode: "KYA-<projeNo>-M01"`.
3. Sabit kodlu bir satıcıyla (ör. YSM): `PATCH { "orderType": "CUSTOM / SELECTIVE" }` →
   `...-M03`. `PATCH { "orderType": "FURNITURE" }` → `...-F01`.
4. `PATCH { "pfSignStatus": "NOT_SIGNED" }` → `pfCode: null`.
5. Her adımda ekrandaki PF CODE hücresi cevapla aynı olmalı. Bitince TEST projesini sil.

---

## 6. Ekranda PF CODE hücresi

- Sadece gösterir; **Projects ve Missing Extra'da tıklanmaz.**
- Direct Orders'ta sadece özel tip satırlarında elle yazılabilir.
- Boşsa boş göster: "-", "null", "Pending" gibi yer tutucular koyma.
- Satır sırası PF numarasına bağlı. Bir tipin içinde:
  1. YSM, sonra GOS
  2. diğer satıcılar blok halinde
  3. satıcısızlar en sonda
  4. satıcı içinde M01, M02… sırasıyla
  Yeni kod gelince satırın yeri değişebilir.

---

## 7. (İleride) Sunucu T-ERP'ye taşındığında

Bu bölüm **şimdi uygulanmayacak**. Backend taşınınca kuralların birebir aynısı yazılmalı.
Trust System'deki kaynak:
- `server/src/projects/services/pf-code-generation.service.ts` (biçim, sıra, çakışma kontrolü)
- `server/src/common/helpers/fixed-millwork-codes.ts` (M01–M03, M04+, FURNITURE → F)
- `server/src/projects/projects.service.ts`: `poAllowsPfCode` ve `updateProjectItem` içindeki
  "ne zaman yeniden hesaplanır" bloğu
- `server/src/missing-extra/missing-extra.service.ts`: `generatePfCodeForItem`
- `server/src/direct-orders/services/direct-order-pf-code-generation.service.ts`

O güne kadar tek doğru kaynak Trust System sunucusudur.

---

## Kontrol listesi

- [ ] T-ERP'de PF kodu üreten / tahmin eden kod yok
- [ ] Satıcı değişince `vendorId` (id) gönderiliyor
- [ ] Her PATCH / POST cevabı satırın tamamına uygulanıyor; `pfCode` cevaptan geliyor
- [ ] NOT SIGNED / READY TO SIGN'da kod boş; WAITING T TO SIGN'da doluyor; geri alınca siliniyor
- [ ] Sabit kodlu satıcıda order type'a göre M01 / M02 / M03 / M04+; FURNITURE'da F
- [ ] Missing Extra ve Direct Orders'ta satıcı atanınca kod geliyor
- [ ] Hatalar ekranda gösteriliyor, sessizce yutulmuyor
- [ ] Canlı güncellemede gelen `pfCode` hücreye yansıyor
