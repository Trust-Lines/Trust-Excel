# Komut: Trust System "Projects" sayfasını T-ERP'ye taşı

> Bu metni T-ERP projesinde çalışan Claude'a olduğu gibi ver. Yanına bu klasördeki iki dosyayı koy:
> - `projects-page-source.md`: Projects sayfasının tüm kodu (75 dosya, başta dizin var)
> - `../T-ERP-INTEGRATION.md`: API bağlantısı (proxy, uçlar, canlı güncelleme)

---

## Görev

Trust System'deki (https://trust-excel.vercel.app) **Projects** sayfasını T-ERP'de
(https://t-erp.vercel.app) bir sayfa olarak göster. Kullanıcılar orada da her şeyi
görebilsin ve düzenleyebilsin.

**Görünüm kuralı:**
- **Tablonun kendisi birebir aynı kalacak.** Excel görünümü, renkler, satır/hücre boyları,
  sütun sırası ve genişlikleri, durum renkleri, proje renkleri, tip grupları, ACCOUNTING
  sütunları, başlıklar, ayraçlar, fontun boyutu. **Hiçbir rengi ya da ölçüyü değiştirme.**
- **Sadece dış çerçeve T-ERP'nin tasarım sistemine girecek:** menü/sidebar, üst bar, sayfa
  başlığı, sayfanın kenar boşlukları, tablonun dışındaki sayfa düzeyindeki butonlar ve
  arka plan. Tablonun içine T-ERP'nin stil sistemini (Tailwind sınıfları, tema renkleri,
  bileşen kütüphanesi) sokma.

**Özellik kuralı: hiçbiri eksik olmayacak.** Kaynak koddaki her şey çalışmalı, örneğin:
- bölgeler (bucket), proje blokları, tip grupları, satır sıralaması
- satır içi düzenleme: satıcı / sipariş tipi / durum otomatik tamamlama, tarih alanları,
  container hücresi, ödeme kuralı, para alanları
- yeni proje (AddProjectDrawer), yeni satır, satıcı ekleme, sağ tık / proje menüsü,
  satır ve proje silme (çöp kutusuna)
- FilterBar ve filtreler, imza bekleyen filtreleri, PF grupları, Today PF
- Half assignment toolbar, geri al (undo)
- ACCOUNTING sütunları ve sütun yetkileri (useColumnPermissions)
- TR-STOCK satırlarında stok kullanımı (StockUsageModal) ve Stock Overview
- Excel dışa aktarma (exceljs + file-saver)
- canlı güncelleme (başka biri düzenleyince ekran kendiliğinden güncellenir)

---

## Kaynak

`projects-page-source.md` içinde her dosya `## FILE: <yol>` başlığıyla duruyor. Dosyanın
başındaki dizin, her dosyanın hangi satırda başladığını gösteriyor. Dosyayı parça parça oku.
Giriş noktası `pages/OperationalBoard.tsx`. En büyük ve en önemli bileşen
`components/ProjectBlock.tsx` (~210 KB). Global stiller `styles.css` içinde.

## Yapılış şekli

1. **Kodu yeniden yazma, taşı.** Dosyaları T-ERP'de tek bir klasöre koy, örneğin
   `src/modules/trust-projects/`. Dosya yollarını ve göreli importları aynen koru. Mantığı
   sadeleştirme, bileşenleri yeniden tasarlama, "iyileştirme" yapma. Değişiklikler sadece
   aşağıdaki uyarlama noktalarıyla sınırlı kalsın.

2. **Stilleri izole et.** `styles.css` global bir dosya. T-ERP'nin stillerini bozmaması ve
   onlardan etkilenmemesi için:
   - Sayfayı tek bir sarmalayıcı içinde render et, örneğin `<div className="trust-projects">`.
   - `styles.css` içindeki kuralları bu sınıfın altına al: CSS nesting, PostCSS
     `postcss-prefix-selector` ya da elle önek. `body`, `html`, `*` kurallarını
     `.trust-projects` kapsamına çevir.
   - T-ERP'nin global reset'i (örneğin Tailwind preflight) tablo görünümünü bozuyorsa,
     sarmalayıcı içinde etkisini kaldır.
   - Inline `style={{…}}` değerlerine dokunma, renkler çoğunlukla orada.
   - Font: Trust System'deki font ailesini ve boyutunu sarmalayıcı içinde aynen kullan.

3. **API katmanını değiştir** (bkz. `T-ERP-INTEGRATION.md`):
   - Önce oradaki proxy'yi kur: `/api/trust/*` → `https://trust-excel.vercel.app/api/*`.
     Proxy `X-API-Key`'i sunucu tarafında ekler ve **T-ERP girişinin arkasında olmalı**.
   - `lib/projects.ts`, `lib/trust-stock.ts` ve diğer `lib/*` dosyalarındaki
     `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'` tabanını `/api/trust` yap.
     `lib/trust-stock.ts` içindeki `uploadForm` dahil, tüm istekler bu proxy'ye gitsin.
   - `lib/auth.ts` → `apiFetch`: JWT, refresh token, `localStorage` token ve giriş
     yönlendirmesi T-ERP'de **gerekmez**, çünkü kimliği proxy ekliyor. `apiFetch`'i aynı
     imzayla, sadece `fetch` yapan ve `Content-Type: application/json` ekleyen bir sürümle
     değiştir. Proxy T-ERP ile aynı alan adında olduğundan T-ERP'nin oturum çerezi
     kendiliğinden gider; proxy oturumu orada kontrol eder.
   - `contexts/AuthContext.tsx`: kullanıcı bilgisini `GET /api/trust/auth/me` ile al. Bu,
     anahtarın bağlı olduğu Trust System kullanıcısını, rolünü, sayfa ve sütun yetkilerini
     döner. Login/logout ekranları ve oturum yenileme mantığı kullanılmayacak. Yetki
     hook'ları (`usePagePermissions`, `useColumnPermissions`) bu veriyle aynen çalışsın.
   - `contexts/SocketContext.tsx`: `GET /api/trust/realtime/config` ile çalışmaya devam eder.
   - `import.meta.env.DEV` gibi Vite'a özgü ifadeleri T-ERP'nin karşılığına çevir.
     Next.js'te `process.env.NODE_ENV !== 'production'`.

4. **Çatıya uyarla:**
   - T-ERP Next.js ise sayfa ve modül bileşenleri `'use client'` olmalı.
   - `react-router-dom` kullanan iki dosya var: `pages/OperationalBoard.tsx` ve
     `components/ProjectMenu.tsx`. `useNavigate`/`useLocation` çağrılarını T-ERP'nin
     router'ına çevir. Trust System'in başka sayfalarına giden linkler, örneğin Supplier Total
     ya da Reports, henüz T-ERP'de yoksa `https://trust-excel.vercel.app/...` adresine yeni
     sekmede açılsın.
   - Gerekli paketleri kur: `exceljs`, `file-saver`, `@supabase/supabase-js`, `lodash`,
     `lucide-react`, `uuid`. Sürümler `projects-page-source.md`'nin başında yazıyor.

5. **İş kurallarını T-ERP'de yeniden yazma.** PF kodu üretimi, sabit M01–M03 kodları,
   FURNITURE → F kodları, durum-tarih otomasyonu, stok düşme ve toplamlar sunucuda yapılıyor.
   T-ERP değişikliği gönderir, sunucunun döndürdüğünü gösterir. Kaynak kod zaten böyle
   çalışıyor; bu davranışı koru.

---

## ⚠️ Veri güvenliği: çok önemli

T-ERP **canlı Trust System verisine** bağlanıyor. Test veritabanı yok; T-ERP'de yapılan her
değişiklik gerçek veride olur.
- Geliştirme sırasında sadece okuma ile ilerle. Yazmayı denemek için **adı "TEST" olan ayrı
  bir proje** aç, sadece onun üzerinde dene, işin sonunda onu sil (çöp kutusuna gider).
- Gerçek projelerde ve satırlarda deneme düzenlemesi, toplu işlem, silme ya da "half
  assignment" **yapma**.
- Script ile toplu veri yazma, döngüyle istek atma, veri "düzeltme" **yok**.
- Dakikada 200 istek sınırı var. Listeyi sayfa sayfa yükle, sıkı döngüyle istek atma.

---

## Bitti sayılması için kontrol listesi

Her maddeyi Trust System ile T-ERP yan yana açık olarak kontrol et:
- [ ] Aynı bölgeler, aynı projeler, aynı satırlar, aynı sırada
- [ ] Ekran görüntüsü karşılaştırması: tablo alanı piksel düzeyinde aynı (renkler, çizgiler,
      yükseklikler, genişlikler). Sadece dış çerçeve farklı
- [ ] TEST projesinde: satır ekle, satıcı seç → PF kodu Trust System'deki gibi oluşuyor;
      durum/tarih değişiyor; satır sil → çöp kutusuna gidiyor
- [ ] Trust System'de bir hücreyi değiştir → T-ERP'de yenilemeden görünüyor (ve tersi)
- [ ] Filtreler, PF grupları, Today PF, geri al, Excel dışa aktarma çalışıyor
- [ ] TR-STOCK satırında stok penceresi açılıyor (sadece TEST projesinde dene)
- [ ] Tarayıcının DevTools → Sources/Network kısmında API anahtarı **görünmüyor**
- [ ] T-ERP'den çıkış yapınca `/api/trust/...` 401 dönüyor
- [ ] T-ERP'nin diğer sayfalarının görünümü bozulmadı (stil izolasyonu)

Bitince yapılan uyarlamaların listesini, yani hangi dosyada neyin neden değiştiğini, kısa
bir rapor olarak yaz.
