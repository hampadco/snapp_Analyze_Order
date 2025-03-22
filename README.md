# داشبورد تحلیلی سفارشات اسنپ

این پروژه امکان تحلیل سفارشات اسنپ را فراهم می‌کند و داشبوردی زیبا برای نمایش نتایج ارائه می‌دهد.

## ویژگی‌ها

- دریافت خودکار تمام صفحات سفارش از API اسنپ
- تحلیل هزینه‌ها بر اساس:
  - نوع سرویس (رستوران، تاکسی، فروشگاه و غیره)
  - نوع محصول (food, cab, shop, market)
  - ماه
- محاسبه مجموع هزینه‌ها برای هر دسته‌بندی
- نمایش نتایج در قالب نمودارهای گرافیکی
- جداول تفصیلی برای نمایش جزئیات هزینه‌ها
- رابط کاربری فارسی

## پیش‌نیازها

- Node.js (نسخه 16 یا بالاتر)
- NPM (نسخه 7 یا بالاتر)

## نصب

1. مخزن را کلون کرده یا کد منبع را دانلود کنید
2. وابستگی‌ها را نصب کنید:

```bash
npm install
```

3. متغیرهای محیطی را در فایل `.env` تنظیم کنید:
   - `API_URL`: آدرس API اسنپ
   - `BEARER_TOKEN`: توکن احراز هویت اسنپ شما

## استفاده

### تحلیل سفارشات

برای تحلیل سفارشات اسنپ:

```bash
npm run analyze
```

این دستور:
1. تمام صفحات سفارشات را از API اسنپ دریافت می‌کند
2. سفارشات را دسته‌بندی و تحلیل می‌کند
3. نتایج را در کنسول نمایش می‌دهد
4. تحلیل مفصل را در فایل `order-analysis.json` ذخیره می‌کند
5. گزارش متنی را در فایل `report.txt` ذخیره می‌کند

### داشبورد وب

برای مشاهده داشبورد وب:

```bash
npm run serve
```

سپس مرورگر خود را باز کنید و به آدرس زیر بروید:
http://localhost:3000

## نتایج

داشبورد وب شامل بخش‌های زیر است:

1. **کارت‌های خلاصه**: نمایش مجموع هزینه، تعداد سفارشات و محدوده تاریخ
2. **نمودار دسته‌بندی**: نمایش مصرف به تفکیک دسته‌بندی
3. **نمودار سرویس**: نمایش مصرف به تفکیک سرویس (غذا، تاکسی و غیره)
4. **نمودار ماهانه**: روند هزینه در طول زمان
5. **جداول تفصیلی**: جزئیات کامل هزینه‌ها با امکان مشاهده درصدها

## English Instructions / راهنمای انگلیسی

# Snapp Orders Analysis Dashboard

This project analyzes Snapp orders and provides a beautiful dashboard to visualize the results.

## Features

- Automatically fetches all order pages from Snapp API
- Analyzes spending by:
  - Service type (restaurant, cab, shop, etc.)
  - Venture (food, cab, shop, market)
  - Month
- Calculates totals for each category
- Displays results in graphical charts
- Detailed tables showing spending breakdowns
- Persian user interface

## Prerequisites

- Node.js (version 16 or higher)
- NPM (version 7 or higher)

## Installation

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in the `.env` file:
   - `API_URL`: The Snapp API endpoint
   - `BEARER_TOKEN`: Your Snapp authentication token

## Usage

### Analyze orders

To analyze Snapp orders:

```bash
npm run analyze
```

This will:
1. Fetch all order pages from the Snapp API
2. Process and categorize the orders
3. Display the results in the console
4. Save detailed analysis to `order-analysis.json`
5. Save a text report to `report.txt`

### Web dashboard

To view the web dashboard:

```bash
npm run serve
```

Then open your browser and navigate to:
http://localhost:3000 