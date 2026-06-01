# Ulug'bek AI v5 🇺🇿

O'zbekistonning aqlli AI yordamchisi.

## Railway ga Deploy Qilish

### 1-usul: GitHub orqali (tavsiya etiladi)

1. Ushbu fayllarni GitHub repozitoriyasiga yuklang
2. [railway.app](https://railway.app) ga kiring
3. **New Project** → **Deploy from GitHub repo**
4. Repozitoriyangizni tanlang
5. Railway avtomatik build va deploy qiladi ✅

### 2-usul: Railway CLI orqali

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Local ishga tushirish

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
node server.js
```

## Eslatma

API so'rovlar to'g'ridan-to'g'ri brauzerdan Anthropic API ga yuboriladi.
`anthropic-dangerous-direct-browser-access: true` header ishlatiladi.
