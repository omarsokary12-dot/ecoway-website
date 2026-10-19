# ECOWAY Shop - رشا محمد عمارة

موقع لعرض منتجات ECOWAY، والعميل يبعت طلبه، والطلب يتحول لرسالة واتساب جاهزة على الرقم **+966532831719**.

## الهيكل

```
ecoway-website/
├── backend/                 # Java + Spring Boot API
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ecoway/shop/
│       │   ├── ShopApplication.java     # نقطة التشغيل
│       │   ├── Product.java             # موديل المنتج
│       │   ├── ProductService.java      # بيقرأ المنتجات من products.json
│       │   ├── ProductController.java   # GET  /api/products
│       │   ├── OrderRequest.java        # بيانات الطلب + validation
│       │   ├── OrderResponse.java
│       │   ├── OrderService.java        # يحسب الأسعار ويبني رسالة الواتساب
│       │   ├── OrderController.java     # POST /api/orders
│       │   └── CorsConfig.java
│       └── resources/
│           ├── application.properties   # رقم الواتساب + إعدادات
│           └── products.json            # كل المنتجات والأسعار
├── frontend/                # HTML + CSS + JavaScript
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── images/              # صور المنتجات (p<id>.webp)
└── .gitignore
```

## تشغيل الـ Backend

1. ثبّت **JDK 17 أو أحدث** و **Maven**.
2. من فولدر `backend`:
   ```bash
   mvn spring-boot:run
   ```
3. الـ API هتبقى على `http://localhost:8080`.
   - `GET /api/products` → قايمة المنتجات
   - `POST /api/orders` → بيستقبل الطلب ويرجع رابط واتساب

## تشغيل الـ Frontend

افتح `frontend/index.html` عن طريق **VS Code Live Server** (على المنفذ 5500)، لأن الـ CORS مضبوط على `localhost:5500`.

## تغيير رقم الواتساب

عدّل السطر ده في `backend/src/main/resources/application.properties`:
```properties
app.whatsapp.number=966532831719
```
(بالأرقام بس، من غير `+`)

## كيف الطلب بيوصل؟

1. العميل بيضيف منتجات للسلة ويكتب الاسم والإيميل والعنوان.
2. الـ Backend بيحسب الأسعار بنفسه من `products.json` (الأسعار اللي جاية من المتصفح مش بتتصدق).
3. الـ Backend بيرجع رابط `https://wa.me/966532831719?text=...` والرسالة متجهزة فيه.
4. المتصفح بيفتح واتساب والرسالة مكتوبة، والعميل يضغط **إرسال**.

> ملحوظة: `wa.me` بيفتح الرسالة جاهزة لكن الضغط على "إرسال" لازم يحصل من العميل. لو عايزين الرسالة تتبعت لوحدها للرقم، لازم تستخدم **WhatsApp Cloud API** من Meta (محتاج حساب Business وتوكن).

## تحديث المنتجات والصور

- الأسعار والأسماء في `backend/src/main/resources/products.json`.
- الصورة بتتسمّي `images/p<id>.webp` وبتتربط بالـ `id` بتاع المنتج في الـ JSON.
- لو المنتج مالوش صورة، القيمة `image` تكون `null`.

## Git

```bash
cd ecoway-website
git init
git add .
git commit -m "Initial commit: ECOWAY shop"
```

بعد كده، لأي تعديل:
```bash
git add .
git commit -m "وصف التعديل"
```
