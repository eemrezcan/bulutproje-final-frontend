# IoT Service - Modul Tasarimi

Bu dokuman, Akilli Sehir Yonetim Platformu icindeki IoT Service modulunun
kapsamini, teknoloji kararlarini ve veri akisini netlestirir.

## PDF Beklentisi

PDF'teki Proje 7 basligi asagidaki beklentileri verir:

- IoT cihazlari uzerinden veri toplama
- Akilli sehir uygulamasi gelistirme
- MQTT veya CoAP gibi IoT protokolleri kullanma
- AWS IoT Core, Lambda gibi bulut servisleriyle veri gonderme ve analiz etme
- Cihaz yonetimi, raporlama ve gercek zamanli gorsellestirme

Bu projede IoT Service, bu beklentileri akilli sehir sensorleri uzerinden
karsilayacaktir.

## Modul Amaci

IoT Service, sehirdeki sentetik IoT sensorlerinden veri toplar, veriyi saklar,
temel analizleri yapar ve frontend'e gosterilecek API'leri sunar.

Gercek fiziksel cihaz kullanmak zorunlu degildir. Bu nedenle proje kapsaminda
sensor simulatoru kullanilacaktir. Simulator, gercek cihaz gibi MQTT topic'lerine
veri yayinlayacaktir.

## Servis Siniri

IoT Service sadece sensor verilerinden sorumludur.

Yapar:

- Sensor cihazlarini ve bolgelerini yonetir.
- MQTT ile sensor verisi alir.
- Sicaklik, nem, hava kalitesi ve trafik yogunlugu verilerini saklar.
- Son sensor durumunu frontend'e sunar.
- Gecmis sensor verilerini grafikler icin sunar.
- Basit durum analizi yapar: normal, warning, critical.

Yapmaz:

- Kamera veya video islemez.
- Kalabalik tespiti yapmaz.
- ML tahmini uretmez.
- Video veya ML servislerinin veritabanina baglanmaz.

## Teknoloji Kararlari

### Backend

Karar:

- Python
- FastAPI
- Uvicorn

Gerekce:

- PDF'te Python desteklenen backend dilleri arasinda yer alir.
- FastAPI ile REST endpoint'leri ve Swagger dokumani hizli uretilir.
- Python, MQTT client ve AWS SDK entegrasyonlari icin uygundur.

### IoT Protokolu

Karar:

- MQTT kullanilacak.

Gerekce:

- PDF'te MQTT acikca IoT protokolleri arasinda verilmistir.
- Sensor verisi icin publish/subscribe modeli dogaldir.
- Lokal ortamda Mosquitto ile, AWS ortaminda AWS IoT Core ile eslestirilebilir.

CoAP karari:

- CoAP kullanilmayacak.
- Raporun alternatif protokol bolumunde kisaca anlatilabilir.

### Lokal MQTT Broker

Karar:

- Mosquitto MQTT Broker

Gerekce:

- Lokal Docker Compose icinde kolay calisir.
- Sensor simulatoru, gercek cihaz gibi Mosquitto topic'lerine veri yayinlar.
- IoT Service bu topic'lere subscribe olur.

### AWS Karsiligi

Karar:

- AWS IoT Core
- AWS Lambda
- Amazon DynamoDB

AWS akisi:

```text
Sensor veya simulator
  -> MQTT
  -> AWS IoT Core
  -> IoT Rule
  -> Lambda
  -> DynamoDB
```

Gerekce:

- AWS IoT Core, MQTT tabanli cihaz haberlesmesini destekler.
- AWS IoT Rules, gelen mesajlari Lambda veya DynamoDB gibi servislere
  yonlendirebilir.
- DynamoDB, sensor olcumlerini zaman sirali event verisi olarak saklamak icin
  uygundur.

### Veritabani

Karar:

- Lokal: DynamoDB Local
- AWS: Amazon DynamoDB

Tablolar:

- `iot_sensors`
- `iot_sensor_readings`

`iot_sensors`:

| Alan | Aciklama |
| --- | --- |
| `sensor_id` | Partition key |
| `zone` | Sensorun bulundugu sehir bolgesi |
| `name` | Sensor adi |
| `status` | active, passive, maintenance |
| `latitude` | Harita icin enlem |
| `longitude` | Harita icin boylam |

`iot_sensor_readings`:

| Alan | Aciklama |
| --- | --- |
| `sensor_id` | Partition key |
| `timestamp` | Sort key |
| `zone` | Bolge adi |
| `temperature` | Sicaklik |
| `humidity` | Nem |
| `air_quality_index` | Hava kalitesi |
| `traffic_level` | Trafik yogunlugu |
| `status_level` | normal, warning, critical |

GSI onerisi:

- Index adi: `zone-timestamp-index`
- Partition key: `zone`
- Sort key: `timestamp`

Bu index, frontend'de bolge bazli gecmis grafikler icin kullanilir.

## Sensor Bolgeleri

Proje kapsaminda 5 sehir noktasi kullanilacaktir:

- Meydan
- Otogar
- Kampus
- Hastane
- Sanayi

Her bolgede bir sensor cihazi varmis gibi davranilacaktir.

## MQTT Topic Tasarimi

Telemetry topic:

```text
smart-city/iot/{zone}/{sensor_id}/telemetry
```

Ornek:

```text
smart-city/iot/meydan/sensor_meydan_01/telemetry
```

Mesaj payload ornegi:

```json
{
  "sensor_id": "sensor_meydan_01",
  "zone": "Meydan",
  "temperature": 31.4,
  "humidity": 42,
  "air_quality_index": 87,
  "traffic_level": 64,
  "timestamp": "2026-05-27T15:30:00"
}
```

## Lokal Calisma Akisi

```text
Sensor Simulator
  -> MQTT publish
  -> Mosquitto Broker
  -> IoT Service MQTT Consumer
  -> DynamoDB Local
  -> IoT Service REST API
  -> Frontend
```

Sensor simulatoru, IoT Service icinde background worker olarak calisacaktir.
Bu worker belirli araliklarla sentetik sensor verisi uretip Mosquitto'ya MQTT
mesaji yayinlayacaktir. IoT Service'in MQTT consumer bileseni de ayni topic'leri
dinleyip veriyi DynamoDB Local'a kaydedecektir.

Bu yapi, tek servis icinde kalmasina ragmen gercek cihaz akisini taklit eder:
veri REST ile olusturulmaz, MQTT uzerinden sisteme girer.

## Frontend'e Sunulacak API'ler

```text
GET  /health
GET  /sensors
GET  /sensors/{sensor_id}
GET  /readings/latest
GET  /readings?sensor_id={sensor_id}&limit=50
GET  /zones/{zone}/readings?limit=50
POST /simulator/start
POST /simulator/stop
```

Not:

- Sensor verisinin sisteme girisi REST ile degil MQTT ile olur.
- REST endpoint'leri frontend'in veri okumasi ve simulatoru kontrol etmesi icin
  vardir.

## Frontend Ekran Karsiliklari

IoT modulu frontend'de su alanlari besler:

- Sehir sensor kartlari
- Son sicaklik, nem, hava kalitesi ve trafik degeri
- Sensor durum etiketi: normal, warning, critical
- Bolge bazli sensor gecmis grafikleri
- Haritada sensor noktalarinin gosterimi

## Analiz Mantigi

IoT Service, ML tahmini yapmaz. Ancak gelen sensor verisi icin basit durum
siniflandirmasi yapabilir:

```text
normal   -> degerler kabul edilebilir aralikta
warning  -> hava kalitesi veya trafik yukseliyor
critical -> hava kalitesi cok kotu veya trafik cok yuksek
```

Bu analiz, PDF'teki "verilerin analiz edilmesi" beklentisini IoT modulu seviyesinde
basit ve anlasilir sekilde karsilar.

ML Analytics Service ise bu verileri daha sonra kullanarak tahmin uretir.

## Net Karar

IoT modulu icin dogru karar:

- MQTT mutlaka kullanilacak.
- Lokal ortamda Mosquitto kullanilacak.
- AWS karsiliginda AWS IoT Core anlatilacak ve gerekiyorsa entegre edilecek.
- Veritabani DynamoDB olacak.
- Veriler sentetik olacak ama gercek cihaz mimarisini taklit edecek.
- Frontend veriyi REST API uzerinden okuyacak.

Bu yapi, PDF'teki IoT cihazlarindan veri toplama, MQTT protokolu, AWS IoT Core,
Lambda, cihaz yonetimi, raporlama ve gercek zamanli gorsellestirme beklentilerini
dogrudan karsilar.

## Kaynak Notlari

- AWS IoT Core, MQTT ve MQTT over WSS ile cihaz/client haberlesmesini destekler:
  https://docs.aws.amazon.com/iot/latest/developerguide/protocols.html
- AWS IoT Rules, gelen IoT mesajlarini Lambda veya DynamoDB gibi servislere
  yonlendirebilir:
  https://docs.aws.amazon.com/iot/latest/developerguide/iot-rule-actions.html
- DynamoDB Local, gelistirme ve test icin lokal ortamda kullanilabilir:
  https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
