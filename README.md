# BIST 100 Backend API

Bu proje BIST 100 hisse verileri için backend API'dir. Vercel Functions kullanarak Yahoo Finance verilerini cache'ler.

## 🚀 Vercel'e Deploy Etme

### 1. GitHub Repository Oluştur
- GitHub'da yeni repo oluşturun: `bist-backend`
- Bu dosyaları repo'ya yükleyin

### 2. Vercel'e Bağla
1. Vercel dashboard'a gidin: https://vercel.com/dashboard
2. "Add New" → "Project" tıklayın
3. GitHub repo'nuzu seçin: `bist-backend`
4. "Deploy" butonuna basın

### 3. Deploy URL'i Alın
Deploy bittikten sonra URL'iniz olacak:
```
https://bist-backend-xxxx.vercel.app
```

### 4. API Endpoint
```
https://bist-backend-xxxx.vercel.app/api/bist-data
```

## 🔧 Nasıl Çalışır

- İlk istek: Yahoo API'den veri çeker (100 istek)
- Sonraki istekler (aynı gün): Cache'ten döner (0 istek)
- Her gün saat 00:00'da cache sıfırlanır
- Otomatik olarak yeni veri çeker

## 📊 API Response

```json
{
  "success": true,
  "cached": false,
  "timestamp": 1234567890,
  "data": {
    "GARAN": {
      "price": 98.50,
      "historical": {
        "close": [...],
        "high": [...],
        "low": [...],
        "volume": [...]
      }
    }
  }
}
```

## ✅ Avantajlar

- ✅ Günlük sadece 100 Yahoo API isteği
- ✅ Sınırsız kullanıcı
- ✅ Hızlı yanıt (cache)
- ✅ Ücretsiz (Vercel)
- ✅ Otomatik CORS
