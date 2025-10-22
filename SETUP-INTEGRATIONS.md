# 🔧 INTEGRATION SETUP GUIDE

Quick setup guide for all integrations.

---

## ✅ TASK PROGRESS

- [x] 1. Packages installed
- [x] 2. .env.local template created
- [ ] 3. Stripe setup
- [ ] 4. Twilio setup
- [ ] 5. SendGrid setup
- [ ] 6. Implementation

---

## 🔐 1. STRIPE SETUP (5 minutes)

### Get API Keys:
1. Go to: https://dashboard.stripe.com/register
2. Create account (use test mode)
3. Go to: https://dashboard.stripe.com/test/apikeys
4. Copy:
   - **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### Add to .env.local:
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 📱 2. TWILIO SETUP (5 minutes)

### Get Credentials:
1. Go to: https://www.twilio.com/try-twilio
2. Sign up / Log in
3. Go to Console: https://console.twilio.com
4. Copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`

### WhatsApp Sandbox:
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Join sandbox (send message to their number)
3. Use: `whatsapp:+14155238886` → `TWILIO_WHATSAPP_NUMBER`

### Add to .env.local:
```bash
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

---

## 📧 3. SENDGRID SETUP (5 minutes)

### Get API Key:
1. Go to: https://signup.sendgrid.com
2. Sign up / Log in
3. Go to: https://app.sendgrid.com/settings/api_keys
4. Click "Create API Key"
5. Choose "Full Access"
6. Copy key → `SENDGRID_API_KEY`

### Verify Sender:
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Verify your email address
3. Use that email → `SENDGRID_FROM_EMAIL`

### Add to .env.local:
```bash
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="your-email@example.com"
SENDGRID_FROM_NAME="SmartStore SaaS"
```

---

## 🛒 4. WOOCOMMERCE (Optional - 5 minutes)

### Get API Keys:
1. Need a WooCommerce store
2. Go to: WP Admin → WooCommerce → Settings → Advanced → REST API
3. Add Key
4. Copy:
   - **Consumer Key** → `WOOCOMMERCE_CONSUMER_KEY`
   - **Consumer Secret** → `WOOCOMMERCE_CONSUMER_SECRET`

---

## 💳 5. PAYHERE (Optional - Sri Lanka)

### Get Credentials:
1. Go to: https://www.payhere.lk/merchant/register
2. Sign up for merchant account
3. Get:
   - **Merchant ID** → `PAYHERE_MERCHANT_ID`
   - **Merchant Secret** → `PAYHERE_MERCHANT_SECRET`
4. Use sandbox mode for testing

---

## 🚀 QUICK START

### 1. Copy template:
```bash
cp .env.local.example .env.local
```

### 2. Fill in values:
- Add your API keys from above
- Start with Stripe, Twilio, SendGrid (minimum)

### 3. Restart server:
```bash
npm run dev
```

---

## ✅ VERIFICATION

Test each integration:

### Stripe:
```bash
curl -X POST http://localhost:3000/api/payments/stripe/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```

### Twilio:
```bash
curl -X POST http://localhost:3000/api/integrations/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test"}'
```

### SendGrid:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "body": "Hello"}'
```

---

## 📝 NOTES

- All services have **free tiers** for testing
- Use **test/sandbox modes** initially
- Keep API keys **secure** (never commit to git)
- Production keys go in Vercel environment variables

---

**Ready? Let's implement the integrations!**

