# Mikroservis Raporlari - Ortak Stil Rehberi

Bu rehber, IoT, Video Analysis ve ML Analytics raporlarinin ayni akademik
duzende hazirlanmasi icin kullanilir. Nihai cikti once DOCX olarak uretilir,
ardindan render kontrolunden gecirilerek PDF'e donusturulur.

## Genel Format Karari

Raporlar IEEE'ye yakin teknik rapor duzeninde, ancak ders teslimi icin daha
okunabilir tek kolon yapida hazirlanacaktir. Ornek rapordaki kapak, icindekiler,
numarali bolumler, tablo agirlikli teknik anlatim ve kaynakca yaklasimi
korunur.

| Ozellik | Karar |
| --- | --- |
| Dil | Turkce |
| Cikti | DOCX kaynak + PDF teslim kopyasi |
| Sayfa boyutu | Letter veya A4; DOCX render sonucuna gore tek karar verilecek |
| Kolon yapisi | Tek kolon |
| Hedef uzunluk | Her rapor icin 8-10 sayfa |
| Stil | Akademik, teknik, sade |
| Gorsel yogunlugu | Her raporda 1 mimari diyagram, 1 ekran goruntusu, 2-4 tablo |
| Teslim tarihi | Kapakta yer almayacak |
| Demo video linki | Bos alan olarak birakilacak |

## Kapak Bilgileri

Her raporun kapagi ayni kimlik bilgilerini kullanir. Proje adi ve kapsam
cumlesi ilgili mikroservise gore degisir.

| Alan | Deger |
| --- | --- |
| Ders | 3522 Bulut Bilisim |
| Ogrenci | Ahmet Emre Ozcan |
| Ogrenci No | 21290560 |
| Ogretim Elemani | Enver Bagci |
| Ana Proje | Akilli Sehir Yonetim Platformu |
| Demo Video Linki | Bos birakilacak |
| GitHub Linkleri | Frontend repo + ilgili mikroservis repo linki |

## Kapak Proje Basliklari

| Rapor | Kapak Basligi | Kapak Kapsam Cumlesi |
| --- | --- | --- |
| IoT | IoT ve Akilli Sehir Telemetri Mikroservisi | MQTT tabanli sensor verisi toplama, DynamoDB kaydi ve akilli sehir paneline REST API ile sunum |
| Video | Video Akisi ve Akilli Sehir Kamera Analizi Mikroservisi | Canli kamera akisi, video analiz eventleri ve AWS Rekognition tabanli stored analysis mimarisi |
| ML | Akilli Veri Analitigi ve Risk Tahmini Mikroservisi | IoT ve video servislerinden alinan verilerle bolge bazli risk skoru ve operasyon onerisi uretimi |

## Tipografi ve Yerlesim

- Basliklar numarali bolum yapisina uygun yazilir.
- Ana basliklar kisa, acik ve teknik olur.
- Paragraflar 4-6 satiri gecmeyecek sekilde bolunur.
- Tablo basliklari "Tablo N. ..." biciminde yazilir.
- Sekil basliklari "Sekil N. ..." biciminde yazilir.
- Kod, endpoint, tablo adi ve servis adi monospace bicimde verilir.
- Gereksiz renkli/suslu tasarim kullanilmaz; okunabilirlik onceliklidir.

## Standart Bolum Akisi

Her rapor su ana yapiyi izler:

1. Kapak
2. Icindekiler
3. Ozet
4. Anahtar Kelimeler
5. Giris
6. Kapsam
7. Mikroservis Amaci ve Kapsami
8. Kullanilan Teknolojiler
9. Sistem Mimarisi
10. Veri Modeli
11. API Tasarimi
12. Local Calisma Akisi
13. AWS Deployment Mimarisi
14. Guvenlik ve Servis Sinirlari
15. Test ve Dogrulama
16. Karsilasilan Sorunlar ve Cozumler
17. Ortak Platform ile Entegrasyon
18. Sonuc
19. Kaynaklar

## Ortak Tablo Tipleri

Her raporda asagidaki tablo tiplerinden uygun olanlar kullanilir:

| Tablo Tipi | Amac |
| --- | --- |
| Kapsam Eslesmesi | Ders final yonergesindeki beklentinin projedeki karsiligini gosterir |
| Teknoloji Tablosu | Kullanilan teknolojileri ve nedenlerini ozetler |
| Endpoint Tablosu | API yuzeyini okunur hale getirir |
| Local-AWS Karsilik Tablosu | Local demo ile AWS deploy mimarisini baglar |
| Test Tablosu | Smoke test ve dogrulama sonucunu kanitlar |

## Ortak Sekil Tipleri

Her raporda en az bir mimari sekil bulunur.

- IoT: Sensor -> MQTT -> API/Lambda -> DynamoDB -> Frontend akisi
- Video: Kamera -> Video API -> analiz eventi -> DynamoDB -> Frontend akisi
- ML: IoT API + Video API -> ML Service -> prediction -> DynamoDB -> Frontend akisi
- Ortak: CloudFront -> ECS servisleri -> DynamoDB tablolari

## Gorsel Kullanimi

Chrome uzerinden alinacak ekran goruntuleri raporlara kanit olarak eklenir.

| Ekran | Kullanilacak Rapor |
| --- | --- |
| Dashboard genel gorunum | Her raporda ortak platform baglami icin kisa kullanilabilir |
| IoT ekrani | IoT raporu |
| Video canli kamera ekrani | Video raporu |
| ML Analytics ekrani | ML raporu |

## Yazim Ilkeleri

- "Backendleri tek yere koyduk" gibi yanlis mimari ifade kullanilmaz.
- FastAPI servisleri API katmani olarak anlatilir.
- Her mikroservisin ayri deploy edildigi ve kendi veri sinirina sahip oldugu
  vurgulanir.
- DynamoDB secimi video raporunda ozellikle savunulur: video dosyasi DB'de
  degil, sadece analiz eventi DB'dedir.
- API Gateway kullanilmamasi eksiklik gibi degil, ileri gelistirme karari
  olarak anlatilir.

## DOCX/PDF Uretim Notu

Raporlar once DOCX olarak olusturulacak. Her DOCX render edilip sayfa
goruntuleri kontrol edilecek. Yerlesim hatasi, tablo tasmasi veya bozuk baslik
varsa DOCX duzeltilip yeniden render alinacak. PDF, onaylanan DOCX'ten
uretilecek.
