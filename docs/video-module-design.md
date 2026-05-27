# Video Analysis Service - Modul Tasarimi

Bu dokuman, Akilli Sehir Yonetim Platformu icindeki Video Analysis Service
modulunun kapsamini, teknoloji kararlarini ve veri akisini netlestirir.

## PDF Beklentisi

PDF'teki Proje 6 basligi asagidaki beklentileri verir:

- Video akislarini yonetme
- RTMP veya WebRTC gibi video akisi teknolojilerini kullanma
- AWS Rekognition, Azure Video Indexer veya Google Video Intelligence gibi
  video isleme API'leriyle analiz yapma
- Nesne tanima, etiketleme ve video uzerinden analiz ciktilari uretme
- Bulut tabanli video isleme cozumleri sunma

Bu projede Video Analysis Service, bu beklentileri akilli sehir kamera senaryosu
uzerinden karsilayacaktir.

## Modul Amaci

Video Analysis Service, sehirdeki kamera noktalarini yonetir, sentetik veya
kayitli videolari canli kamera akisi gibi frontend'e sunar ve bu videolar icin
analiz sonuclari uretir.

Gercek kamera baglantisi zorunlu degildir. Proje kapsaminda stabil demo icin
sentetik veya kayitli MP4 videolar kullanilacaktir. Bu videolar tekrar tekrar
stream edilerek canli kamera izlenimi verilecektir.

## Servis Siniri

Video Analysis Service sadece kamera ve video analizinden sorumludur.

Yapar:

- Kamera noktalarini yonetir.
- Sentetik veya kayitli videolari canli yayin gibi sunar.
- Video uzerinden analiz event'leri uretir.
- Kisi sayisi, arac sayisi, hareket yogunlugu, kalabalik seviyesi ve recognition
  label'lari uretir.
- Analiz sonuclarini DynamoDB'ye kaydeder.
- Frontend'e kamera listesi, stream URL ve analiz sonuclari sunar.

Yapmaz:

- IoT sensor verisi toplamaz.
- Sicaklik, nem veya hava kalitesi verisi uretmez.
- ML tahmini yapmaz.
- Video dosyasini DynamoDB'de saklamaz.
- Diger servislerin veritabanina baglanmaz.

## Teknoloji Kararlari

### Backend

Karar:

- Python
- FastAPI
- Uvicorn

Gerekce:

- PDF'te Python desteklenen backend dilleri arasinda yer alir.
- FastAPI ile kamera ve analiz endpoint'leri hizli gelistirilir.
- Python, OpenCV ve AWS SDK entegrasyonlari icin uygundur.

### Video Kaynagi

Karar:

- Lokal ortamda sentetik veya kayitli MP4 video kullanilacak.
- AWS ortaminda MP4 video dosyalari Amazon S3'te duracak.
- S3'teki video, bir stream producer tarafindan loop edilerek Kinesis Video
  Streams'e canli kamera akisi gibi gonderilecek.
- Frontend bu akisi canli kamera gibi oynatacak.

Gerekce:

- Gercek kamera kullanmadan stabil demo yapilabilir.
- PDF'teki video akisi ve isleme mantigi gosterilebilir.
- Video dosyasi degismese bile analiz event'leri zaman damgali olarak
  uretilecegi icin sistem canli gibi davranir.

### Video Akisi Teknolojisi

Karar:

- AWS tarafinda ana akis teknolojisi Amazon Kinesis Video Streams olacak.
- Kinesis uzerindeki akis frontend'e HLS veya WebRTC playback olarak sunulacak.
- Lokal ortamda ayni fikir, MP4 dosyasinin loop edilmesiyle simule edilecek.

Gerekce:

- PDF'te AWS icin Kinesis Video Streams acikca verilmistir.
- PDF'te RTMP ve WebRTC video akisi teknolojileri olarak verilmistir.
- Kinesis Video Streams, WebRTC destegi ve browser playback secenekleriyle bu
  beklentiye daha iyi oturur.
- Bu projede amac gercek kamera kurmak degil, video akis yonetimini gostererek
  sentetik videoyu canliymis gibi sunmaktir.

### Lokal Video Analizi

Karar:

- OpenCV kullanilacak.
- Analiz ciktilari kontrollu sentetik degerlerle desteklenebilir.

Gerekce:

- OpenCV ile temel frame okuma, hareket yogunlugu veya basit goruntu analizi
  yapilabilir.
- Kisi/arac sayisi gibi degerler, demo kararliligi icin kontrollu sentetik olarak
  uretilebilir.
- Bu yapi, AWS Rekognition'a gecis icin iyi bir lokal karsilik sunar.

### AWS Karsiligi

Karar:

- Video kaynak/arsiv: Amazon S3
- Video akis yonetimi: Amazon Kinesis Video Streams
- Stream producer: GStreamer/FFmpeg tabanli producer veya Kinesis Video Streams
  Producer SDK
- Video analizi: Amazon Rekognition Video stored video analysis
- Analiz tamamlanma bildirimi: Amazon SNS
- Sonuc isleme: AWS Lambda
- Analiz sonucu kaydi: Amazon DynamoDB

AWS akisi:

```text
Kayitli veya sentetik MP4
  -> Amazon S3
  -> Stream Producer
  -> Amazon Kinesis Video Streams
  -> Frontend playback

Amazon S3 video
  -> Amazon Rekognition Video stored video analysis
  -> Amazon SNS
  -> AWS Lambda
  -> DynamoDB analysis events
  -> Video Analysis Service API
  -> Frontend analysis panel
```

Gerekce:

- Amazon S3, kayitli veya sentetik MP4 videolarin kaynak/arsiv noktasi olarak
  kullanilir.
- Kinesis Video Streams, PDF'teki gercek zamanli video akisi yonetimi ve AWS
  platform beklentisini karsilar.
- Rekognition Video stored video analysis, S3'te duran videolar uzerinde
  etiketleme ve nesne/aktivite analizi icin PDF'teki AWS karsiligidir.
- Rekognition Video stored video islemleri asenkron calisir. Analiz tamamlaninca
  SNS bildirimi uzerinden Lambda tetiklenebilir ve sonuc DynamoDB'ye yazilabilir.
- DynamoDB, video analiz sonuclarini zaman damgali event olarak saklamak icin
  uygundur.

Not:

- DynamoDB video dosyalarini saklamak icin kullanilmaz.
- DynamoDB sadece kamera metadata'si ve analiz event'leri icin kullanilir.
- Rekognition Streaming Video Analysis, 30 Nisan 2026 itibariyla yeni
  musterilere acik olmadigi icin Rekognition tarafinda stored video analysis
  secilecektir. Kinesis yine video akis yonetimi icin ana AWS servisidir.
- AWS hesabinda Rekognition Streaming Video Analysis erisimi varsa alternatif
  olarak Kinesis Video Streams uzerinden streaming analysis yapilabilir.
- Bu alternatif, lokal mimariyi degistirmez. Lokal ortamda yine loop edilen MP4,
  OpenCV/sentetik analiz ciktilari ve DynamoDB Local kullanilir. Degisen kisim
  sadece AWS'teki analiz adaptoru olur.

Kosullu AWS alternatifi:

```text
Kayitli veya sentetik MP4
  -> Amazon S3
  -> Stream Producer
  -> Amazon Kinesis Video Streams
  -> Rekognition Streaming Video Analysis
  -> DynamoDB analysis events
  -> Video Analysis Service API
  -> Frontend analysis panel
```

## Veritabani

Karar:

- Lokal: DynamoDB Local
- AWS: Amazon DynamoDB

Gerekce:

- Video dosyalari veritabaninda saklanmayacak.
- Veritabaninda kamera metadata'si ve zaman damgali analiz event'leri tutulacak.
- `camera_id` ve `timestamp` ile sorgulanan analiz kayitlari DynamoDB'nin
  partition key ve sort key modeline uygundur.
- AWS tarafinda Rekognition/Lambda ciktilarini DynamoDB'ye yazmak sade ve
  dogal bir entegrasyondur.
- PDF'te video modulu icin MongoDB ve PostgreSQL ornek olarak verilse de bu
  projede AWS-native event store yaklasimi nedeniyle DynamoDB bilincli olarak
  secilmistir.

Alternatif:

- MongoDB, recognition label'lari ve analiz sonuclarini dokuman olarak saklamak
  icin uygun bir alternatiftir.
- PostgreSQL, iliskisel raporlama ve daha klasik tablo yapisi istenirse uygun
  bir alternatiftir.
- Bu projede ana karar DynamoDB olarak kalacaktir.

Tablolar:

- `video_cameras`
- `video_analysis_results`

`video_cameras`:

| Alan | Aciklama |
| --- | --- |
| `camera_id` | Partition key |
| `zone` | Kameranin bulundugu bolge |
| `name` | Kamera adi |
| `stream_url` | Frontend'in oynatacagi video/stream yolu |
| `status` | active, passive, maintenance |
| `latitude` | Harita icin enlem |
| `longitude` | Harita icin boylam |

`video_analysis_results`:

| Alan | Aciklama |
| --- | --- |
| `camera_id` | Partition key |
| `timestamp` | Sort key |
| `zone` | Bolge adi |
| `people_count` | Tespit edilen veya simule edilen kisi sayisi |
| `vehicle_count` | Tespit edilen veya simule edilen arac sayisi |
| `motion_level` | low, medium, high |
| `crowd_level` | low, medium, high, critical |
| `recognition_labels` | crowd, traffic, vehicle, normal gibi etiketler |

GSI onerisi:

- Index adi: `zone-timestamp-index`
- Partition key: `zone`
- Sort key: `timestamp`

Bu index, ML servisinin ve frontend'in bolge bazli video analiz gecmisini
okumasi icin kullanilir.

## Kamera Bolgeleri

IoT moduluyle ayni sehir bolgeleri kullanilacaktir:

- Meydan
- Otogar
- Kampus
- Hastane
- Sanayi

Her bolgede bir kamera varmis gibi davranilacaktir.

## Lokal Calisma Akisi

```text
Synthetic veya kayitli MP4
  -> Local stream simulator
  -> Frontend video player/live view
  -> Video Analysis Service analyzer/OpenCV
  -> DynamoDB Local
  -> Video Analysis Service REST API
  -> Frontend analiz paneli
```

Video analyzer, loop edilen video uzerinden belirli araliklarla her kamera icin
analiz event'i uretir. Bu event'ler DynamoDB Local'a yazilir. Frontend hem
canli kamera gorunumunu oynatir hem de son analiz sonucunu API uzerinden okur.

## Frontend'e Sunulacak API'ler

```text
GET  /health
GET  /cameras
GET  /cameras/{camera_id}
GET  /cameras/{camera_id}/stream
GET  /analysis/latest
GET  /analysis?camera_id={camera_id}&limit=50
GET  /zones/{zone}/analysis?limit=50
POST /analysis/generate
```

Not:

- `/cameras/{camera_id}/stream` endpoint'i video dosyasini veya stream URL'ini
  verir.
- Analiz sonuclari DynamoDB'den okunur.
- Video dosyasinin kendisi DynamoDB'de tutulmaz.

## Frontend Ekran Karsiliklari

Video modulu frontend'de su alanlari besler:

- Kamera listesi
- Canli kamera gibi oynayan video kartlari
- Son recognition label'lari
- Kisi sayisi
- Arac sayisi
- Kalabalik seviyesi
- Hareket yogunlugu
- Bolge bazli analiz gecmisi grafikleri

## Analiz Mantigi

Video Analysis Service, ML tahmini yapmaz. Sadece o anki video durumunu analiz
eder.

Uretilecek degerler:

```text
people_count       -> kisi sayisi
vehicle_count      -> arac sayisi
motion_level       -> low, medium, high
crowd_level        -> low, medium, high, critical
recognition_labels -> crowd, traffic, vehicle, normal, incident
```

ML Analytics Service daha sonra bu analiz ciktilarini kullanarak kalabalik
tahmini veya risk skoru uretebilir.

## Net Karar

Video modulu icin karar:

- Gercek kamera yerine sentetik veya kayitli MP4 video kullanilacak.
- S3 video kaynagi/arsivi olacak.
- Kinesis Video Streams, videoyu canli kamera akisi gibi yonetmek icin ana AWS
  servisi olacak.
- Frontend videoyu canli kamera gibi gosterecek.
- Lokal analiz OpenCV ve kontrollu sentetik analiz ciktilariyla uretilecek.
- DynamoDB sadece kamera metadata'si ve analiz event'leri icin kullanilacak.
- Video dosyasi DynamoDB'de tutulmayacak.
- AWS karsiliginda Amazon S3 + Kinesis Video Streams + Rekognition Video
  stored analysis + SNS/Lambda + DynamoDB anlatilacak.
- AWS hesabinda Rekognition Streaming Video Analysis erisimi varsa, analiz
  adimi Kinesis uzerinden streaming analysis olarak degistirilebilir.
- Bu secenek yerel gelistirme kararlarini degistirmez; sadece AWS deployment
  seviyesinde fark yaratir.

Bu yapi, PDF'teki video akisi, video isleme, nesne tanima, etiketleme ve bulut
tabanli video analiz beklentilerini karsilar.

## Kaynak Notlari

- Amazon Rekognition Video, kayitli videolar uzerinde analiz yapabilir:
  https://docs.aws.amazon.com/rekognition/latest/dg/video.html
- Rekognition Video analiz sonuclari zaman damgali label ve tespit bilgileri
  uretebilir:
  https://docs.aws.amazon.com/rekognition/latest/dg/labels.html
- Rekognition stored video label detection, S3'teki video dosyasi uzerinden
  asenkron baslatilir:
  https://docs.aws.amazon.com/cli/latest/reference/rekognition/start-label-detection.html
- Rekognition Streaming Video Analysis, 30 Nisan 2026'dan itibaren yeni
  musterilere acik degildir:
  https://docs.aws.amazon.com/rekognition/latest/dg/rekognition-availability-changes.html
- Kinesis Video Streams gercek zamanli video stream icin
  kullanilabilir:
  https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/what-is-kinesis-video.html
- Kinesis Video Streams WebRTC ile gercek zamanli medya akisi saglayabilir:
  https://docs.aws.amazon.com/kinesisvideostreams-webrtc-dg/latest/devguide/webrtc-ingestion.html
- Kinesis Video Streams Producer SDK/GStreamer eklentisi, video stream'i Kinesis'e
  gondermek icin kullanilabilir:
  https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/examples-gstreamer-plugin.html
