# Mikroservis Raporlari - Icerik Haritasi

Bu dosya, uc ayri rapor uretilirken hangi mevcut proje dokumanindan hangi
bolumun beslenecegini gosterir.

## Ortak Kaynaklar

| Kaynak Dosya | Kullanilacak Bolumler |
| --- | --- |
| `docs/architecture-decisions.md` | Ortak mimari kararlar, servis sinirlari, DynamoDB ayrimi |
| `docs/deployment-plan.md` | AWS deployment haritasi, local-AWS karsiliklari |
| `docs/aws-deployment-runbook.md` | Gercek deploy kaynaklari, smoke test sonuclari, kapatma/acma notlari |
| `docs/frontend-design.md` | Tek frontend paneli, route yapisi, polling ve REST API iletisim |
| `docs/demo-video-guide.md` | Demo akisi, deploy karar ozetleri |

## IoT Raporu Kaynaklari

| Rapor Bolumu | Ana Kaynak |
| --- | --- |
| PDF beklentisi ve kapsam | `docs/iot-module-design.md` |
| MQTT topic tasarimi | `docs/iot-module-design.md` |
| Sensor bolgeleri | `docs/iot-module-design.md` |
| API tasarimi | `docs/iot-module-design.md` + servis kodu |
| AWS deployment | `docs/deployment-plan.md` + `docs/aws-deployment-runbook.md` |
| Test kaniti | Chrome `/iot` smoke + `/api/iot/readings/latest` |

## Video Raporu Kaynaklari

| Rapor Bolumu | Ana Kaynak |
| --- | --- |
| PDF beklentisi ve kapsam | `docs/video-module-design.md` |
| Canli akis karari | `docs/video-module-design.md` + son MJPEG revizyonu |
| Rekognition/S3/SNS akisi | `docs/video-module-design.md` + `docs/aws-deployment-runbook.md` |
| DynamoDB savunusu | `docs/video-module-design.md` + `docs/deployment-plan.md` |
| API tasarimi | `docs/video-module-design.md` + servis kodu |
| Test kaniti | Chrome `/video` smoke + `/api/video/cameras/{id}/stream` |

## ML Raporu Kaynaklari

| Rapor Bolumu | Ana Kaynak |
| --- | --- |
| PDF beklentisi ve kapsam | `docs/ml-module-design.md` |
| Model yaklasimi | `docs/ml-module-design.md` |
| Risk engine | `docs/ml-module-design.md` + servis kodu |
| REST ile veri alma karari | `docs/ml-module-design.md` + `docs/architecture-decisions.md` |
| AWS inference alternatifi | `docs/ml-module-design.md` + `docs/deployment-plan.md` |
| Test kaniti | Chrome `/ml` smoke + `/api/ml/predictions/latest` |

## Kapak Link Alanlari

Kapakta GitHub linkleri icin asagidaki adresler kullanilacak:

```text
Frontend Repo Linki: https://github.com/eemrezcan/bulutproje-final-frontend
IoT Service Repo Linki: https://github.com/eemrezcan/bulutproje3-iot-service
Video Analysis Service Repo Linki: https://github.com/eemrezcan/bulutproje4-video-analysis-service
ML Analytics Service Repo Linki: https://github.com/eemrezcan/bulutproje5-ml-analytics-service
Demo Video Linki:
```

Rapor uretilirken ilgili mikroservis raporunda sadece frontend repo linki ve o
mikroservis repo linki gosterilecek. Demo video linki su an bos kalacak.

## Rapor Gorselleri

Rapor uretiminden once canli CloudFront deployment uzerinden ekran
goruntuleri alinacak. Dashboard, IoT ve Video gorselleri Chrome eklentisiyle
dogrulandi; ML sayfasi Chrome eklentisinde ekran goruntusu komutunda zaman
asimina dustugu icin ayni canli URL Codex'in yerlesik tarayicisinda yakalandi.

| Dosya Adi | Rota | Rapor |
| --- | --- | --- |
| `dashboard-overview.jpg` | `/dashboard` | Ortak baglam |
| `iot-readings.jpg` | `/iot` | IoT |
| `video-live-feed.jpg` | `/video` | Video |
| `ml-risk-summary.jpg` | `/ml` | ML |

Gorseller final raporlarda kanit amacli kullanilacak; gorsel sayisi rapor
akisini bozmayacak sekilde sinirli tutulacak.

## Uretim Sirasina Gore Plan

1. IoT raporu pilot olarak uretilir.
2. DOCX render edilir ve PDF gorsel kalite kontrolu yapilir.
3. Stil onaylanirsa ayni sablonla Video raporu uretilir.
4. Video raporundan sonra ML raporu uretilir.
5. Uc PDF son kez isim, kapak, icindekiler ve kaynakca uyumu icin kontrol
   edilir.

## Cikti Dosya Adlari

```text
docs/reports/out/iot-akilli-sehir-raporu.docx
docs/reports/out/iot-akilli-sehir-raporu.pdf
docs/reports/out/video-akilli-sehir-raporu.docx
docs/reports/out/video-akilli-sehir-raporu.pdf
docs/reports/out/ml-akilli-sehir-raporu.docx
docs/reports/out/ml-akilli-sehir-raporu.pdf
```
