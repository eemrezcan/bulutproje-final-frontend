# Demo Video Rehberi

Bu rehber, proje tanitim videosunda neyin hangi sirayla anlatilacagini ve
deploy kararlarinin neden bu sekilde verildigini ozetler.

## Demo Amaci

Akilli Sehir Yonetim Platformu; IoT sensor verisi, video analiz eventi ve ML
risk tahminini tek bir operasyon panelinde birlestirir. Frontend tek paneldir,
ancak backend tarafinda IoT, Video ve ML ayri mikroservis sinirlariyla deploy
edilmistir.

## Canli URL

```text
https://d1k4ey8nhx4dtb.cloudfront.net
```

## Kayit Oncesi Kontrol Listesi

| Kontrol | Beklenen Sonuc |
| --- | --- |
| CloudFront | `Deployed`, public URL acilir |
| ECS IoT Service | `desired=1`, `running=1`, `pending=0` |
| ECS Video Service | `desired=1`, `running=1`, `pending=0` |
| ECS ML Service | `desired=1`, `running=1`, `pending=0` |
| `/api/iot/health` | `status=ok` |
| `/api/video/health` | `status=ok` |
| `/api/ml/health` | `status=ok`, `model_ready=true` |
| IoT ekranı | 5 bolge icin son sensor olcumleri gorunur |
| Video ekranı | Canli MJPEG kamera akisi, araclar ve yayalar gorunur |
| ML Analytics | Karar ozeti, IoT sensor ozeti ve video analiz ozeti gorunur |

## Video Kayit Akisi

1. `Dashboard` ekranindan basla.
   - Amac: Tek panelden sehir genel durumunun izlendigini goster.
   - Gosterilecekler: API durum rozetleri, aktif sensor sayisi, aktif kamera
     sayisi, ML risk skoru, harita ve bolge riskleri.

2. `IoT` ekranina gec.
   - Amac: IoT mikroservisinin sensor verisini ayri servis olarak sundugunu
     goster.
   - Gosterilecekler: Hastane, Kampus, Meydan, Otogar ve Sanayi sensor
     kartlari; sicaklik, nem, AQI ve trafik degerleri.
   - Anlatim cumlesi: "Simulator sensor verisini dogrudan veritabanina degil,
     MQTT topic'e gonderir. Localde Mosquitto, AWS tarafinda IoT Core bu role
     karsilik gelir."

3. `Video` ekranina gec.
   - Amac: Video servisinin kamera akisi ve analiz eventlerini ayri sinirda
     tuttugunu goster.
   - Gosterilecekler: Kamera kartlari, canli kamera akisi, kisi/arac sayisi,
     kalabalik/hareket seviyeleri ve tanimlama etiketleri.
   - Not: Demo ekraninda gorulen akis sentetik MJPEG canli akistir. AWS
     mimarisinde video dosya/arsiv S3, canli akis yonetimi Kinesis Video
     Streams, analiz ise Rekognition Video stored analysis olarak anlatilir.

4. `ML Analytics` ekranina gec.
   - Amac: ML servisinin IoT ve Video servislerinden REST API ile veri alip
     risk tahmini urettigini goster.
   - Gosterilecekler: Ortalama risk, en riskli bolge, model/veri hatti, karar
     ozeti, IoT sensor ozeti ve video analiz ozeti.
   - Anlatim cumlesi: "ML servisi IoT veya Video veritabanina dogrudan
     baglanmaz; servis sinirlari REST API ile korunur."

5. Kisa mimari kapanis yap.
   - Frontend: S3 + CloudFront.
   - API servisleri: ECS Fargate.
   - Veri katmani: Her servisin kendi DynamoDB tablosu.
   - IoT veri alma: AWS IoT Core + IoT Rule + Lambda.
   - Video analiz: S3 + Rekognition Video + SNS + Lambda.
   - ML inference alternatifi: SageMaker veya Lambda.

## Deploy Karar Tablosu

| Bilesen | Deploy Edilen Yer | Neden |
| --- | --- | --- |
| Frontend | S3 + CloudFront | Statik React build icin dusuk maliyetli, hizli ve HTTPS public erisim saglar |
| IoT FastAPI | ECS Fargate | API katmani container olarak izole calisir; IoT servis siniri korunur |
| Video FastAPI | ECS Fargate | Kamera ve analiz API'si ayri container olarak deploy edilir |
| ML FastAPI | ECS Fargate | Tahmin API'si ayri servis olarak olceklenebilir |
| IoT verileri | DynamoDB | Sensor ve zaman serisi okuma/yazma icin AWS-native NoSQL secimi |
| Video analiz eventleri | DynamoDB | Video dosyasi degil, zaman damgali analiz eventleri tutulur |
| ML tahminleri | DynamoDB | Bolge bazli prediction kayitlari hizli okunur |
| IoT ingestion | AWS IoT Core + Rule + Lambda | MQTT tabanli sensor akisini AWS servisleriyle karsilar |
| Video stored analysis | S3 + Rekognition + SNS + Lambda | Video arsinleme, analiz ve sonuc isleme ayrilir |
| ML batch/inference alternatifi | Lambda veya SageMaker | Rapor/demo seviyesine gore maliyet ve karmasiklik dengelenir |

## Vurgulanacak Mimari Ilkeler

- Her modül ayri mikroservis gibi ele alindi.
- Her servisin kendi DynamoDB tablosu var.
- Servisler birbirinin veritabanina dogrudan baglanmiyor.
- Frontend'in veritabanı yok; sadece REST API cagiriyor.
- Local demo ve AWS deploy ayni mimari fikrin iki farkli ortami.
- AWS tarafinda amac "her seyi tek makineye koymak" degil, dogru isi dogru AWS
  servisine yerlestirmek.

## Son Bilinen Smoke Test

2026-05-31 tarihinde Chrome ile public CloudFront URL uzerinden kontrol edildi:

| Rota | Sonuc |
| --- | --- |
| `/dashboard` | 5 bolge gorunuyor, API hata mesaji yok |
| `/iot` | 5 bolge icin son sensor olcumleri gorunuyor |
| `/video` | `live.mjpg` canli akis gorunuyor, `<video>` player yok |
| `/ml` | Model/veri hatti, karar ozeti ve model girdisi gorunuyor |

## Demo Sonrasi

Demo veya video kaydi bittikten sonra maliyeti durdurmak icin ECS servis
desired count degerleri `0` yapilabilir. Tekrar demo icin ayni servisler
`1` desired count ile acilir.
