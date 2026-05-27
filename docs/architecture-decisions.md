# Akilli Sehir Yonetim Platformu - Mimari Kararlar

Bu dokuman, 3522 Bulut Bilisim dersi final PDF'indeki Proje 3, Proje 6 ve
Proje 7 basliklarini tek bir ana urun altinda birlestirmek icin alinmis kararlarin
guncel karar setidir.

## Ana Konsept

Proje, bir akilli sehir yonetim paneli olarak tasarlanacaktir.

Tek bir frontend uygulamasi olacak ve bu frontend uc ayri mikroservisten veri
alacaktir:

- IoT Service
- Video Analysis Service
- ML Analytics Service

Her mikroservisin kendi DynamoDB tablolari olacak. Servisler birbirinin
tablolarina dogrudan baglanmayacak. Gerekli veri paylasimi sadece API uzerinden
yapilacak.

## PDF ile Eslesme

Bu proje, PDF'teki uc proje basligini tek bir ortak senaryoda birlestirir:

- Proje 3: Akilli Veri Analitigi ve Makine Ogrenmesi Uygulamasi
- Proje 6: Video Akisi ve Isleme Uygulamasi
- Proje 7: IoT ve Akilli Sehir Uygulamasi

## Servis Sinirlari

### IoT Service

IoT Service, sehirdeki sensor verilerinden sorumludur.

Yapacaklari:

- Sensor noktalarini yonetir.
- MQTT ile gelen sicaklik, nem, hava kalitesi ve trafik yogunlugu gibi sentetik
  sensor verilerini alir.
- Sensor verilerini kendi veritabanina kaydeder.
- Frontend'e anlik ve gecmis sensor verisi sunar.

Yapmayacaklari:

- Kamera veya video islemez.
- Kalabalik tespiti yapmaz.
- Makine ogrenmesi tahmini uretmez.
- Diger servislerin veritabanina baglanmaz.

Ornek veri:

```json
{
  "zone": "Meydan",
  "temperature": 31.4,
  "humidity": 42,
  "airQualityIndex": 87,
  "trafficLevel": 64,
  "timestamp": "2026-05-27T15:30:00"
}
```

### Video Analysis Service

Video Analysis Service, sehir kameralarindan ve video analizinden sorumludur.

Gercek kamera baglantisi yerine sentetik video veya kayitli video dosyalari
canli kamera gibi gosterilecektir.

Yapacaklari:

- Kamera noktalarini yonetir.
- Sentetik veya kayitli videoyu canli yayin gibi sunar.
- Video analizi sonucu uretir.
- Kisi sayisi, arac sayisi, hareket yogunlugu, kalabalik seviyesi ve recognition
  etiketleri gibi analiz event'lerini kendi DynamoDB tablolarinda tutar.

Yapmayacaklari:

- IoT sensor verisi toplamaz.
- Sicaklik veya hava kalitesi verisi uretmez.
- Gelecek tahmini yapmaz.
- ML modeli egitmez.
- Video dosyasini DynamoDB'de saklamaz.
- Diger servislerin veritabanina baglanmaz.

Ornek veri:

```json
{
  "cameraId": "cam_meydan_01",
  "zone": "Meydan",
  "peopleCount": 124,
  "vehicleCount": 38,
  "crowdLevel": "HIGH",
  "recognitionLabels": ["crowd", "traffic"],
  "timestamp": "2026-05-27T15:30:00"
}
```

### ML Analytics Service

ML Analytics Service, tahmin ve karar destek katmanindan sorumludur.

Yapacaklari:

- IoT Service API'sinden sicaklik, hava kalitesi ve trafik yogunlugu gibi
  ozet verileri alir.
- Video Analysis Service API'sinden kalabalik tespiti ve recognition sonuclarini
  alir.
- Bu verilerle hibrit ML ve kural tabanli karar destek ciktilari uretir.
- Tahmin sonuclarini kendi veritabanina kaydeder.

Tahmin ornekleri:

- 1 saat sonraki sicaklik tahmini
- Bolge bazli kalabalik tahmini
- Risk skoru
- Karar destek onerisi

Yapmayacaklari:

- Sensor verisini dogrudan toplamaz.
- Kamera veya video islemez.
- MQTT dinlemez.
- OpenCV/Rekognition calistirmaz.
- Diger servislerin veritabanina baglanmaz.

Ornek veri:

```json
{
  "zone": "Meydan",
  "predictedTemperature": 33.1,
  "predictedCrowdLevel": "HIGH",
  "riskScore": 82,
  "recommendation": "Meydan bolgesinde yogunluk artisi bekleniyor.",
  "predictionFor": "2026-05-27T16:30:00"
}
```

## Veri Sahipligi

Her servis kendi verisinin sahibidir:

| Servis | DynamoDB Tablolari | Sahip Oldugu Veri |
| --- | --- | --- |
| IoT Service | `iot_sensors`, `iot_sensor_readings` | Sensorler, sensor olcumleri |
| Video Analysis Service | `video_cameras`, `video_analysis_results` | Kameralar, video analiz sonuclari |
| ML Analytics Service | `ml_predictions` | Tahminler, risk skorlari, model ciktilari |

ML servisi, IoT ve Video verilerini kendi veritabanlarindan okumaz. Bunun yerine
ilgili servislerin API endpoint'lerini kullanir.

## Teknoloji Kararlari

### Frontend

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

- Tek yonetim paneli icin hizli gelistirme saglar.
- Grafik ve harita ekranlari icin uygundur.
- Servislerden REST API ile veri almak kolaydir.
- TanStack Query, polling ve cache yonetimi icin kullanilacaktir.
- Tailwind CSS, dashboard arayuzunu hizli ve tutarli gelistirmek icin secilmistir.

### Backend Mikroservisleri

Karar:

- Python
- FastAPI
- Uvicorn

Gerekce:

- PDF'te Python backend dilleri arasinda yer alir.
- ML, video analizi ve IoT simule veri uretimi icin Python ekosistemi uygundur.
- FastAPI otomatik Swagger dokumantasyonu verdigi icin rapor ve video anlatimi
  icin avantajlidir.

### Veritabani

Karar:

- Her servis kendi DynamoDB tablolarini kullanacak.
- Lokal gelistirmede DynamoDB Local kullanilacak.
- AWS ortaminda Amazon DynamoDB kullanilacak.

Alternatif:

- PostgreSQL veya MongoDB, iliskisel raporlama ya da dokuman tabanli sorgulama
  ihtiyaci artarsa kullanilabilir.

Tercih gerekcesi:

- IoT sensor verileri, video analiz sonuclari ve ML tahminleri olay/event
  yapisina benzer.
- DynamoDB, sensor_id veya camera_id gibi anahtarlarla zaman sirali kayit
  saklamak icin uygundur.
- AWS tarafinda IoT Core, Lambda ve DynamoDB akisi net sekilde anlatilabilir.
- Lokal ortamda DynamoDB Local ile ayni veri modeli test edilebilir.
- Uc servis icin ayni NoSQL yaklasimi gelistirme karmasasini azaltir.

Not:

- PDF'in video bolumunde MongoDB ve PostgreSQL ornek veritabani olarak
  verilmektedir. Bu projede bilincli olarak DynamoDB secilmistir.
- Gerekce, projenin AWS odakli olmasi ve video tarafinda saklanan verinin
  video dosyasi degil, zaman damgali analiz event'leri olmasidir.
- MongoDB veya PostgreSQL raporda alternatif veritabani secenegi olarak
  anlatilabilir.

### IoT Veri Akisi

Karar:

- Sensor verisi sisteme MQTT ile girecek.
- REST API, frontend'in IoT verilerini okumasi ve cihazlari listelemesi icin
  kullanilacak.

Lokal MQTT secenegi:

- Mosquitto MQTT Broker

AWS karsiligi:

- AWS IoT Core
- AWS Lambda
- Amazon DynamoDB

Gerekce:

- PDF'te IoT protokolleri olarak MQTT ve CoAP verilmektedir.
- MQTT, sensor verisi icin dogal publish/subscribe modelidir.
- AWS IoT Core, MQTT tabanli cihaz haberlesmesi ile dogrudan eslesir.
- REST sadece frontend ve servis API'leri icin kullanilarak sorumluluklar
  ayrilir.

### Video Analizi

Karar:

- Sentetik veya kayitli video kullanilacak.
- Video canli kamera gibi frontend'de oynatilir.
- Analiz sonuclari servis tarafinda simule edilir veya OpenCV ile basit sekilde
  uretilir.
- DynamoDB sadece kamera metadata'si ve analiz event'leri icin kullanilir.
- Video dosyalari AWS'te Amazon S3'te kaynak/arsiv olarak tutulur.
- Amazon Kinesis Video Streams, bu videolari canli kamera akisi gibi yonetmek
  icin kullanilir.

Lokal teknoloji:

- OpenCV
- FastAPI static/media endpoint'leri
- Local stream simulator

AWS karsiligi:

- Amazon S3
- Amazon Kinesis Video Streams
- AWS Rekognition
- Amazon SNS veya Lambda
- Amazon DynamoDB

Gerekce:

- Gercek kamera zorunlu degildir; PDF'te amac video akisi ve isleme mantigini
  gostermektir.
- Sentetik video, proje videosunda daha stabil demo verir.
- Kinesis Video Streams, PDF'teki AWS video akisi beklentisini karsilar.
- AWS Rekognition raporda bulut video isleme karsiligi olarak anlatilir.
- DynamoDB, videonun kendisini degil; recognition label, kisi sayisi, arac
  sayisi ve kalabalik seviyesi gibi zaman damgali analiz ciktilarini saklar.
- Rekognition Streaming Video Analysis, 30 Nisan 2026'dan itibaren yeni
  musterilere acik olmadigi icin Rekognition tarafinda stored video analysis
  kullanilacak; Kinesis ise akis yonetimi icin kullanilacak.
- AWS hesabinda Rekognition Streaming Video Analysis erisimi varsa, video analiz
  adimi Kinesis uzerinden streaming analysis olarak degistirilebilir. Bu durum
  lokal gelistirme mimarisini degistirmez.

### Makine Ogrenmesi

Karar:

- Scikit-learn
- Pandas
- Joblib
- Hibrit model yaklasimi: Scikit-learn + rule-based risk engine

Tahminler:

- Sicaklik tahmini
- Kalabalik seviyesi tahmini
- Risk skoru
- Oneri metni

AWS karsiligi:

- Amazon SageMaker
- AWS Lambda

Gerekce:

- PDF'te Scikit-learn ve SageMaker gecmektedir.
- Basit ama anlatilabilir bir model kurulabilir.
- Sentetik verilerde demo kararliligi icin risk skoru kural tabanli uretilecek.
- Lokal model dosyasi, ileride SageMaker endpoint veya Lambda fonksiyonu olarak
  konumlandirilabilir.

### Servisler Arasi Iletisim

Karar:

- REST API.

Gerekce:

- Basit, anlasilir ve raporda kolay anlatilir.
- Frontend ve ML servisi icin yeterlidir.

Kullanilmayan alternatifler:

- Event-driven yapi
- Message broker
- AWS SNS/SQS

Not:

- RabbitMQ/Kafka/SQS kullanilmayacak. Bu proje icin gereksiz
  karmasiklik yaratabilir.

### Lokal Calisma

Karar:

- Docker Compose

Calisacak bilesenler:

- frontend
- iot-service
- video-analysis-service
- ml-analytics-service
- dynamodb-local
- mosquitto

### AWS'e Tasima Plani

AWS karsiliklari:

- Frontend: S3 + CloudFront veya AWS Amplify
- Mikroservisler: ECS Fargate veya EC2 uzerinde Docker
- IoT: AWS IoT Core
- Video: Amazon S3 + Kinesis Video Streams + Rekognition Video + Lambda/SNS + DynamoDB
- ML: SageMaker veya Lambda
- Veritabani: Amazon DynamoDB

## Alinan Kararlar

- Proje tek frontend ve uc mikroservisten olusacak.
- Her mikroservisin kendi DynamoDB tablolari olacak.
- Veriler sentetik uretilebilir.
- IoT Service sadece sensor verisinden sorumlu olacak.
- Video Analysis Service sadece kamera/video ve analiz ciktisindan sorumlu olacak.
- ML Analytics Service, IoT ve Video servislerinden API ile veri alip tahmin
  uretecek.
- Backend servisleri Python + FastAPI ile gelistirilecek.
- Frontend React + Vite + TypeScript + Tailwind CSS ile gelistirilecek.
- Frontend veri yonetimi icin TanStack Query, grafikler icin Recharts, harita
  icin Leaflet + OpenStreetMap kullanilacak.
- Frontend servisleri dogrudan REST API ile cagiracak.
- Canli gorunum icin polling kullanilacak.
- Veritabani karari DynamoDB olacak.
- IoT sensor verileri MQTT ile alinacak.
- Lokal calisma Docker Compose ile yapilacak.
- Kod once lokal Docker Compose ile calisacak; AWS karsiliklari ayni mimari
  uzerinden tasarlanacak.

## Kodlamaya Baslamadan Once Netlestirilecekler

Ana modul sinirlari ve teknoloji kararlari netlestirilmistir. Kodlamaya
baslamadan once asagidaki proje organizasyonu kararlarinin alinmasi yeterlidir:

- Her servis ayri repository olarak mi kalacak, yoksa monorepo icine mi alinacak?
- Kimlik dogrulama olacak mi?
- AWS deployment gercekten yapilacak mi, yoksa raporda AWS'e tasima plani olarak
  mi anlatilacak?

## Onerilen Sonraki Adim

Modul sinirlari kilitlendigi icin sonraki adim uygulama iskeletini kurmaktir:

1. Repository/klasor organizasyonunu belirle.
2. Docker Compose yapisini kur.
3. DynamoDB Local ve Mosquitto servislerini ekle.
4. Ortak bolge listesini ve environment degiskenlerini tanimla.
5. IoT Service iskeletiyle basla.
6. Frontend dashboard'u IoT verisine bagla.
7. Video Service'i ekle.
8. ML Analytics Service'i en son bagla.
