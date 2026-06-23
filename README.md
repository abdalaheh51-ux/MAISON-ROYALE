# Maison Royale — Luxury Watch Customizer & 3D Atelier

متجر ساعات فاخرة مع تخصيص تفاعلي، نظام ERP مصغر، ونماذج ثلاثية الأبعاد واقعية لساعتين فاخرتين مع تفكيك وتركيب.

A luxury watch store with an interactive SVG configurator, a mini-ERP inventory system, and realistic 3D models of two Audemars Piguet timepieces with full disassembly/assembly animation.

---

## 🎁 تحميل المشروع / Download

**رابط التحميل المباشر:** `/maison-royale.zip` (1.4 MB)

بعد فك الضغط، شغّل المشروع محلياً:

```bash
bun install
bun run db:push      # ينشئ قاعدة البيانات SQLite
bun run scripts/seed.ts   # يزرع بيانات الساعات + المخزون
bun run dev          # http://localhost:3000
```

---

## ✨ الميزات الرئيسية

### 1. مُخصّص الساعات التفاعلي (Interactive Watch Configurator)
- **SVG watch renderer مُعاملاتي** بالكامل — الساعة تُرسَم بكسل بكسل وتتغير لحظيًا
- 4 محاور تخصيص: **Dial** (لون + نهاية)، **Strap** (جلد/معدني/مطاط)، **Hands** (4 أنماط)، **Case** (4 معادن)
- **السعر يتحدث لحظيًا** مع كل اختيار
- تأكيد الطلب ينقص المخزون ذرياً (transaction)

### 2. نظام ERP المصغر (Mini-ERP Inventory)
- لوحة KPIs: Total units / SKUs / Low stock / Sold out + قيمة المخزون
- جدول مخزون كامل مع أزرار Consume(-1) / +5 / Restock(+1)
- **التكامل ثنائي الاتجاه**: عند نفاد قطعة → تختفي فوراً من خيارات التخصيص. عند إعادة التخزين → تعود للحظيًا

### 3. النموذج ثلاثي الأبعاد — AP [Re]master01
- **16 قطعة منفصلة** قابلة للتفكيك بـ React Three Fiber
- علبة بلاتين، قرص ثنائي اللون (فضي + سلمون)، حركة Calibre 4404 مكشوفة
- تفكيك/تركيب واقعي (easeInOutCubic + damped follow)

### 4. النموذج ثلاثي الأبعاد — AP 150 Heritage Ultra-complication Universal Calendar
- **16 قطعة منفصلة** قابلة للتفكيك
- علبة فولاذ، قرص أزرق بأشعة شمس، **4 عدّادات فرعية** (تاريخ@12، يوم@9، شهر@3، توربيون@6 دوّار)
- أرقام رومانية، عقارب Breguet ذهبية وردية، تاج بصلية، سوار فولاذي

### 5. التصميم الفاخر (Dark Luxury Theme)
- خلفية سوداء دافئة + لمسة ذهبية شامبين (OKLCH)
- خطوط Serif (Playfair Display + Cormorant Garamond)
- صور Hero كاملة، Parallax scrolling، Framer Motion animations
- Footer ثابت أسفل الصفحة

---

## 🛠️ التقنيات المستخدمة

| الفئة | التقنية |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Database | Prisma ORM (SQLite) |
| Animations | Framer Motion |
| AI Images | z-ai-web-dev-sdk (image generation) |

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── page.tsx              # الصفحة الرئيسية (server component)
│   ├── layout.tsx            # الخطوط + metadata
│   ├── globals.css           # الثيم الداكن الفاخر
│   └── api/
│       ├── catalog/route.ts      # GET — الموديل + المكونات
│       ├── inventory/route.ts    # GET + PATCH — ERP
│       └── orders/route.ts       # POST — تأكيد الطلب (atomic)
├── components/
│   ├── watch/
│   │   ├── watch-svg.tsx        # SVG renderer للساعة
│   │   ├── configurator.tsx     # المُخصّص التفاعلي
│   │   ├── erp-panel.tsx        # لوحة ERP
│   │   ├── watch-3d-model.tsx   # نموذج 3D الأول
│   │   └── watch-3d-scene.tsx
│   ├── remaster01/              # AP [Re]master01 3D experience
│   ├── universal-calendar/      # AP Ultra-complication 3D experience
│   ├── shared/
│   │   └── watch-experience-3d.tsx  # overlay قابل لإعادة الاستخدام
│   └── sections/                # أقسام الصفحة الرئيسية
└── lib/
    ├── db.ts                   # Prisma client
    ├── types.ts                # الأنواع المشتركة
    └── format.ts               # تنسيق العملة

prisma/
└── schema.prisma               # WatchModel, Component, Order, OrderItem

scripts/
├── seed.ts                     # بيانات الساعة + 18 مكون
└── gen-images.ts               # توليد صور AI
```

---

## 🚀 التشغيل

### المتطلبات
- Node.js 18+ أو Bun
- البيئة تُحمّل تلقائياً من `.env`

### الخطوات
```bash
# 1. تثبيت الحزم
bun install

# 2. إنشاء قاعدة البيانات + زرع البيانات
bun run db:push
bun run scripts/seed.ts

# 3. تشغيل خادم التطوير
bun run dev
# افتح http://localhost:3000
```

### أوامر مفيدة
```bash
bun run lint          # فحص الكود
bun run db:push       # مزامنة schema مع DB
bun run db:reset      # إعادة تعيين DB
```

---

## 📝 سجل العمل

انظر `worklog.md` للتفاصيل الكاملة لكل مرحلة من مراحل البناء (11 مرحلة موثقة).

---

## 🎨 التصميم

- **الثيم:** داكن فاخر — خلفية `oklch(0.13 0.008 60)` (أسود دافئ) + ذهبي شامبين `oklch(0.82 0.13 81)`
- **الخطوط:** Playfair Display (عناوين), Cormorant Garamond (اقتباسات), Geist (نصوص)
- **الألوان:** لا أزرق/نيلي — ذهبي + أبيض كريمي + رمادي داكن

---

© 2024 Maison Royale. مشروع تعليمي/عرضي. الساعات المذكورة (Audemars Piguet) هي علامات تجارية لأصحابها.
