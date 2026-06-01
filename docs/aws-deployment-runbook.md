# AWS Deployment Runbook

Bu runbook, `smart-city` AWS CLI profili ile deploy adimlarini takip etmek icin
hazirlandi.

## Sabitler

| Alan | Deger |
| --- | --- |
| AWS profile | `smart-city` |
| Account ID | `775755739642` |
| Region | `eu-central-1` |
| Project prefix | `smart-city-final` |
| Default VPC | `vpc-078689129c6e00e93` |
| Subnetler | `subnet-09a346a6b81595930`, `subnet-0203d03407730c8c6`, `subnet-0d46c49a10b653222` |

## Kaynak Isimleri

| Kaynak | Isim |
| --- | --- |
| Frontend bucket | `smart-city-final-775755739642-frontend` |
| Video bucket | `smart-city-final-775755739642-video` |
| ECR IoT repo | `smart-city-final/iot-service` |
| ECR Video repo | `smart-city-final/video-service` |
| ECR ML repo | `smart-city-final/ml-service` |
| ECS cluster | `smart-city-final-cluster` |
| ALB | `smart-city-final-alb` |
| DynamoDB IoT sensors | `iot_sensors` |
| DynamoDB IoT readings | `iot_sensor_readings` |
| DynamoDB Video cameras | `video_cameras` |
| DynamoDB Video analysis | `video_analysis_results` |
| DynamoDB ML predictions | `ml_predictions` |
| DynamoDB zone GSI | `zone-timestamp-index` |

## Deploy Sirasi

1. S3 bucket'lari olustur. `[tamamlandi]`
2. ECR repository'lerini olustur. `[tamamlandi]`
3. DynamoDB tablolarini olustur. `[tamamlandi]`
4. IAM role ve policy'leri olustur. `[tamamlandi]`
5. Backend image'larini build edip ECR'a push et. `[tamamlandi]`
6. ECS cluster, task definition ve service'leri olustur. `[tamamlandi]`
7. ALB listener ve target group'lari bagla. `[tamamlandi]`
8. Frontend'i AWS env ile build edip S3'e yukle. `[tamamlandi]`
9. CloudFront distribution ve path routing kur. `[tamamlandi]`
10. IoT Core + IoT Rule + Lambda akisini kur. `[tamamlandi]`
11. Video S3/Rekognition/SNS/Lambda akisini hesap izinlerine gore kur. `[tamamlandi]`
12. ML inference icin Lambda veya SageMaker kararini uygulamaya al. `[tamamlandi]`
13. Smoke test ve rapor notlarini tamamla. `[tamamlandi]`

## Notlar

- Bu runbook kaynak olusturma sirasinda guncellenecek.
- CloudFront, ALB, ECS task'lari ve SageMaker gibi maliyetli kaynaklara gecmeden
  once kaynak sayisi ve amac tekrar kontrol edilmelidir.
- S3, ECR ve DynamoDB temel kaynaklari dusuk maliyetli ilk kurulum adimlaridir.

## Maliyet ve Gecici Kapatma Notu

2026-05-31 kontrolune gore aktif backend katmaninda 3 ECS Fargate task'i ve 1
Application Load Balancer calisiyor. Task boyutlari:

| Servis | vCPU | RAM |
| --- | ---: | ---: |
| IoT Service | 0.25 | 0.5 GB |
| Video Analysis Service | 0.5 | 1 GB |
| ML Analytics Service | 0.5 | 1 GB |
| Toplam | 1.25 | 2.5 GB |

Yaklasik saatlik maliyet:

| Kalem | Hesap | Yaklasik |
| --- | --- | ---: |
| Fargate vCPU | `1.25 * 0.04656 USD/saat` | `0.0582 USD/saat` |
| Fargate RAM | `2.5 * 0.00511 USD/saat` | `0.0128 USD/saat` |
| ALB saatlik | `1 * 0.027 USD/saat` | `0.0270 USD/saat` |
| ALB LCU | dusuk trafik icin en fazla `1 * 0.008 USD/saat` varsayildi | `0.0080 USD/saat` |
| Public IPv4 | `6 * 0.005 USD/saat` | `0.0300 USD/saat` |
| Toplam | Fargate + ALB + IPv4 | `~0.128-0.136 USD/saat` |

Bu kurulumun 24 saat acik kalmasi yaklasik `3.1-3.3 USD` eder. CloudWatch
Logs, ECR image storage, S3, DynamoDB on-demand ve dis veri transferi bu demo
trafik seviyesinde genelde cok kucuk ek kalemlerdir; yine de sifir kabul
edilmemelidir.

Demo yarina kalacaksa en guvenli kisa durdurma yontemi ECS servislerini
`desired-count=0` yapmaktir. Bu, Fargate task'larini ve task public IPv4
adreslerini kapatir; ALB DNS'i ve routing yapisi bozulmaz. ALB calismaya devam
ettigi icin ALB ve ALB public IPv4 maliyeti yazmaya devam eder.

### Gecici Olarak Backend Task'larini Kapat

```bash
AWS_CLI="${AWS_CLI:-/home/eemrezcan/.local/bin/aws}"
AWS_PROFILE="smart-city"
AWS_REGION="eu-central-1"
CLUSTER="smart-city-final-cluster"

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-iot-service \
  --desired-count 0

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-video-service \
  --desired-count 0

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-ml-service \
  --desired-count 0

"$AWS_CLI" ecs wait services-stable \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --services \
    smart-city-final-iot-service \
    smart-city-final-video-service \
    smart-city-final-ml-service
```

### Demo Icin Backend Task'larini Tekrar Ac

```bash
AWS_CLI="${AWS_CLI:-/home/eemrezcan/.local/bin/aws}"
AWS_PROFILE="smart-city"
AWS_REGION="eu-central-1"
CLUSTER="smart-city-final-cluster"

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-iot-service \
  --desired-count 1

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-video-service \
  --desired-count 1

"$AWS_CLI" ecs update-service \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service smart-city-final-ml-service \
  --desired-count 1

"$AWS_CLI" ecs wait services-stable \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --services \
    smart-city-final-iot-service \
    smart-city-final-video-service \
    smart-city-final-ml-service
```

Tekrar actiktan sonra kontrol:

```bash
ALB_URL="http://smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com"

curl "$ALB_URL/api/iot/health"
curl "$ALB_URL/api/video/health"
curl "$ALB_URL/api/ml/health"
```

### Demo Sonrasi Daha Agresif Kapatma

Application Load Balancer'in "stop" modu yoktur; maliyeti tamamen kesmek icin
ALB silinmelidir. Bu islem demo oncesi onerilmez, cunku ALB tekrar
olusturulursa DNS degisir ve task definition/env degerleri de guncellenmek
zorunda kalabilir.

Demo bittikten sonra ALB maliyetini de durdurmak icin once ECS servislerini
`desired-count=0` yap, sonra listener ve ALB'yi sil:

```bash
AWS_CLI="${AWS_CLI:-/home/eemrezcan/.local/bin/aws}"
AWS_PROFILE="smart-city"
AWS_REGION="eu-central-1"
ALB_ARN="arn:aws:elasticloadbalancing:eu-central-1:775755739642:loadbalancer/app/smart-city-final-alb/cd52a1aaa38469d7"

LISTENER_ARN="$("$AWS_CLI" elbv2 describe-listeners \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --load-balancer-arn "$ALB_ARN" \
  --query 'Listeners[0].ListenerArn' \
  --output text)"

"$AWS_CLI" elbv2 delete-listener \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --listener-arn "$LISTENER_ARN"

"$AWS_CLI" elbv2 delete-load-balancer \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --load-balancer-arn "$ALB_ARN"

"$AWS_CLI" elbv2 wait load-balancers-deleted \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --load-balancer-arns "$ALB_ARN"
```

Target group, ECS service, task definition, DynamoDB, ECR, S3 ve IAM kaynaklari
bu blokta silinmez. Bu sayede veri ve deploy kayitlari korunur; sadece calisan
backend compute/ALB maliyeti durdurulmus olur.

CloudFront'un "stop" modu yoktur. Demo sonrasinda CloudFront maliyetini de
durdurmak icin once distribution `Enabled=false` olacak sekilde disable edilmeli,
deploy tamamlandiktan sonra silinmelidir. CloudFront silinirse public frontend
domain'i de silinir; tekrar kurulumda yeni domain gelebilir.

## Olusturulan Temel Kaynaklar

| Kaynak | Durum | Not |
| --- | --- | --- |
| `smart-city-final-775755739642-frontend` | Olusturuldu | S3 public access block aktif |
| `smart-city-final-775755739642-video` | Olusturuldu | S3 public access block aktif |
| `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/iot-service` | Olusturuldu | scan on push aktif |
| `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/video-service` | Olusturuldu | scan on push aktif |
| `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/ml-service` | Olusturuldu | scan on push aktif |
| `iot_sensors` | Olusturuldu | DynamoDB on-demand |
| `iot_sensor_readings` | Olusturuldu | DynamoDB on-demand, `zone-timestamp-index` GSI |
| `video_cameras` | Olusturuldu | DynamoDB on-demand |
| `video_analysis_results` | Olusturuldu | DynamoDB on-demand, `zone-timestamp-index` GSI |
| `ml_predictions` | Olusturuldu | DynamoDB on-demand |

## Frontend ve CloudFront Durumu

| Kaynak | Deger |
| --- | --- |
| Frontend bucket | `smart-city-final-775755739642-frontend` |
| CloudFront distribution ID | `E2PS75E7V3QU2Y` |
| CloudFront domain | `d1k4ey8nhx4dtb.cloudfront.net` |
| Public frontend URL | `https://d1k4ey8nhx4dtb.cloudfront.net` |
| S3 origin access control | `E2I8J5XW6E4Z7E` |
| SPA rewrite function | `smart-city-final-spa-rewrite` |
| SPA rewrite function ARN | `arn:aws:cloudfront::775755739642:function/smart-city-final-spa-rewrite` |
| S3 origin | `smart-city-final-775755739642-frontend.s3.eu-central-1.amazonaws.com` |
| API origin | `smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com` |
| API path behavior | `/api/* -> ALB` |

Frontend build su AWS env degerleriyle alindi:

```text
VITE_IOT_API_URL=/api/iot
VITE_VIDEO_API_URL=/api/video
VITE_ML_API_URL=/api/ml
```

CloudFront davranislari:

| Path | Origin | Cache | Not |
| --- | --- | --- | --- |
| `/*` | S3 frontend bucket | `CachingOptimized` | React statik dosyalari |
| `/api/*` | ALB | `CachingDisabled` | IoT, Video ve ML API istekleri |

SPA route'lari icin distribution-wide custom error fallback kullanilmadi. Bunun
yerine sadece default frontend behavior uzerinde CloudFront Function ile
extension icermeyen non-API path'ler `/index.html` olarak rewrite edilir. Bu
sayede `/dashboard`, `/iot`, `/video`, `/ml` gibi React route'lari calisirken
`/api/*` endpoint'lerinin 404/500 gibi API cevaplari bozulmaz.

Video Service `PUBLIC_BASE_URL` degeri CloudFront HTTPS domain'ine alindi ve
ECS task definition `smart-city-final-video-service:2` olarak guncellendi:

```text
PUBLIC_BASE_URL=https://d1k4ey8nhx4dtb.cloudfront.net/api/video
```

CloudFront test endpointleri:

```text
https://d1k4ey8nhx4dtb.cloudfront.net/
https://d1k4ey8nhx4dtb.cloudfront.net/dashboard
https://d1k4ey8nhx4dtb.cloudfront.net/api/iot/health
https://d1k4ey8nhx4dtb.cloudfront.net/api/video/health
https://d1k4ey8nhx4dtb.cloudfront.net/api/ml/health
https://d1k4ey8nhx4dtb.cloudfront.net/api/video/cameras
```

Smoke test sonucu:

- CloudFront distribution status: `Deployed`
- CloudFront invalidation: `Completed`
- `/` ve `/dashboard`: `200 text/html`
- `/api/iot/health`: `status=ok`
- `/api/video/health`: `status=ok`
- `/api/ml/health`: `status=ok`, `model_ready=true`
- `/api/video/cameras/cam_meydan_01/stream`: `media_type=video/webm`, `mode=looped_synthetic_webm`, `playable=true`
- `/api/video/media/synthetic_city_loop.webm`: `200`, `content-type=video/webm`
- API 404 kontrolu: `/api/video/cameras/not-real/stream` -> `404 application/json`
- Headless Chrome kontrolu:
  - `/dashboard`: `h1=Dashboard`, console/page error yok
  - `/video`: `h1=Video`, video `readyState=4`, `error=null`, console/page error yok

## Final Smoke Test

2026-05-31 itibariyla genel deploy smoke testi:

| Kontrol | Sonuc |
| --- | --- |
| CloudFront distribution | `Deployed` |
| ECS IoT service | `desired=1`, `running=1`, `pending=0` |
| ECS Video service | `desired=1`, `running=1`, `pending=0` |
| ECS ML service | `desired=1`, `running=1`, `pending=0` |
| `/` | `200 text/html` |
| `/dashboard` | `200 text/html` |
| `/api/iot/health` | `status=ok` |
| `/api/video/health` | `status=ok` |
| `/api/ml/health` | `status=ok`, `model_ready=true` |
| IoT Core test reading | `sensor_meydan_01`, `status_level=warning` |
| Rekognition video result | `cam_meydan_01`, `recognition_labels` dolu |
| ML Lambda prediction | `5` bolge icin prediction yazildi |

2026-05-31 Chrome smoke revizyonu:

| Kontrol | Sonuc |
| --- | --- |
| Frontend AWS build | `npm run build:aws`; bundle API base path'leri `/api/iot`, `/api/video`, `/api/ml` |
| CloudFront invalidation | `I3NLUWQKG3C90RXEPY3GUHEDUY`, `Completed` |
| Dashboard | Chrome'da `h1=Dashboard`, API hata mesaji yok, 5 bolge gorunuyor |
| IoT ekranı | Hastane, Kampus, Meydan, Otogar ve Sanayi icin son sensor olcumleri gorunuyor |
| Video ekranı | 5 kamera listeleniyor; kamera stream'leri `synthetic_cam_<camera_id>.webm` olarak ayrildi |
| Video player | Chrome'da `readyState=4`, `error=null` |
| ML Analytics | Model/veri hatti, karar ozeti, IoT sensor ozeti ve video analiz ozeti gorunuyor |
| Console | Dashboard, IoT, Video ve ML rotalarinda app console error yok |

Bu revizyonda frontend'in yanlislikla `localhost:8001/8002/8003`
endpointlerine derlenmesi duzeltildi. AWS deploy icin `build:aws` script'i
kullanilmalidir.

2026-05-31 video canli akis revizyonu:

| Kontrol | Sonuc |
| --- | --- |
| Video image digest | `sha256:4ffa2664d2a8fcd9bc0e24064c1095fa83f02ef38e2d035af56fd519b487ec46` |
| ECS Video service | Force deploy sonrasi `desired=1`, `running=1`, `pending=0`, rollout `COMPLETED` |
| Stream metadata | `/api/video/cameras/cam_meydan_01/stream` artik `live_synthetic_cam_meydan_01_mjpeg` donuyor |
| Canli stream endpoint | `/api/video/cameras/cam_meydan_01/live.mjpg`, `multipart/x-mixed-replace; boundary=frame` |
| Chrome Video smoke | `<img src=".../live.mjpg">`, `naturalWidth=960`, `naturalHeight=540`, `<video>` yok |
| Gorsel revizyon | Test pattern kaldirildi; yol, araclar, yayalar ve `CANLI` kamera overlay'i olan sentetik sehir sahnesi kullaniliyor |
| Frontend invalidation | `INUOSNHWJRM891GHNKE415Y5O`, `Completed` |

Aktif public URL:

```text
https://d1k4ey8nhx4dtb.cloudfront.net
```

## IAM Role Plani

| Role | Kullanacak Bilesen | Gerekli Yetki |
| --- | --- | --- |
| `smart-city-final-ecs-execution-role` | ECS task execution | ECR image pull, CloudWatch Logs yazma |
| `smart-city-final-iot-task-role` | IoT Service ECS task | `iot_sensors`, `iot_sensor_readings` okuma/yazma |
| `smart-city-final-video-task-role` | Video Service ECS task | `video_cameras`, `video_analysis_results` okuma/yazma, video S3 bucket okuma |
| `smart-city-final-ml-task-role` | ML Service ECS task | `ml_predictions` okuma/yazma, gerekirse inference servisi cagirma |
| `smart-city-final-iot-ingest-lambda-role` | IoT ingestion Lambda | IoT telemetry payload'ini `iot_sensor_readings` tablosuna yazma |
| `smart-city-final-video-result-lambda-role` | Rekognition result Lambda | SNS event okuma, video analiz sonucunu `video_analysis_results` tablosuna yazma |
| `smart-city-final-ml-inference-lambda-role` | ML inference Lambda alternatifi | CloudWatch Logs ve model artifact okuma/yazma ihtiyacina gore sinirli yetki |
| `smart-city-final-rekognition-sns-role` | Rekognition Video | Stored video analiz tamamlaninca SNS topic'e publish etme |

ECS task execution role ile uygulama task role'leri ayrilacak. Execution role
container image ve log altyapisi icindir; uygulama kodunun DynamoDB/S3 gibi
servislere erisimi task role uzerinden verilecektir.

## Olusturulan IAM Role'leri

| Role | ARN | Policy Durumu |
| --- | --- | --- |
| `smart-city-final-ecs-execution-role` | `arn:aws:iam::775755739642:role/smart-city-final-ecs-execution-role` | `AmazonECSTaskExecutionRolePolicy` baglandi |
| `smart-city-final-iot-task-role` | `arn:aws:iam::775755739642:role/smart-city-final-iot-task-role` | `smart-city-final-iot-task-policy` baglandi |
| `smart-city-final-video-task-role` | `arn:aws:iam::775755739642:role/smart-city-final-video-task-role` | `smart-city-final-video-task-policy` baglandi |
| `smart-city-final-ml-task-role` | `arn:aws:iam::775755739642:role/smart-city-final-ml-task-role` | `smart-city-final-ml-task-policy` baglandi |
| `smart-city-final-iot-ingest-lambda-role` | `arn:aws:iam::775755739642:role/smart-city-final-iot-ingest-lambda-role` | `AWSLambdaBasicExecutionRole` + `smart-city-final-iot-ingest-policy` baglandi |
| `smart-city-final-video-result-lambda-role` | `arn:aws:iam::775755739642:role/smart-city-final-video-result-lambda-role` | `AWSLambdaBasicExecutionRole` + `smart-city-final-video-result-policy` baglandi |
| `smart-city-final-ml-inference-lambda-role` | `arn:aws:iam::775755739642:role/smart-city-final-ml-inference-lambda-role` | `AWSLambdaBasicExecutionRole` + `smart-city-final-ml-inference-policy` baglandi |
| `smart-city-final-rekognition-sns-role` | `arn:aws:iam::775755739642:role/smart-city-final-rekognition-sns-role` | `smart-city-final-rekognition-sns-policy` baglandi |

## IoT Core Ingestion Durumu

| Kaynak | Deger |
| --- | --- |
| AWS IoT Data endpoint | `a17fmdwf2mfy6c-ats.iot.eu-central-1.amazonaws.com` |
| MQTT telemetry topic | `smart-city/iot/{zone_slug}/{sensor_id}/telemetry` |
| IoT topic rule | `smart_city_final_iot_telemetry_rule` |
| IoT SQL | `SELECT *, topic(3) AS zone_slug, topic(4) AS topic_sensor_id FROM 'smart-city/iot/+/+/telemetry'` |
| Lambda function | `smart-city-final-iot-ingest` |
| Lambda ARN | `arn:aws:lambda:eu-central-1:775755739642:function:smart-city-final-iot-ingest` |
| Lambda role | `smart-city-final-iot-ingest-lambda-role` |
| Target table | `iot_sensor_readings` |

Lambda kodu:

```text
docs/aws/lambda/iot_ingest_lambda.py
```

Test payload'i AWS IoT Data endpoint'ine publish edildi:

```text
Topic: smart-city/iot/meydan/sensor_meydan_01/telemetry
Payload:
{
  "sensor_id": "sensor_meydan_01",
  "zone": "Meydan",
  "temperature": 36.4,
  "humidity": 52,
  "air_quality_index": 118,
  "traffic_level": 74,
  "timestamp": "2026-05-30T21:35:00Z"
}
```

Test sonucu:

- Lambda invocation IoT Core rule uzerinden calisti.
- `iot_sensor_readings` tablosuna `sensor_id=sensor_meydan_01`,
  `timestamp=2026-05-30T21:35:00Z`, `status_level=warning` kaydi yazildi.
- CloudFront API uzerinden
  `/api/iot/readings?sensor_id=sensor_meydan_01&limit=1` ayni kaydi dondurdu.

## Video S3/Rekognition/SNS/Lambda Durumu

| Kaynak | Deger |
| --- | --- |
| Video bucket | `smart-city-final-775755739642-video` |
| Rekognition input object | `s3://smart-city-final-775755739642-video/rekognition-input/synthetic_city_loop_h264.mp4` |
| SNS topic | `arn:aws:sns:eu-central-1:775755739642:smart-city-final-video-rekognition-results` |
| Rekognition SNS role | `arn:aws:iam::775755739642:role/smart-city-final-rekognition-sns-role` |
| Result Lambda | `smart-city-final-video-result` |
| Result Lambda ARN | `arn:aws:lambda:eu-central-1:775755739642:function:smart-city-final-video-result` |
| Result Lambda role | `smart-city-final-video-result-lambda-role` |
| Target table | `video_analysis_results` |
| Test Rekognition job ID | `4830ffb914ac06ace14fa86078b7ba79a7b234990f910cc4eae8a3548d662f3b` |

Lambda kodu:

```text
docs/aws/lambda/video_result_lambda.py
```

Test icin browser'da kullanilan WebM stream'den kisa bir H.264 MP4 olusturuldu
ve S3 video bucket'ina yuklendi. Rekognition stored video analysis
`StartLabelDetection` ile baslatildi:

```text
S3Object: smart-city-final-775755739642-video/rekognition-input/synthetic_city_loop_h264.mp4
JobTag: cam_meydan_01
NotificationChannel:
  SNSTopicArn: arn:aws:sns:eu-central-1:775755739642:smart-city-final-video-rekognition-results
  RoleArn: arn:aws:iam::775755739642:role/smart-city-final-rekognition-sns-role
```

Test sonucu:

- Rekognition job status: `SUCCEEDED`
- Ilk label ornekleri: `Architecture`, `Building`, `City`, `High Rise`,
  `Neighborhood`, `Road`, `Scoreboard`, `Urban`
- SNS notification `smart-city-final-video-result` Lambda fonksiyonunu tetikledi.
- Lambda `video_analysis_results` tablosuna `camera_id=cam_meydan_01`,
  `zone=Meydan`, `crowd_level=low`, `motion_level=low` event'i yazdi.
- CloudFront API uzerinden
  `/api/video/analysis?camera_id=cam_meydan_01&limit=3` bu Rekognition kaynakli
  event'i dondurdu.

## ML Lambda Inference Durumu

| Kaynak | Deger |
| --- | --- |
| Inference secimi | Lambda inference |
| Lambda function | `smart-city-final-ml-inference` |
| Lambda ARN | `arn:aws:lambda:eu-central-1:775755739642:function:smart-city-final-ml-inference` |
| Lambda role | `smart-city-final-ml-inference-lambda-role` |
| Target table | `ml_predictions` |
| IoT input API | `https://d1k4ey8nhx4dtb.cloudfront.net/api/iot` |
| Video input API | `https://d1k4ey8nhx4dtb.cloudfront.net/api/video` |
| Prediction horizon | `60 minutes` |

Lambda kodu:

```text
docs/aws/lambda/ml_inference_lambda.py
```

Bu Lambda, CloudFront uzerinden IoT ve Video API'lerinin son verilerini okur,
5 bolge icin tahmin/risk kaydi uretir ve `ml_predictions` tablosuna yazar.
Panelin kullandigi ML ECS API servisi ayni DynamoDB tablosunu okudugu icin
Lambda tarafindan yazilan tahminler frontend'de de gorunur.

Not: ECS uzerindeki ML API halen `scikit-learn + joblib` model artifact'i ile
calisir. Lambda secimi, SageMaker endpoint maliyetini dusuk tutmak ve PDF'teki
serverless inference alternatifini gostermek icin uygulanmistir. Raporlama
asamasinda SageMaker endpoint daha ileri/olcekli secenek olarak anlatilabilir.

Test sonucu:

- `smart-city-final-ml-inference` manuel invoke edildi.
- Lambda response: `ok=true`, `count=5`
- Ornek riskler:
  - Meydan: `risk_score=86`, `risk_level=critical`, `predicted_crowd_level=high`
  - Otogar: `risk_score=47`, `risk_level=normal`, `predicted_crowd_level=medium`
  - Kampus: `risk_score=55`, `risk_level=warning`, `predicted_crowd_level=medium`
  - Hastane: `risk_score=62`, `risk_level=warning`, `predicted_crowd_level=medium`
  - Sanayi: `risk_score=82`, `risk_level=critical`, `predicted_crowd_level=high`
- CloudFront API uzerinden `/api/ml/predictions/latest` ayni 5 tahmini dondurdu.

## ECR Image Push Durumu

| Servis | Image URI | Tag | Digest | Push Zamani |
| --- | --- | --- | --- | --- |
| IoT Service | `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/iot-service` | `latest` | `sha256:de33d6ea6b88646995c681bbe8c76b2929ce1177969ac4a15b2b7e227ac21066` | `2026-05-30 23:47 Europe/Istanbul` |
| Video Analysis Service | `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/video-service` | `latest` | `sha256:7b1d7b7d808b607cd2bf5db1b2e61117acd49390a991c07d9f03d66e95cf4592` | `2026-05-30 23:49 Europe/Istanbul` |
| ML Analytics Service | `775755739642.dkr.ecr.eu-central-1.amazonaws.com/smart-city-final/ml-service` | `latest` | `sha256:6ec4a28475f61fb148b5727eb2ebf9a0e3a2e684760c2ae8980a9e3b708b0f03` | `2026-05-30 23:52 Europe/Istanbul` |

## ECS ve ALB Durumu

| Kaynak | Deger |
| --- | --- |
| ECS cluster | `smart-city-final-cluster` |
| ALB DNS | `smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com` |
| ALB ARN | `arn:aws:elasticloadbalancing:eu-central-1:775755739642:loadbalancer/app/smart-city-final-alb/cd52a1aaa38469d7` |
| ALB security group | `sg-08172bfbedcf5560f` |
| ECS task security group | `sg-06b55f787566ccace` |
| Listener | `HTTP :80` |
| IoT target group | `arn:aws:elasticloadbalancing:eu-central-1:775755739642:targetgroup/smart-city-final-iot-tg/7c682fd0bcd154e3` |
| Video target group | `arn:aws:elasticloadbalancing:eu-central-1:775755739642:targetgroup/smart-city-final-video-tg/1b1f222328a57ede` |
| ML target group | `arn:aws:elasticloadbalancing:eu-central-1:775755739642:targetgroup/smart-city-final-ml-tg/a13696245fb16db2` |

| Servis | Task Definition | Desired | Running | Target Health |
| --- | --- | --- | --- | --- |
| IoT Service | `smart-city-final-iot-service:1` | 1 | 1 | healthy |
| Video Analysis Service | `smart-city-final-video-service:1` | 1 | 1 | healthy |
| ML Analytics Service | `smart-city-final-ml-service:1` | 1 | 1 | healthy |

ALB test endpointleri:

```text
http://smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com/api/iot/health
http://smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com/api/video/health
http://smart-city-final-alb-1917068080.eu-central-1.elb.amazonaws.com/api/ml/health
```

Test sonucu:

- IoT health: `status=ok`, `mqtt_connected=false`, `simulator_running=false`
- Video health: `status=ok`, `analyzer_running=false`
- ML health: `status=ok`, `model_ready=true`
