# Foxy.io Integration Setup Guide

This guide will help you complete the migration from Ecwid to Foxy.io for your M2 Labs website.

## Prerequisites

- [ ] Foxy.io account created at [foxy.io](https://foxy.io)
- [ ] Cloudflare Pages deployment active
- [ ] D1 database configured

## Step 1: Foxy.io Account Setup

1. **Sign up for Foxy.io**
   - Go to [https://foxy.io](https://foxy.io)
   - Choose an appropriate plan (they have a generous free tier)
   - Note your subdomain (e.g., `m2labs.foxycart.com`)

2. **Configure Store Settings**
   - Set store name: "M2 Labs"
   - Set currency: USD
   - Configure your logo and branding

## Step 2: Environment Variables

Add these to your Cloudflare Pages environment variables:

```bash
# Foxy Configuration
FOXY_SUBDOMAIN=m2-labs
FOXY_STORE_SECRET=RHmjYcuJvyYts4QMJABWtEx9xP6yvMMpbBzAp4JE
FOXY_API_KEY=your-foxy-api-key  # Get from Integrations → FoxyCart API
FOXY_WEBHOOK_SECRET=your-webhook-secret  # Set when creating webhook
NEXT_PUBLIC_FOXY_SUBDOMAIN=m2-labs
```

## Step 3: Update Shop Page

✅ **COMPLETED** - I've already updated your code with the `m2-labs` subdomain!

## Step 4: Configure Webhooks

⚠️ **WAIT** until you add your .com domain to Cloudflare Pages!

Then in your Foxy admin panel:

1. Go to **Integrations → Webhooks**
2. Add webhook URL: `https://your-actual-domain.com/api/foxy/webhook`
3. Select events:
   - `transaction/created`
   - `transaction/updated`
   - `subscription/created` (if using subscriptions)
   - `subscription/updated` (if using subscriptions)
4. Generate a webhook secret (use any secure random string)
5. Add that secret to your environment variables as `FOXY_WEBHOOK_SECRET`

## Step 5: Run Database Migration

Execute the migration to add Foxy-specific fields:

```sql
-- Run this in your D1 database
-- (Copy content from migrations/003_foxy_migration.sql)
```

## Step 6: Product Configuration

### Option A: Manual Product Entry
Add your products directly in Foxy admin:

1. Go to **Products → Add Product**
2. For each pedal, add:
   - Name: "The Bomber Overdrive"
   - Price: $199.99
   - SKU: "M2L-BOMBER-001"
   - Category: "overdrive"
   - Images and descriptions

### Option B: Update Code with Your Products
Edit `src/app/shop/page.tsx` and update the `products` array with your actual inventory.

## Step 7: Payment Gateway Setup

1. **In Foxy Admin → Settings → Payment Gateways**
2. **Add your preferred gateway:**
   - Stripe (recommended)
   - PayPal
   - Square
   - Authorize.net
   - etc.

## Step 8: Customer Portal Integration

Foxy provides a hosted customer portal. To integrate:

1. **Configure SSO (optional but recommended)**
   - Set SSO endpoint: `https://your-domain.com/api/foxy/sso`
   - Enable customer accounts in Foxy settings

2. **Customer Portal URL**
   - Direct link: `https://your-subdomain.foxycart.com/customer-portal`
   - Integrated via: `/api/foxy/customer-portal`

## Step 9: Remove Ecwid Dependencies

After confirming Foxy works:

1. **Remove Ecwid API endpoints:**
   - `src/app/api/ecwid/sso/route.ts`
   - `src/app/api/ecwid/webhook/route.ts`

2. **Remove Ecwid environment variables:**
   - `ECWID_STORE_ID`
   - `ECWID_PUBLIC_TOKEN`
   - `ECWID_SECRET_TOKEN`

## Step 10: Testing

### Test Cart Functionality
1. Visit `/shop`
2. Add products to cart
3. Proceed through checkout
4. Verify order appears in `/account/orders`

### Test Webhooks
1. Complete a test purchase
2. Check Cloudflare Pages logs for webhook reception
3. Verify order data in D1 database

### Test Customer Portal
1. Log in to your account
2. Click "Customer Account" link
3. Verify it redirects to Foxy portal with your email

## Step 11: Go Live

1. **Configure production payment gateway**
2. **Set up SSL certificates** (handled by Cloudflare)
3. **Test with real payment methods**
4. **Monitor webhook logs** for any issues

## Foxy vs Ecwid: Key Differences

| Feature | Ecwid | Foxy.io |
|---------|--------|---------|
| **Integration** | Embedded widget | Add-to-cart forms + hosted checkout |
| **Checkout** | On your domain | Hosted by Foxy (customizable) |
| **Customer Accounts** | SSO token system | Direct integration + portal |
| **Pricing** | Transaction fees | Monthly subscription |
| **Customization** | Widget-based | Full HTML/CSS control |

## Support Resources

- **Foxy Documentation**: [wiki.foxycart.com](https://wiki.foxycart.com)
- **API Reference**: [Foxy.io API Docs](https://foxy.io/docs)
- **Support**: Available via their admin panel

## Troubleshooting

### Common Issues

1. **Cart not loading**
   - Check `NEXT_PUBLIC_FOXY_SUBDOMAIN` is set correctly
   - Verify script URL in browser network tab

2. **Orders not syncing**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check Cloudflare Pages function logs

3. **Customer portal not working**
   - Ensure user is logged in to your site
   - Check Foxy customer portal settings
   - Verify email matching between systems

### Debug Tools

- **Foxy Admin → Logs**: View transaction and webhook logs
- **Cloudflare Pages → Functions**: View webhook processing logs
- **Browser DevTools**: Check for JavaScript errors

---

**Need help?** The Foxy.io team provides excellent support through their admin panel, and their documentation is comprehensive.
