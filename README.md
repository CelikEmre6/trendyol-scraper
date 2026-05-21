# 🛍️ Trendyol Veri Çekme (Trendyol Scraper)

Trendyol üzerinden ürün verilerini (fiyat, satıcı, stok, varyant, değerlendirme vb.) detaylı ve hızlı bir şekilde çekmenizi sağlayan masaüstü uygulamasıdır. Electron ve React (TypeScript) kullanılarak geliştirilmiş, modern ve performanslı bir mimariye sahiptir.

## 🚀 Özellikler

- **Gelişmiş Veri Çekme:** Seçili kategori veya arama linkindeki ürünlerin tüm detaylarını (İsim, Marka, Fiyatlar, Satıcı Bilgileri, Stok Durumu, Yorum Sayısı, Bedenler/Varyantlar) hızlıca tarar.
- **Varyant Desteği:** Ürünlerin farklı renk ve seçeneklerini de yakalayarak eksiksiz veri kümesi oluşturur.
- **Performans ve Bellek Yönetimi:** `TempStorage` yapısı ve akıllı çöp toplayıcı (GC) optimizasyonu sayesinde binlerce ürünü çekerken bile RAM şişmesini önler.
- **Modern ve Şık Arayüz:** Tailwind CSS ve Ant Design ile tasarlanmış karanlık mod (Dark Mode) destekli, akıcı ve kullanıcı dostu arayüz.
- **Geçmiş Aramalar ve Excel Çıktısı:** Yaptığınız tüm aramalar kaydedilir ve dilediğiniz zaman tek tıkla **Excel** dosyası olarak dışa aktarılabilir.
- **Lisans Sistemi:** Dahili lisans anahtarı (mac adresi tabanlı) doğrulama ve aktivasyon modülü içerir.

## 🛠️ Kullanılan Teknolojiler

- **Çatı (Framework):** [Electron](https://www.electronjs.org/) & [React](https://reactjs.org/) (TypeScript ile)
- **Paketleyici:** [Vite](https://vitejs.dev/) & [Electron-Vite](https://electron-vite.org/)
- **Stil & UI:** [Tailwind CSS](https://tailwindcss.com/), [Ant Design (antd)](https://ant.design/)
- **Veri Çekme (Scraping):** [Axios](https://axios-http.com/), [Cheerio](https://cheerio.js.org/)
- **Dışa Aktarma:** [ExcelJS](https://github.com/exceljs/exceljs)
- **Durum Yönetimi:** [Jotai](https://jotai.org/)

## ⚙️ Kurulum ve Geliştirme

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin. Sisteminizde [Node.js](https://nodejs.org/) ve `npm` veya `yarn` yüklü olmalıdır.

### 1. Bağımlılıkları Yükleyin

```bash
# Proje dizinine gidin
cd sahibinden-scraper

# Paketleri yükleyin
npm install
# veya
yarn install
```

### 2. Geliştirici Modunda Çalıştırın

Uygulamayı geliştirme modunda (Hot Reload destekli) başlatmak için:

```bash
npm run dev
# veya
yarn dev
```

## 📦 Derleme (Build) İşlemleri

Uygulamayı son kullanıcılar için paketlemek ve dağıtılabilir dosyalar (.exe, .dmg vb.) oluşturmak için aşağıdaki komutları kullanabilirsiniz:

```bash
# Windows için derleme
npm run build:win

# macOS için derleme
npm run build:mac

# Linux için derleme
npm run build:linux
```

Derlenen dosyalar `dist/` klasörü içerisine oluşturulacaktır.

## 🖥️ Arayüz Sekmeleri

Uygulama açıldığında sol veya üst menüde şu sekmeleri göreceksiniz:
1. **Arama Yap:** Trendyol arama veya kategori linkini yapıştırarak veri çekme işlemini başlatın.
2. **Geçmiş Aramalar:** Daha önceden çektiğiniz verilerin kayıtlarını görüntüleyin.
3. **Ürün Linkleri:** Yalnızca belirlenen ürün linkleri üzerinden işlem yapma arayüzü.
4. **Ayarlar:** Lisans bilgileri, veri çekme limitleri ve uygulama genel ayarlarının yönetimi.

## ⚠️ Yasal Uyarı

Bu yazılım **yalnızca eğitim ve araştırma amaçlı** geliştirilmiştir. Trendyol üzerindeki verilerin otomatik yollarla (bot, scraper vb.) çekilmesi sitenin kullanım koşullarına aykırı olabilir ve IP adresinizin engellenmesine yol açabilir. Çektiğiniz verilerin kullanımından ve doğabilecek yasal sorumluluklardan tamamen kullanıcı sorumludur.

---
*Bu proje modern Electron-Vite şablonu temel alınarak geliştirilmiştir.*
