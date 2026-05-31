# Akilli Sehir Yonetim Platformu - Deployment Plani

Bu dokuman, projenin AWS uzerinde hangi parcayi hangi servise deploy edecegini
netlestirir. Temel hedef, her modulu ders PDF'indeki amacina uygun bulut
servisine yerlestirmek ve mikroservis sinirlarini deployment ortaminda da
korumaktir.

## Ana Deployment Karari

Proje tek bir uygulama gibi kullanilir, fakat deployment acisindan ayri sinirlara
sahiptir:

- Frontend statik bir web uygulamasi olarak yayinlanir.
- IoT, Video Analysis ve ML Analytics API'leri ayri ECS Fargate servisleri olarak
  calisir.
- Her mikroservisin kendi DynamoDB tablolari vardir.
- Servisler birbirinin veritabanina dogrudan baglanmaz.
- Veri paylasimi REST API veya ilgili AWS servis akislari uzerinden yapilir.
- Local demo icin Docker Compose kullanilir, AWS deployment icin managed AWS
  servisleri tercih edilir.

## PDF Beklentisi ile AWS Eslesmesi

| PDF Projesi | Beklenen Konu | AWS Deployment Karsiligi |
| --- | --- | --- |
| Proje 3 - Akilli Veri Analitigi ve ML | Model gelistirme, bulutta egitim/dagitim, tahmin | ECS ML API + SageMaker veya Lambda inference + DynamoDB |
| Proje 6 - Video Akisi ve Isleme | Video akisi, video isleme API'si, nesne tanima | S3 + Kinesis Video Streams veya S3 playback + Rekognition Video + SNS/Lambda + DynamoDB |
| Proje 7 - IoT ve Akilli Sehir | MQTT/IoT protokolu, IoT Core, veri toplama, gorsellestirme | AWS IoT Core + IoT Rule + Lambda + DynamoDB + IoT API |

## Final Deployment Haritasi

| Parca | AWS Servisi | Deployment Sekli | Sahip Oldugu Sorumluluk |
| --- | --- | --- | --- |
| Frontend React | S3 + CloudFront | Vite production build statik dosya olarak yayinlanir | Dashboard, harita, grafik, kamera ve tahmin ekranlari |
| API Routing | CloudFront + ALB | Tek public giris, path bazli yonlendirme | `/api/iot`, `/api/video`, `/api/ml` rotalarini servis target group'larina aktarir |
| IoT Service API | ECS Fargate | Ayri task definition, ayri service, ayri container image | Sensor listeleme, son/gecte sensor verisi, cihaz raporlama API'leri |
| IoT MQTT Ingestion | AWS IoT Core | Managed MQTT broker | Sensor/simulator mesajlarini MQTT ile alir |
| IoT Processing | IoT Rule + Lambda | IoT topic rule Lambda'yi tetikler | Telemetry payload'ini dogrular ve IoT DynamoDB tablolarina yazar |
| IoT Database | DynamoDB | Ayri tablolar | `iot_sensors`, `iot_sensor_readings` |
| Video Service API | ECS Fargate | Ayri task definition, ayri service, ayri container image | Kamera metadata, stream bilgisi ve analiz sonuc API'leri |
| Video Source Storage | S3 | Video dosyalari object storage'da tutulur | Sentetik/kayitli video kaynak ve arsiv dosyalari |
| Video Stream | Kinesis Video Streams veya S3/CloudFront playback | AWS hesap erisimine gore secilecek | Canli kamera hissi veren video akisinin yonetimi |
| Video Analysis | Rekognition Video | Stored video analysis oncelikli karar | Nesne/etiket analizi uretir |
| Video Result Processing | SNS + Lambda | Rekognition tamamlanma bildirimi Lambda'yi tetikler | Analiz sonucunu normalize edip DynamoDB'ye yazar |
| Video Database | DynamoDB | Ayri tablolar | `video_cameras`, `video_analysis_results` |
| ML Analytics API | ECS Fargate | Ayri task definition, ayri service, ayri container image | Tahmin endpointleri, risk skoru, model durum API'leri |
| ML Inference | SageMaker endpoint veya Lambda | Hesap/maliyet durumuna gore secilecek | Scikit-learn modelini bulutta calistirir |
| ML Database | DynamoDB | Ayri tablo | `ml_predictions` |
| Container Registry | ECR | Servis basina ayri repository | Backend image versiyonlama |
| Logs | CloudWatch Logs | Servis basina ayri log group | API, Lambda ve deployment loglari |

## Mikroservis Deployment Sinirlari

| Mikroservis | Runtime | Image | IAM Yetkisi | Veritabani | Diger Servislerle Iliski |
| --- | --- | --- | --- | --- | --- |
| IoT Service | ECS Fargate | ECR `smart-city/iot-service` | Sadece IoT tablolari ve gerekirse IoT metadata okuma | `iot_sensors`, `iot_sensor_readings` | Frontend'e REST API sunar |
| Video Analysis Service | ECS Fargate | ECR `smart-city/video-service` | Sadece video tablolari, video S3 bucket ve gerekirse Rekognition okuma | `video_cameras`, `video_analysis_results` | Frontend'e REST API sunar |
| ML Analytics Service | ECS Fargate | ECR `smart-city/ml-service` | Sadece ML tablosu ve inference servisi kullanimi | `ml_predictions` | IoT ve Video API'lerinden REST ile veri alir |

Not:

- Ortak ECS cluster kullanilabilir, fakat servisler ayri ECS service/task
  definition olarak deploy edilir.
- Her servis icin ayri ECR repository, ayri CloudWatch log group ve ayri IAM
  policy kullanilmasi hedeflenir.
- Bu yapi, kod seviyesindeki mikroservis ayrimini AWS deployment seviyesinde de
  gorunur hale getirir.

## IoT Deployment Akisi

AWS tarafinda IoT verisi Mosquitto uzerinden degil, AWS IoT Core uzerinden
alinir. Mosquitto sadece local Docker Compose demosunun parcasidir.

```text
Sensor simulator veya cihaz
  -> MQTT
  -> AWS IoT Core
  -> IoT Rule
  -> Lambda
  -> DynamoDB: iot_sensor_readings
  -> IoT Service API
  -> Frontend
```

IoT API ECS Fargate uzerinde calisir. Bu servis sensor ve okuma verilerini
frontend'e sunar; veri girisi icin ana AWS yolu IoT Core + Rule + Lambda'dir.

## Video Deployment Akisi

Video tarafinda ana hedef, PDF'teki video akisi ve bulut tabanli video isleme
beklentisini karsilamaktir. Bu nedenle video dosyalari DynamoDB'de tutulmaz;
S3'te saklanir. DynamoDB sadece kamera metadata'si ve analiz event'leri icindir.

Oncelikli analiz akisi:

```text
Video dosyasi
  -> Amazon S3
  -> Rekognition Video stored analysis
  -> SNS
  -> Lambda
  -> DynamoDB: video_analysis_results
  -> Video Analysis Service API
  -> Frontend
```

Video stream secimi deploy sirasinda AWS hesap erisimine gore netlestirilecek:

| Secenek | Ne Zaman Kullanilir | Not |
| --- | --- | --- |
| Kinesis Video Streams | Hesap erisimi, maliyet ve zaman uygunsa | PDF'teki AWS video akis beklentisine en dogrudan karsiliktir |
| S3/CloudFront playback | Kinesis/Rekognition streaming erisimi veya sure kisitliysa | Video yine AWS S3 uzerinden yayinlanir; analiz Rekognition stored video ile yapilir |

Rekognition Streaming Video Analysis yeni musteriler icin kisitli olabilecegi
icin stored video analysis ana karar olarak tutulur. Kinesis Video Streams,
hesap izinleri uygun olursa video akis yonetimi icin eklenir.

## ML Deployment Akisi

ML API ECS Fargate uzerinde calisir; tahmin endpointlerini frontend'e sunar ve
IoT/Video servislerinden REST ile veri alir. Model inference icin iki AWS yolu
vardir:

| Secenek | Ne Zaman Kullanilir | Not |
| --- | --- | --- |
| SageMaker endpoint | Hesap/maliyet ve sure uygunsa | PDF'teki SageMaker beklentisini en net karsilar |
| Lambda inference | Daha dusuk maliyet ve daha hizli deployment gerekiyorsa | Scikit-learn model artifact'i Lambda icinde calistirilir |

Akis:

```text
IoT Service API + Video Service API
  -> ML Analytics Service
  -> Feature extraction
  -> SageMaker endpoint veya Lambda inference
  -> Rule-based risk engine
  -> DynamoDB: ml_predictions
  -> Frontend
```

## Frontend ve API Erisimi

Frontend S3 + CloudFront uzerinden yayinlanir. Kullanici tek CloudFront domaini
ile panele girer. API erisimi icin iki pratik secenek vardir:

| Secenek | Karar | Gerekce |
| --- | --- | --- |
| CloudFront + ALB path routing | Oncelikli | Frontend ve API'ler tek origin hissi verir, CORS ve mixed content riski azalir |
| API Gateway | Alternatif | Daha fazla managed API ozelligi verir, fakat bu proje icin ek karmasiklik yaratabilir |

Oncelikli routing:

```text
https://cloudfront-domain/
  -> S3 frontend

https://cloudfront-domain/api/iot/*
  -> ALB target group: IoT Service

https://cloudfront-domain/api/video/*
  -> ALB target group: Video Analysis Service

https://cloudfront-domain/api/ml/*
  -> ALB target group: ML Analytics Service
```

Uygulama kodu AWS path routing'e uygun olacak sekilde prefixli API yollarini da
kabul eder:

| Servis | Local API | AWS API |
| --- | --- | --- |
| IoT Service | `/health`, `/sensors`, `/readings` | `/api/iot/health`, `/api/iot/sensors`, `/api/iot/readings` |
| Video Analysis Service | `/health`, `/cameras`, `/analysis`, `/media` | `/api/video/health`, `/api/video/cameras`, `/api/video/analysis`, `/api/video/media` |
| ML Analytics Service | `/health`, `/predictions`, `/model` | `/api/ml/health`, `/api/ml/predictions`, `/api/ml/model` |

AWS deployment icin her repo kendi `.env.aws.example` dosyasina sahiptir. Local
`.env.example` dosyalari Docker Compose demosunu, `.env.aws.example` dosyalari
ise CloudFront/ALB/ECS deployment davranisini tarif eder.

## DynamoDB Tablo Ayrimi

| Servis | Tablolar | Veri Turu |
| --- | --- | --- |
| IoT Service | `iot_sensors`, `iot_sensor_readings` | Sensor metadata ve telemetry eventleri |
| Video Analysis Service | `video_cameras`, `video_analysis_results` | Kamera metadata ve analiz eventleri |
| ML Analytics Service | `ml_predictions` | Tahmin, risk skoru ve karar destek ciktisi |

Her servis yalnizca kendi tablolarina yazmali ve okumalidir. ML servisi IoT ve
Video verisini DynamoDB'den dogrudan okumaz; IoT ve Video API'lerini kullanir.

## Local ile AWS Karsiliklari

| Local Bilesen | AWS Karsiligi |
| --- | --- |
| Vite dev server | S3 + CloudFront |
| Docker Compose backend containerlari | ECS Fargate servisleri |
| DynamoDB Local | Amazon DynamoDB |
| Mosquitto | AWS IoT Core |
| IoT MQTT consumer | IoT Rule + Lambda veya IoT ingestion Lambda |
| Local synthetic video file | S3 video object |
| Local stream endpoint | Kinesis Video Streams veya S3/CloudFront playback |
| Local OpenCV/synthetic analysis | Rekognition Video stored analysis + Lambda processing |
| Local joblib inference | SageMaker endpoint veya Lambda inference |

## AWS Runtime Flag'leri

| Servis | Degisken | AWS Degeri | Amac |
| --- | --- | --- | --- |
| Frontend | `VITE_IOT_API_URL` | `/api/iot` | CloudFront path routing uzerinden IoT API'ye gitmek |
| Frontend | `VITE_VIDEO_API_URL` | `/api/video` | CloudFront path routing uzerinden Video API'ye gitmek |
| Frontend | `VITE_ML_API_URL` | `/api/ml` | CloudFront path routing uzerinden ML API'ye gitmek |
| IoT Service | `MQTT_ENABLED` | `false` | AWS'te Mosquitto yerine IoT Core + Rule + Lambda kullanmak |
| IoT Service | `SIMULATOR_AUTOSTART` | `false` | API container'ini local simulatora bagimli yapmamak |
| Video Service | `ANALYZER_AUTOSTART` | `false` | AWS'te local analyzer yerine Rekognition/Lambda akisini kullanmak |
| ML Service | `PREDICTION_HORIZON_MINUTES` | `60` | Dokumandaki 1 saatlik tahmin ufkuyla tutarlilik |

## Deployment Sirasinda Kontrol Edilecekler

1. AWS hesap bolgesi secilecek. Varsayilan bolge: `eu-central-1`.
2. S3 bucket ve CloudFront distribution olusturulacak.
3. Her backend icin ECR repository olusturulacak.
4. Her backend icin ECS task definition ve ECS service olusturulacak.
5. Her servis icin IAM role/policy ayrimi yapilacak.
6. DynamoDB tablolari gercek AWS uzerinde olusturulacak.
7. IoT Core topic rule ve Lambda akisi kurulacak.
8. Video icin S3/Rekognition izinleri kontrol edilecek.
9. Kinesis Video Streams kullanilip kullanilamayacagi hesap izinleri ve sureye
   gore netlestirilecek.
10. ML icin SageMaker mi Lambda inference mi kullanilacagi maliyet ve hesap
    durumuna gore netlestirilecek.
11. CloudFront/ALB routing test edilecek.
12. Dashboard, IoT, Video ve ML sayfalari icin smoke test yapilacak.

## Raporlama Notu

Rapor yazilirken "backendleri tek yere koyduk" seklinde anlatilmayacak.
Daha dogru anlatim:

- FastAPI servisleri API katmani olarak ECS Fargate uzerinde calisir.
- IoT verisi AWS IoT Core + IoT Rule + Lambda ile islenir.
- Video dosyalari S3'te tutulur, analiz Rekognition Video ile yapilir.
- ML inference SageMaker veya Lambda ile konumlandirilir.
- Her modulin verisi kendi DynamoDB tablolarinda tutulur.
- Frontend S3 + CloudFront ile kullaniciya sunulur.

Bu deployment plani, ders PDF'indeki "dogru bulut servisini dogru probleme
uygulama" amacina gore hazirlanmistir.
