# Mikroservis Raporu - Ortak Icerik Sablonu

Bu sablon IoT, Video Analysis ve ML Analytics raporlarinda ayni akademik
iskeleti kullanmak icin hazirlanmistir. Koseli parantezli alanlar rapor
uretilirken ilgili mikroservise gore doldurulur.

## Kapak

```text
3522 Bulut Bilisim

[RAPOR BASLIGI]

Ana Proje:
Akilli Sehir Yonetim Platformu

Kapsam:
[MIKROSERVIS KAPSAM CUMLESI]

Proje Sahibi: Ahmet Emre Ozcan
Ogrenci Numarasi: 21290560
Ogretim Elemani: Enver Bagci

Frontend Repo Linki: [FRONTEND_REPO_LINKI]
Mikroservis Repo Linki: [MIKROSERVIS_REPO_LINKI]
Demo Video Linki:
```

## Ozet

[Mikroservisin amaci, sistem icindeki gorevi, kullanilan temel teknolojiler,
AWS karsiliklari ve elde edilen sonuc 150-250 kelime araliginda ozetlenir.]

## Anahtar Kelimeler

[Akilli sehir], [mikroservis], [DynamoDB], [FastAPI], [ilgili AWS servisleri],
[ilgili module ozel kavramlari]

## 1. Giris

Bu bolumde akilli sehir problemi tanitilir. Ilgili mikroservisin bu problem
icindeki yeri aciklanir. Gerekirse tek frontend ve uc ayri mikroservis kararinin
genel nedeni kisaca belirtilir.

Beklenen anlatim:

- Hangi akilli sehir ihtiyacina cevap veriyor?
- Neden ayri mikroservis olarak tasarlandi?
- Frontend ile nasil iliskileniyor?
- AWS uzerinde hangi servislerle temsil ediliyor?

## 2. Proje Gereksinimi ve PDF Beklentisiyle Uyum

Bu bolum ders PDF'indeki proje maddesi ile uygulanmis sistem arasindaki bagi
kurar.

| Gereksinim | Projedeki Karsiligi |
| --- | --- |
| [PDF gereksinimi 1] | [Uygulamadaki teknik karsilik] |
| [PDF gereksinimi 2] | [Uygulamadaki teknik karsilik] |
| [PDF gereksinimi 3] | [Uygulamadaki teknik karsilik] |

## 3. Mikroservis Amaci ve Kapsami

Mikroservisin sorumluluk siniri net yazilir. Bu bolumde ozellikle su ayrim
vurgulanir:

- Servis neyi yapar?
- Servis neyi yapmaz?
- Hangi veriden sorumludur?
- Hangi API'leri sunar?
- Diger servislerle nasil haberlesir?

## 4. Kullanilan Teknolojiler

| Katman | Teknoloji | Kullanim Amaci |
| --- | --- | --- |
| Backend API | FastAPI | REST API ve servis is mantigi |
| Veri katmani | DynamoDB | Servise ait verilerin saklanmasi |
| Container | Docker | Local ve AWS deploy ortami |
| AWS API runtime | ECS Fargate | FastAPI servisinin container olarak calismasi |
| [Ozel katman] | [Teknoloji] | [Neden kullanildi] |

## 5. Sistem Mimarisi

Bu bolumde mikroservisin local ve AWS mimarisi anlatilir. Bir mimari sekil
eklenir.

Sekil taslagi:

```text
[Kaynak Sistem] -> [Mikroservis API/Consumer] -> [DynamoDB]
                                      |
                                   REST API
                                      |
                                  Frontend
```

Anlatilacak kararlar:

- Servisin API katmani ile veri/analiz katmani nasil ayrildi?
- Frontend hangi endpointleri kullanir?
- AWS tarafinda local mimarinin karsiliklari nelerdir?

## 6. Veri Modeli

Bu bolumde servis tablolari ve veri alanlari aciklanir.

| Tablo | Amac | Temel Alanlar |
| --- | --- | --- |
| `[TABLO_1]` | [Tablonun amaci] | [Alanlar] |
| `[TABLO_2]` | [Tablonun amaci] | [Alanlar] |

Kritik veri kararlari:

- Her mikroservis kendi tablosuna sahiptir.
- Diger servislerin tablosuna dogrudan erisim yoktur.
- Veri paylasimi REST API uzerinden yapilir.

## 7. API Tasarimi

| Endpoint | Metot | Amac |
| --- | --- | --- |
| `/health` | GET | Servis saglik kontrolu |
| `[ENDPOINT]` | `[METOT]` | `[AMAC]` |

Bu bolumde endpointlerin frontend ekranlariyla nasil eslestigi de aciklanir.

## 8. Local Calisma Akisi

Docker Compose ve local servisler anlatilir.

| Local Bilesen | Gorev |
| --- | --- |
| Frontend | Tek operasyon paneli |
| Mikroservis container | API ve servis is mantigi |
| DynamoDB Local | Local veri saklama |
| [Ozel local bilesen] | [Gorev] |

## 9. AWS Deployment Mimarisi

Bu bolum raporun en kritik bolumlerinden biridir. "Dogru isi dogru AWS
servisine yerlestirme" mantigi aciklanir.

| Bilesen | AWS Karsiligi | Neden |
| --- | --- | --- |
| Frontend | S3 + CloudFront | Statik React build ve HTTPS erisim |
| FastAPI servis | ECS Fargate | Container tabanli ayri mikroservis deployu |
| Veri katmani | DynamoDB | AWS-native, servis bazli veri saklama |
| [Ozel akis] | [AWS servisleri] | [Teknik gerekce] |

## 10. Guvenlik ve Servis Sinirlari

Bu bolumde IAM, servis sinirlari ve veri izolasyonu anlatilir.

- ECS task role ile servis yetkileri sinirlandirilir.
- Her servis yalnizca kendi DynamoDB tablosuna erisir.
- Frontend'in veritabani yoktur.
- Public erisim CloudFront uzerinden saglanir.
- CORS ve servis endpointleri kontrollu tutulur.

## 11. Test ve Dogrulama

| Kontrol | Sonuc |
| --- | --- |
| ECS service | `desired=1`, `running=1`, `pending=0` |
| `/health` | `status=ok` |
| Frontend ekran kontrolu | [Chrome smoke sonucu] |
| API veri kontrolu | [curl/API sonucu] |

Bu bolumde Chrome smoke test ve API testleri kisaca anlatilir.

## 12. Karsilasilan Sorunlar ve Cozumler

| Sorun | Cozum |
| --- | --- |
| [Sorun] | [Cozum] |

Bu bolumde sadece gercekten yasanmis ve teknik deger tasiyan sorunlar yer
alir. Gereksiz hata gunlugu gibi yazilmaz.

## 13. Ortak Platform ile Entegrasyon

Bu bolum her raporda ortak olur, ancak ilgili mikroservisin bakis acisiyla
yazilir.

Ortak anlatim:

- Tek frontend vardir.
- IoT, Video ve ML ayri mikroservislerdir.
- Her servis kendi veri sinirini korur.
- Frontend servisleri REST API ile cagirir.
- ML servisi IoT ve Video verisini REST API uzerinden kullanir.

## 14. Sonuc

Mikroservisin ders hedefini nasil karsiladigi, local demo ile AWS deployment
arasindaki bag ve gelecekte nasil gelistirilebilecegi ozetlenir.

## 15. Kaynaklar

Kaynaklar IEEE benzeri numarali liste olarak yazilir.

```text
[1] AWS Documentation, Amazon DynamoDB Developer Guide.
[2] AWS Documentation, Amazon ECS Developer Guide.
[3] FastAPI Documentation.
[4] [Mikroservise ozel AWS veya kutuphane dokumani]
```

## Raporlara Gore Doldurulacak Ozel Alanlar

| Rapor | PDF Projesi | Ozel Teknoloji/Akis |
| --- | --- | --- |
| IoT | Proje 7 - IoT ve Akilli Sehir Uygulamasi | MQTT, Mosquitto, AWS IoT Core, IoT Rule, Lambda |
| Video | Proje 6 - Video Akisi ve Isleme Uygulamasi | MJPEG demo akis, S3, Kinesis Video Streams, Rekognition Video, SNS |
| ML | Proje 3 - Akilli Veri Analitigi ve Makine Ogrenmesi | scikit-learn, pandas, joblib, risk engine, SageMaker/Lambda |
