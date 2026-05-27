# Frontend - Uygulama Tasarimi

Bu dokuman, Akilli Sehir Yonetim Platformu frontend uygulamasinin teknoloji
kararlarini, sayfa yapisini ve servislerle iletisim modelini netlestirir.

## Uygulama Amaci

Frontend, IoT Service, Video Analysis Service ve ML Analytics Service tarafindan
uretilen verileri tek bir akilli sehir yonetim panelinde birlestirir.

Frontend'in kendi veritabani olmayacaktir. Tum veriler mikroservislerin REST API
endpoint'lerinden okunacaktir.

## Teknoloji Kararlari

Karar:

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Recharts
- Leaflet + OpenStreetMap

Gerekce:

- React + Vite, hizli gelistirme ve modern frontend yapisi saglar.
- TypeScript, servislerden gelen veri modellerini daha guvenli kullanmayi saglar.
- Tailwind CSS, dashboard arayuzunu hizli ve tutarli gelistirmek icin uygundur.
- TanStack Query, polling, cache ve loading/error durumlarini yonetmek icin
  kullanilir.
- Axios, REST API istekleri icin kullanilir.
- Recharts, IoT, video analiz ve ML tahmin grafiklerini gostermek icin uygundur.
- Leaflet + OpenStreetMap, sehir bolgelerini harita uzerinde gostermek icin
  kullanilir.

## Sayfa Yapisi

Frontend tek uygulama olarak asagidaki sayfalardan olusacaktir:

```text
/dashboard
/iot
/video
/ml
/zones/:zone
```

## Dashboard Sayfasi

Amac:

- Sehrin genel durumunu tek ekranda gostermek.

Icerik:

- Genel risk skoru
- Aktif sensor sayisi
- Aktif kamera sayisi
- Kritik bolge sayisi
- Sehir haritasi
- Son IoT olcumleri
- Son video analizleri
- Son ML tahminleri

## IoT Sayfasi

Amac:

- Sensor verilerini ve cihaz durumlarini gostermek.

Icerik:

- Bolge bazli sensor kartlari
- Sicaklik
- Nem
- Hava kalitesi
- Trafik seviyesi
- Son guncelleme zamani
- Zaman serisi grafikleri
- Sensor durumlari: `normal`, `warning`, `critical`

Veri kaynaklari:

- IoT Service `GET /sensors`
- IoT Service `GET /readings/latest`
- IoT Service `GET /zones/{zone}/readings?limit=50`

## Video Sayfasi

Amac:

- Kamera izleme ve video analiz sonuclarini gostermek.

Icerik:

- Kamera grid'i
- Canliymis gibi oynayan video kartlari
- Recognition label'lari
- Kisi sayisi
- Arac sayisi
- Kalabalik seviyesi
- Hareket yogunlugu
- Kamera bazli analiz gecmisi

Veri kaynaklari:

- Video Service `GET /cameras`
- Video Service `GET /cameras/{camera_id}/stream`
- Video Service `GET /analysis/latest`
- Video Service `GET /analysis?camera_id={camera_id}&limit=50`

## ML Sayfasi

Amac:

- Tahmin ve karar destek sonuclarini gostermek.

Icerik:

- 1 saat sonraki sicaklik tahmini
- Kalabalik seviyesi tahmini
- Risk skoru
- Oneri metni
- Risk trend grafigi
- Model durumu
- Tahmin uret butonu

Veri kaynaklari:

- ML Service `GET /predictions/latest`
- ML Service `GET /predictions?zone={zone}&limit=50`
- ML Service `GET /zones/{zone}/risk`
- ML Service `GET /model/status`
- ML Service `POST /predictions/generate`

## Zone Detail Sayfasi

Amac:

- Tek bir bolgenin IoT, Video ve ML verilerini birlestirmek.

Ornek:

`/zones/Meydan`

Icerik:

- Bolgenin son sensor degerleri
- Bolge kamerasi
- Son video analiz sonucu
- ML tahmini
- Risk skoru
- Risk trendi

Bu sayfa, uc mikroservisten veri aldigi icin sistemin birlestirilmis degerini
gosteren ana detay ekranidir.

## Servislerle Iletisim

Karar:

- Frontend servisleri dogrudan REST API ile cagiracak.
- API Gateway kullanilmayacak.

Akis:

```text
Frontend
  -> IoT Service REST API
  -> Video Analysis Service REST API
  -> ML Analytics Service REST API
```

Gerekce:

- Proje tek kisilik ve akademik kapsamda oldugu icin API Gateway gereksiz
  karmasiklik yaratir.
- Servis sinirlari frontend tarafinda net gorunur.
- API Gateway raporda ileri gelistirme secenegi olarak anlatilabilir.

## Canli Gorunum Karari

Karar:

- WebSocket yerine polling kullanilacak.

Polling araliklari:

- IoT verileri: 5 saniye
- Video analiz sonuclari: 3 saniye
- ML tahminleri: 10 saniye veya manuel tahmin uretme sonrasinda yenileme

Gerekce:

- Demo icin yeterli canli gorunum hissi verir.
- FastAPI ve React entegrasyonu daha basittir.
- WebSocket mimarisi bu proje icin ek karmasiklik yaratir.

## UI Yaklasimi

Arayuz, belediye veya sehir operasyon merkezi paneli gibi tasarlanacaktir.

Temel kararlar:

- Sol sidebar
- Ust bar
- Dashboard kartlari
- Grafik panelleri
- Harita alani
- Kamera grid'i
- Risk seviyelerine gore renk kullanimi

Risk renkleri:

- `normal`: yesil
- `warning`: sari
- `critical`: kirmizi
- `info`: mavi

## Frontend Sinirlari

Frontend yapmaz:

- Kendi veritabanini tutmaz.
- Sensor verisi uretmez.
- Video analizi yapmaz.
- ML modeli calistirmaz.
- Servislerin veritabanlarina dogrudan baglanmaz.

Frontend yapar:

- Verileri servis API'lerinden okur.
- Kullaniciya dashboard, grafik, harita ve video gorunumu sunar.
- Simulator veya tahmin uretme gibi aksiyonlari servis endpoint'leri uzerinden
  tetikler.

## Net Karar

Frontend icin karar:

- Tek React uygulamasi olacak.
- Vite + TypeScript kullanilacak.
- Tailwind CSS ile operasyon paneli arayuzu tasarlanacak.
- TanStack Query ile API verileri, polling ve cache yonetilecek.
- Recharts grafikler icin kullanilacak.
- Leaflet + OpenStreetMap harita icin kullanilacak.
- Servisler dogrudan REST API ile cagrilacak.
- Canli gorunum polling ile saglanacak.

Bu yapi, IoT, Video ve ML mikroservislerinin ciktisini tek bir akilli sehir
yonetim panelinde birlestirmek icin yeterlidir.
