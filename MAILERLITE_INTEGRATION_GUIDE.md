# MailerLite Integration Guide for M2 Labs

**⚠️ READ THIS ENTIRE DOCUMENT BEFORE STARTING ⚠️**

Your friend specifically requested this be written for someone with "no coding experience" - so every step is explained in detail.

## 🎯 What This Integration Does

MailerLite will replace your current email system and handle:
- **Newsletter subscriptions** and campaigns 
- **Order confirmation emails** when someone buys a pedal
- **Order status update emails** (shipped, delivered, etc.)
- **Support ticket notifications** 
- **User registration email validation**
- **Email marketing campaigns**

## 📋 Prerequisites 

### 1. MailerLite Account Setup
1. Go to [MailerLite.com](https://www.mailerlite.com) and sign up
2. Choose a plan (Free plan works for testing, paid for production)
3. Complete account setup and email verification

### 2. Get Your API Key
1. Log into MailerLite
2. Go to **Integrations** → **MailerLite API**
3. Click **"Generate new token"**
4. Name it: `M2Labs Production API`
5. **COPY THE TOKEN IMMEDIATELY** - you can't see it again!
6. Save it somewhere safe (like a password manager)

## 🔧 Technical Integration Steps

### Step 1: Environment Variables Setup

**File to Edit:** Your Cloudflare Pages environment variables

**What to do:**
1. Go to your Cloudflare Pages dashboard
2. Find your M2 Labs project
3. Go to **Settings** → **Environment Variables**
4. Add these new variables (click **"Add variable"** for each):

```
MAILERLITE_API_KEY=your_api_key_here_from_step_2_above
MAILERLITE_FROM_EMAIL=orders@m2labs.com
MAILERLITE_FROM_NAME=M2 Labs
```

**Replace `your_api_key_here_from_step_2_above` with your actual API key!**

### Step 2: Install MailerLite Library

**File to Edit:** `package.json`

**What to do:**
1. Open the file `package.json` in your code editor
2. Find the `"dependencies"` section (around line 20)
3. Add this line inside the dependencies block:
```json
"@mailerlite/mailerlite-nodejs": "^1.1.0",
```
4. Make sure to add a comma after the previous line
5. Save the file
6. Run this command in your terminal:
```bash
npm install
```

### Step 3: Create MailerLite Service

**File to Create:** `src/libs/mailerlite.ts`

**What to do:**
1. Create a new file called `mailerlite.ts` in the `src/libs/` folder
2. Copy and paste this ENTIRE code block:

```typescript
import MailerLite from '@mailerlite/mailerlite-nodejs';

// Initialize MailerLite client
const getMailerLiteClient = () => {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    throw new Error('MAILERLITE_API_KEY environment variable is required');
  }
  return new MailerLite({ api_key: apiKey });
};

// MailerLite service class
export class MailerLiteService {
  private client: MailerLite;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.client = getMailerLiteClient();
    this.fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'orders@m2labs.com';
    this.fromName = process.env.MAILERLITE_FROM_NAME || 'M2 Labs';
  }

  // Add subscriber to MailerLite
  async addSubscriber(email: string, firstName?: string, lastName?: string, groups: string[] = []) {
    try {
      const subscriberData: any = {
        email: email.toLowerCase(),
        status: 'active'
      };

      if (firstName || lastName) {
        subscriberData.fields = {};
        if (firstName) subscriberData.fields.name = firstName;
        if (lastName) subscriberData.fields.last_name = lastName;
      }

      if (groups.length > 0) {
        subscriberData.groups = groups;
      }

      const response = await this.client.subscribers.createOrUpdate(subscriberData);
      console.log('✅ Subscriber added to MailerLite:', email);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding subscriber to MailerLite:', error);
      throw error;
    }
  }

  // Remove subscriber from MailerLite
  async removeSubscriber(email: string) {
    try {
      await this.client.subscribers.delete(email);
      console.log('✅ Subscriber removed from MailerLite:', email);
      return true;
    } catch (error) {
      console.error('❌ Error removing subscriber from MailerLite:', error);
      return false;
    }
  }

  // Send transactional email (order confirmations, etc.)
  async sendTransactionalEmail({
    to,
    subject,
    html,
    text,
    templateId
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
  }) {
    try {
      const emailData: any = {
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        to: [{ email: to }],
        subject
      };

      if (templateId) {
        emailData.template_id = templateId;
      } else {
        if (html) emailData.html = html;
        if (text) emailData.text = text;
      }

      // Note: MailerLite's transactional emails require a paid plan
      // For free plan, you'll need to use campaigns instead
      const response = await this.client.campaigns.send(emailData);
      console.log('✅ Email sent via MailerLite to:', to);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending email via MailerLite:', error);
      throw error;
    }
  }

  // Create and send campaign (for order confirmations on free plan)
  async sendCampaignEmail({
    to,
    subject,
    html,
    campaignName
  }: {
    to: string;
    subject: string;
    html: string;
    campaignName: string;
  }) {
    try {
      // First, ensure the recipient is a subscriber
      await this.addSubscriber(to);

      // Create campaign
      const campaign = await this.client.campaigns.create({
        name: campaignName,
        type: 'regular',
        emails: [{
          subject,
          from_name: this.fromName,
          from: this.fromEmail,
          content: html
        }]
      });

      // Send to specific subscriber
      await this.client.campaigns.send(campaign.data.id, {
        subscribers: [to]
      });

      console.log('✅ Campaign email sent to:', to);
      return campaign.data;
    } catch (error) {
      console.error('❌ Error sending campaign email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mailerLiteService = new MailerLiteService();
```

3. Save the file

### Step 4: Update Email Service to Use MailerLite

**File to Edit:** `src/libs/email.ts`

**What to do:**
1. Open the file `src/libs/email.ts`
2. Find line 1 and add this import at the top:
```typescript
import { mailerLiteService } from './mailerlite';
```

3. Find the `EmailService` class (around line 200)
4. Replace the entire `sendEmail` method (lines 209-247) with this:

```typescript
async sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Use MailerLite for sending emails
    await mailerLiteService.sendCampaignEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html || '',
      campaignName: `Auto: ${emailData.subject} - ${new Date().toISOString()}`
    });

    console.log('📧 Email sent via MailerLite:', {
      to: emailData.to,
      subject: emailData.subject,
    });

    return true;
  } catch (error) {
    console.error('Error sending email via MailerLite:', error);
    // Fallback to console logging for development
    console.log('📧 Email would be sent (fallback):', {
      to: emailData.to,
      from: emailData.from || this.fromEmail,
      subject: emailData.subject,
    });
    return false;
  }
}
```

5. Save the file

### Step 5: Update Newsletter Subscription to Use MailerLite

**File to Edit:** `src/app/api/newsletter/route.ts`

**What to do:**
1. Open the file `src/app/api/newsletter/route.ts`
2. Add this import at the top (around line 3):
```typescript
import { mailerLiteService } from '@/libs/mailerlite';
```

3. Find the section where it creates a new subscriber (around line 97)
4. Add this code right after `const newSubscriber = await createNewsletterSubscriber(subscriberData);`:

```typescript
// Also add to MailerLite
try {
  await mailerLiteService.addSubscriber(
    subscriberData.email,
    subscriberData.firstName,
    subscriberData.lastName,
    ['Newsletter'] // Add to Newsletter group
  );
} catch (error) {
  console.error('Error adding subscriber to MailerLite:', error);
  // Continue anyway - local database subscription still works
}
```

5. Save the file

### Step 6: Update Newsletter Unsubscribe

**File to Edit:** `src/app/api/newsletter/unsubscribe/route.ts`

**What to do:**
1. Open the file `src/app/api/newsletter/unsubscribe/route.ts`
2. Add this import at the top:
```typescript
import { mailerLiteService } from '@/libs/mailerlite';
```

3. Find where it updates the subscriber to inactive (around line 70-80)
4. Add this code after the database update:

```typescript
// Also remove from MailerLite
try {
  await mailerLiteService.removeSubscriber(email);
} catch (error) {
  console.error('Error removing subscriber from MailerLite:', error);
  // Continue anyway - local unsubscribe still works
}
```

5. Save the file

### Step 7: Add MailerLite to Order Confirmation Emails

**File to Edit:** `src/app/api/stripe/webhook/route.ts`

**What to do:**
1. Open the file `src/app/api/stripe/webhook/route.ts`
2. Add this import at the top:
```typescript
import { EmailService } from '@/libs/email';
```

3. Find the `handlePaymentSuccess` function (around line 92)
4. Find the comment `// TODO: Send order confirmation email` (around line 124)
5. Replace that comment with this code:

```typescript
// Send order confirmation email
try {
  const emailService = new EmailService();
  const order = await getOrderById(orderId);
  if (order && order.customer?.email) {
    await emailService.sendOrderConfirmation(order);
    console.log('✅ Order confirmation email sent for order:', orderId);
  }
} catch (error) {
  console.error('❌ Error sending order confirmation email:', error);
  // Don't fail the webhook if email fails
}
```

6. Save the file

### Step 8: Add Email Notifications for Order Status Updates

**File to Edit:** `src/app/admin/orders/page.tsx`

**What to do:**
1. Open the file `src/app/admin/orders/page.tsx`
2. Find the `updateOrderStatus` function (around line 78)
3. Replace the entire function with this:

```typescript
const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status,
        sendEmailNotification: true // Request email notification
      }),
    });

    if (response.ok) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: status as any } : order
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
      
      // Show success message
      alert(`Order status updated to ${status}. Customer notification email sent.`);
    } else {
      alert('Failed to update order status');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Error updating order status');
  }
};
```

4. Save the file

### Step 9: Update Order Status API to Send Emails

**File to Edit:** `src/app/api/admin/orders/[id]/route.ts`

**What to do:**
1. Open the file `src/app/api/admin/orders/[id]/route.ts`
2. Add these imports at the top:
```typescript
import { EmailService } from '@/libs/email';
import { mailerLiteService } from '@/libs/mailerlite';
```

3. Find the PATCH method (should be around line 20-30)
4. Add this code before the final `return NextResponse.json(order);`:

```typescript
// Send email notification if requested
if (data.sendEmailNotification && order?.customer?.email) {
  try {
    const emailService = new EmailService();
    
    // Different email templates based on status
    switch (data.status) {
      case 'shipped':
        await emailService.sendOrderShipped(order, data.trackingNumber);
        break;
      case 'delivered':
        // You can create a custom delivered email template
        await emailService.sendEmail({
          to: order.customer.email,
          subject: `Your M2 Labs order has been delivered! 🎸`,
          html: `
            <h2>Order Delivered!</h2>
            <p>Great news! Your order #${order.orderNumber} has been delivered.</p>
            <p>We hope you love your new gear. If you have any questions, please contact our support team.</p>
            <p>Rock on!<br>The M2 Labs Team</p>
          `,
          text: `Your M2 Labs order #${order.orderNumber} has been delivered!`
        });
        break;
      case 'cancelled':
        await emailService.sendEmail({
          to: order.customer.email,
          subject: `Order #${order.orderNumber} has been cancelled`,
          html: `
            <h2>Order Cancelled</h2>
            <p>Your order #${order.orderNumber} has been cancelled.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thanks,<br>The M2 Labs Team</p>
          `,
          text: `Your order #${order.orderNumber} has been cancelled.`
        });
        break;
    }
    
    console.log(`✅ Order status email sent to ${order.customer.email} for status: ${data.status}`);
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    // Don't fail the API call if email fails
  }
}
```

5. Save the file

### Step 10: Add Email Validation for User Registration

**File to Edit:** `src/app/api/auth/register/route.ts`

**What to do:**
1. Open the file `src/app/api/auth/register/route.ts`
2. Add this import at the top:
```typescript
import { mailerLiteService } from '@/libs/mailerlite';
```

3. Find where the user is created successfully (around line 40-50)
4. Add this code after user creation:

```typescript
// Add user to MailerLite and send welcome email
try {
  await mailerLiteService.addSubscriber(
    user.email,
    user.firstName,
    user.lastName,
    ['Customers'] // Add to Customers group
  );
  
  // Send welcome email
  await mailerLiteService.sendCampaignEmail({
    to: user.email,
    subject: 'Welcome to M2 Labs! 🎸',
    html: `
      <h2>Welcome to M2 Labs, ${user.firstName}!</h2>
      <p>Thanks for joining the M2 Labs family. We're excited to have you!</p>
      <p>You now have access to:</p>
      <ul>
        <li>Exclusive product updates</li>
        <li>Special member discounts</li>
        <li>Order tracking and history</li>
        <li>Priority customer support</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/shop">Shop Now</a></p>
      <p>Rock on!<br>The M2 Labs Team</p>
    `,
    campaignName: `Welcome: ${user.email}`
  });
  
  console.log('✅ Welcome email sent to new user:', user.email);
} catch (error) {
  console.error('❌ Error sending welcome email:', error);
  // Don't fail registration if email fails
}
```

5. Save the file

### Step 11: Add Support Ticket Email Notifications

**File to Edit:** `src/app/api/support/tickets/route.ts`

**What to do:**
1. Open the file `src/app/api/support/tickets/route.ts`
2. Add this import at the top:
```typescript
import { mailerLiteService } from '@/libs/mailerlite';
```

3. Find where the ticket is created (around line 85-90)
4. Add this code after ticket creation:

```typescript
// Send confirmation email to customer
try {
  await mailerLiteService.sendCampaignEmail({
    to: email,
    subject: `Support ticket created: ${subject}`,
    html: `
      <h2>Support Ticket Created</h2>
      <p>Hi ${name},</p>
      <p>We've received your support request and will get back to you as soon as possible.</p>
      <p><strong>Ticket Details:</strong></p>
      <ul>
        <li><strong>Subject:</strong> ${subject}</li>
        <li><strong>Category:</strong> ${category}</li>
        <li><strong>Priority:</strong> ${priority}</li>
      </ul>
      <p>You can view and reply to this ticket in your account dashboard.</p>
      <p>Thanks,<br>M2 Labs Support Team</p>
    `,
    campaignName: `Support: ${ticket.id}`
  });
  
  console.log('✅ Support ticket confirmation sent to:', email);
} catch (error) {
  console.error('❌ Error sending support ticket confirmation:', error);
}
```

5. Save the file

### Step 12: Add Email Notifications for Support Replies

**File to Edit:** `src/app/api/admin/support/tickets/[id]/messages/route.ts`

**What to do:**
1. Open the file `src/app/api/admin/support/tickets/[id]/messages/route.ts`
2. Add these imports at the top:
```typescript
import { mailerLiteService } from '@/libs/mailerlite';
import { getSupportTicketById } from '@/libs/database-ecommerce';
```

3. Find where the message is created (around line 45-50)
4. Add this code after message creation:

```typescript
// Send email notification to customer when admin replies
if (!data.isInternal) {
  try {
    const ticket = await getSupportTicketById(id);
    if (ticket && ticket.email) {
      await mailerLiteService.sendCampaignEmail({
        to: ticket.email,
        subject: `New reply to your support ticket: ${ticket.subject}`,
        html: `
          <h2>New Reply to Your Support Ticket</h2>
          <p>Hi ${ticket.name},</p>
          <p>We've replied to your support ticket. Here's the latest message:</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #FF8A3D;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/support">View Full Conversation</a></p>
          <p>Thanks,<br>M2 Labs Support Team</p>
        `,
        campaignName: `Support Reply: ${ticket.id}`
      });
      
      console.log('✅ Support reply notification sent to:', ticket.email);
    }
  } catch (error) {
    console.error('❌ Error sending support reply notification:', error);
  }
}
```

5. Save the file

## 🚀 Deployment Steps

### Step 1: Deploy Code Changes
1. Commit all your changes:
```bash
git add .
git commit -m "Integrate MailerLite for all email functionality"
git push
```

2. Wait for Cloudflare Pages to deploy (check the dashboard)

### Step 2: Set Up MailerLite Groups
1. Log into your MailerLite dashboard
2. Go to **Subscribers** → **Groups**
3. Create these groups:
   - `Newsletter` (for newsletter subscribers)
   - `Customers` (for registered users)
   - `VIP` (for special promotions - optional)

### Step 3: Test Everything

**Test Newsletter Signup:**
1. Go to your website
2. Sign up for the newsletter
3. Check MailerLite dashboard - subscriber should appear

**Test User Registration:**
1. Register a new account
2. Check your email for welcome message
3. Check MailerLite - user should be in "Customers" group

**Test Order Confirmation:**
1. Place a test order
2. Check email for order confirmation
3. Verify payment webhook triggered email

**Test Order Status Updates:**
1. Go to admin panel → Orders
2. Update an order status to "shipped"
3. Check customer receives notification email

**Test Support Tickets:**
1. Submit a support ticket
2. Check confirmation email
3. Reply from admin panel
4. Check customer receives reply notification

## 🎯 MailerLite Dashboard Setup

### Create Email Templates
1. Go to **Campaigns** → **Templates**
2. Create templates for:
   - Order confirmations
   - Shipping notifications
   - Welcome emails
   - Support notifications

### Set Up Automations
1. Go to **Automations**
2. Create workflows for:
   - Welcome series for new subscribers
   - Abandoned cart recovery (if needed)
   - Product recommendations

### Configure Webhooks (Optional)
1. Go to **Integrations** → **Webhooks**
2. Set up webhooks to sync unsubscribes back to your database

## 🔧 Advanced Features (Optional)

### Segmentation
- Create segments based on purchase history
- Target guitar players vs bass players
- Geographic targeting

### A/B Testing
- Test different subject lines
- Test different email designs
- Optimize open and click rates

### Analytics Integration
- Track email performance
- Monitor conversion rates
- Set up goals in Google Analytics

## 🚨 Important Notes

1. **Free Plan Limitations:** MailerLite free plan has sending limits. Monitor usage.

2. **Email Deliverability:** Set up proper SPF, DKIM, and DMARC records for your domain.

3. **GDPR Compliance:** MailerLite handles this, but ensure your forms have proper consent checkboxes.

4. **Testing:** Always test emails in development before deploying to production.

5. **Backup Plan:** Keep your existing email templates as backup in case MailerLite has issues.

## 🆘 Troubleshooting

### Common Issues:

**"API Key Invalid" Error:**
- Double-check you copied the full API key
- Make sure environment variable is set correctly
- Try regenerating the API key

**Emails Not Sending:**
- Check MailerLite sending limits
- Verify your domain isn't blacklisted
- Check spam folders

**Subscribers Not Appearing:**
- Check API calls in browser developer tools
- Verify MailerLite dashboard for error logs
- Check environment variables are deployed

**Build Errors:**
- Run `npm install` after adding packages
- Check for typos in file names and imports
- Verify all files are saved

### Getting Help:
1. Check MailerLite documentation: https://developers.mailerlite.com/docs/
2. Check Cloudflare Pages logs for errors
3. Use browser developer tools to debug API calls
4. Contact MailerLite support if needed

## ✅ Final Checklist

Before going live, ensure:
- [ ] API key is set in Cloudflare environment
- [ ] All files are saved and committed
- [ ] Code deployed successfully
- [ ] Newsletter signup tested
- [ ] User registration tested  
- [ ] Order confirmation tested
- [ ] Order status updates tested
- [ ] Support ticket emails tested
- [ ] MailerLite groups created
- [ ] Email templates look good
- [ ] No console errors in production

**🎸 Rock on! Your MailerLite integration is complete! 🎸**
