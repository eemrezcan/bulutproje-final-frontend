# Akilli Sehir Yonetim Platformu - Frontend

Bu repo ortak frontend uygulamasini ve lokal gelistirme icin ortak
`docker-compose.yml` dosyasini icerir.

## Sorumluluk

- IoT, Video ve ML servislerinden REST API ile veri okur.
- Dashboard, harita, grafik ve kamera gorunumlerini sunar.
- Kendi veritabanini tutmaz.

## Lokal Calisma

Ortak compose dosyasi bu repo icindedir:

```bash
docker compose up --build
```

Compose dosyasi sibling servis repolarini referanslar:

- `../bulutproje3-iot-service`
- `../bulutproje4-video-analysis-service`
- `../bulutproje5-ml-analytics-service`

