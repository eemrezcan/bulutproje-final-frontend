# ML Analytics Service - Modul Tasarimi

Bu dokuman, Akilli Sehir Yonetim Platformu icindeki ML Analytics Service
modulunun kapsamini, teknoloji kararlarini ve veri akisini netlestirir.

## PDF Beklentisi

PDF'teki Proje 3 basligi asagidaki beklentileri verir:

- Makine ogrenmesi modeli gelistirme
- Bulut ortaminda veri isleme ve modelleme
- Scikit-learn, TensorFlow, PyTorch veya benzeri kutuphaneleri kullanma
- AWS SageMaker veya Lambda gibi servislerle model egitimi/dagitimi yapma
- Veriden bilgi cikarma ve tahminlerde bulunma

Bu projede ML Analytics Service, IoT ve Video servislerinden aldigi verilerle
sicaklik tahmini, kalabalik tahmini ve risk skoru uretir.

## Modul Amaci

ML Analytics Service, akilli sehir verilerini karar destek katmanina donusturur.
Bu servis ham veri uretmez. IoT ve Video servislerinin REST API'lerinden ozet
verileri alir, bu verileri bolge ve zaman bazinda birlestirir, tahmin uretir ve
sonuclari frontend'e sunar.

## Servis Siniri

ML Analytics Service sadece tahmin ve karar destekten sorumludur.

Yapar:

- IoT Service API'sinden sicaklik, nem, hava kalitesi ve trafik verisi alir.
- Video Analysis Service API'sinden kisi sayisi, arac sayisi, kalabalik seviyesi
  ve recognition label verisi alir.
- Verileri bolge ve zaman bazinda ozelliklere donusturur.
- Sicaklik tahmini uretir.
- Kalabalik seviyesi tahmini uretir.
- Risk skoru ve oneriler uretir.
- Tahmin sonuclarini kendi DynamoDB tablosuna kaydeder.
- Frontend'e tahmin ve risk API'leri sunar.

Yapmaz:

- Sensor verisi uretmez.
- MQTT dinlemez.
- Kamera veya video islemez.
- OpenCV veya Rekognition calistirmaz.
- IoT veya Video servislerinin veritabanina dogrudan baglanmaz.

## Teknoloji Kararlari

### Backend

Karar:

- Python
- FastAPI
- Uvicorn

Gerekce:

- PDF'te Python desteklenen backend dilleri arasinda yer alir.
- ML ekosistemi icin Python en uygun secimdir.
- FastAPI, tahmin endpoint'lerini ve Swagger dokumantasyonunu hizli sekilde
  uretir.

### Makine Ogrenmesi

Karar:

- Scikit-learn
- Pandas
- Joblib
- Hibrit model yaklasimi: Scikit-learn + rule-based risk engine

Gerekce:

- PDF'te Scikit-learn acikca verilmistir.
- Sentetik veriyle calisildigi icin tamamen ML'e dayali kararlar demo sirasinda
  tutarsiz olabilir.
- Scikit-learn kullanimi, "makine ogrenmesi modeli gelistirme" beklentisini
  karsilar.
- Risk skoru ve oneriler rule-based uretildiginde demo daha kararli ve
  aciklanabilir olur.

## Model Yaklasimi

Bu modulde iki farkli karar uretim yontemi kullanilacaktir:

### Scikit-learn Modelleri

1. Sicaklik tahmini

Girdiler:

- Gecmis sicaklik
- Nem
- Saat
- Bolge

Cikti:

- 1 saat sonraki tahmini sicaklik

2. Kalabalik seviyesi tahmini

Girdiler:

- Kisi sayisi
- Arac sayisi
- Trafik seviyesi
- Saat
- Bolge

Cikti:

- `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

### Rule-Based Risk Engine

Risk skoru kontrollu ve aciklanabilir kurallarla uretilecektir.

Ornek mantik:

```text
kalabalik yuksekse risk artar
trafik yuksekse risk artar
hava kalitesi kotuyse risk artar
sicaklik cok yuksekse risk artar
```

Cikti:

- `risk_score`: 0-100
- `recommendation`: karar destek onerisi

## AWS Karsiligi

Karar:

- Model egitimi/dagitimi: Amazon SageMaker
- Basit inference alternatifi: AWS Lambda
- Tahmin sonucu kaydi: Amazon DynamoDB

AWS akisi:

```text
IoT Service API + Video Service API
  -> ML Analytics Service
  -> Feature extraction
  -> SageMaker endpoint veya Lambda inference
  -> Rule-based risk engine
  -> DynamoDB predictions
  -> Frontend
```

Gerekce:

- PDF'te AWS SageMaker ve Lambda verilmistir.
- Lokal ortamda Joblib ile kaydedilen Scikit-learn modeli, AWS ortaminda
  SageMaker endpoint olarak konumlandirilabilir.
- Daha kucuk deployment icin Lambda inference alternatifi kullanilabilir.

## Veritabani

Karar:

- Lokal: DynamoDB Local
- AWS: Amazon DynamoDB

Tablo:

- `ml_predictions`

`ml_predictions`:

| Alan | Aciklama |
| --- | --- |
| `zone` | Partition key |
| `prediction_timestamp` | Sort key |
| `prediction_for` | Tahminin hedef zamani |
| `predicted_temperature` | 1 saat sonraki sicaklik tahmini |
| `predicted_crowd_level` | LOW, MEDIUM, HIGH, CRITICAL |
| `risk_score` | 0-100 arasi risk skoru |
| `recommendation` | Karar destek onerisi |
| `input_summary` | Tahmine giren ozet IoT ve Video verileri |

Gerekce:

- Tahminler de zaman damgali event verisi gibi saklanir.
- `zone` ve `prediction_timestamp` ile bolge bazli tahmin gecmisi kolayca
  okunur.
- Frontend, son tahminleri ve gecmis risk trendlerini bu tablodan okuyabilir.

## Veri Akisi

```text
ML Analytics Service
  -> IoT Service REST API
  -> Video Analysis Service REST API
  -> Feature extraction
  -> Scikit-learn model
  -> Rule-based risk engine
  -> DynamoDB Local
  -> ML Service REST API
  -> Frontend
```

ML Service diger servislerin veritabanina dogrudan baglanmaz. Veri sadece
servis API'leri uzerinden alinir.

## Frontend'e Sunulacak API'ler

```text
GET  /health
POST /predictions/generate
GET  /predictions/latest
GET  /predictions?zone={zone}&limit=50
GET  /zones/{zone}/risk
GET  /model/status
POST /model/train
```

Not:

- `/model/train`, sentetik gecmis veriden modeli yeniden egitmek icin kullanilir.
- `/predictions/generate`, IoT ve Video servislerinden son verileri alarak yeni
  tahmin uretir.

## Frontend Ekran Karsiliklari

ML modulu frontend'de su alanlari besler:

- Bolge bazli risk skoru kartlari
- 1 saat sonraki sicaklik tahmini
- Kalabalik seviyesi tahmini
- Karar destek onerisi
- Risk trend grafigi
- Model durumu

## Net Karar

ML modulu icin karar:

- Scikit-learn gercekten kullanilacak.
- Sentetik gecmis veriden basit model egitilecek.
- Sicaklik ve kalabalik tahmini ML modeliyle uretilecek.
- Risk skoru ve oneriler rule-based engine ile uretilecek.
- Tahminler DynamoDB'de tutulacak.
- ML Service sadece IoT ve Video API'lerinden veri alacak.
- AWS karsiliginda SageMaker veya Lambda inference + DynamoDB anlatilacak.

Bu yapi, PDF'teki makine ogrenmesi modeli gelistirme, bulut uzerinde modelleme,
veriden bilgi cikarma ve tahmin uretme beklentilerini karsilar.
