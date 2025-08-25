// Email service utilities for M2 Labs
// This is a foundation for email notifications - integrate with Resend, SendGrid, or similar
import { mailerLiteService } from './mailerlite';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

// Email templates for various notifications
export const emailTemplates = {
  orderConfirmation: (order: any): EmailTemplate => ({
    subject: `Order Confirmation #${order.orderNumber} - M2 Labs`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8A3D; color: black; padding: 20px; text-align: center;">
          <h1>M2 Labs</h1>
          <h2>Order Confirmation</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Thank you for your order! We've received your order and it's being processed.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total:</strong> $${(order.total / 100).toFixed(2)}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Items Ordered</h3>
            ${order.items?.map((item: any) => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.variant?.product?.name || 'Product'}</strong></p>
                <p>Variant: ${item.variant?.name}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: $${(item.unitPrice / 100).toFixed(2)}</p>
              </div>
            `).join('') || ''}
          </div>
          
          ${order.shippingAddress ? `
            <div style="margin: 20px 0;">
              <h3>Shipping Address</h3>
              <p>
                ${order.shippingAddress.name}<br>
                ${order.shippingAddress.line1}<br>
                ${order.shippingAddress.line2 ? order.shippingAddress.line2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                ${order.shippingAddress.country}
              </p>
            </div>
          ` : ''}
          
          <p>We'll send you another email when your order ships with tracking information.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" 
               style="background-color: #FF8A3D; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order Status
            </a>
          </div>
        </div>
        
        <div style="background-color: #36454F; color: white; padding: 20px; text-align: center;">
          <p>Questions? Contact us at support@m2labs.com</p>
          <p>M2 Labs - Crafting the Future of Vintage Sound</p>
        </div>
      </div>
    `,
    text: `Order Confirmation #${order.orderNumber} - M2 Labs\n\nThank you for your order! We've received your order and it's being processed.\n\nOrder Number: #${order.orderNumber}\nOrder Date: ${new Date(order.createdAt).toLocaleDateString()}\nTotal: $${(order.total / 100).toFixed(2)}\n\nWe'll send you another email when your order ships.\n\nView your order status: ${process.env.NEXT_PUBLIC_SITE_URL}/account/orders`
  }),

  orderShipped: (order: any, trackingNumber?: string): EmailTemplate => ({
    subject: `Your Order #${order.orderNumber} Has Shipped - M2 Labs`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8A3D; color: black; padding: 20px; text-align: center;">
          <h1>M2 Labs</h1>
          <h2>Your Order Has Shipped!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Great news! Your order #${order.orderNumber} is on its way.</p>
          
          ${trackingNumber ? `
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center;">
              <h3>Tracking Information</h3>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              <a href="#" style="background-color: #FF8A3D; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Track Your Package
              </a>
            </div>
          ` : ''}
          
          <p>You should receive your order within 3-7 business days.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders" 
               style="background-color: #FF8A3D; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
        
        <div style="background-color: #36454F; color: white; padding: 20px; text-align: center;">
          <p>Questions? Contact us at support@m2labs.com</p>
        </div>
      </div>
    `,
    text: `Your Order #${order.orderNumber} Has Shipped!\n\nYour order is on its way and should arrive within 3-7 business days.\n\n${trackingNumber ? `Tracking Number: ${trackingNumber}\n\n` : ''}View order details: ${process.env.NEXT_PUBLIC_SITE_URL}/account/orders`
  }),

  supportTicketReply: (ticket: any, message: string): EmailTemplate => ({
    subject: `Support Ticket Update - ${ticket.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8A3D; color: black; padding: 20px; text-align: center;">
          <h1>M2 Labs Support</h1>
          <h2>Ticket Update</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>We've responded to your support ticket:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>${ticket.subject}</h3>
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4>Our Response:</h4>
            <p>${message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/support/ticket/${ticket.id}" 
               style="background-color: #FF8A3D; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Ticket
            </a>
          </div>
        </div>
        
        <div style="background-color: #36454F; color: white; padding: 20px; text-align: center;">
          <p>M2 Labs Support Team</p>
        </div>
      </div>
    `,
    text: `Support Ticket Update - ${ticket.subject}\n\nWe've responded to your support ticket.\n\nTicket ID: ${ticket.id}\n\nOur Response:\n${message}\n\nView ticket: ${process.env.NEXT_PUBLIC_SITE_URL}/support/ticket/${ticket.id}`
  }),

  welcomeEmail: (user: any): EmailTemplate => ({
    subject: 'Welcome to M2 Labs!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8A3D; color: black; padding: 20px; text-align: center;">
          <h1>Welcome to M2 Labs!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi ${user.firstName},</p>
          
          <p>Welcome to the M2 Labs family! We're excited to have you join our community of musicians and tone enthusiasts.</p>
          
          <p>Here's what you can do with your new account:</p>
          <ul>
            <li>Shop our handcrafted guitar pedals</li>
            <li>Save your favorite products to your wishlist</li>
            <li>Track your orders and warranty claims</li>
            <li>Get exclusive updates and offers</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/shop" 
               style="background-color: #FF8A3D; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Shopping
            </a>
          </div>
        </div>
        
        <div style="background-color: #36454F; color: white; padding: 20px; text-align: center;">
          <p>Crafting the Future of Vintage Sound</p>
        </div>
      </div>
    `,
    text: `Welcome to M2 Labs!\n\nHi ${user.firstName},\n\nWelcome to the M2 Labs family! We're excited to have you join our community.\n\nStart shopping: ${process.env.NEXT_PUBLIC_SITE_URL}/shop`
  })
};

// Email service interface - implement with your preferred provider
export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@m2labs.com';
  }

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

      // Example implementation for Resend:
      /*
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from || this.fromEmail,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      return response.ok;
      */

      // For now, return true to simulate successful sending
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendOrderConfirmation(order: any): Promise<boolean> {
    const template = emailTemplates.orderConfirmation(order);
    return this.sendEmail({
      to: order.customer?.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendOrderShipped(order: any, trackingNumber?: string): Promise<boolean> {
    const template = emailTemplates.orderShipped(order, trackingNumber);
    return this.sendEmail({
      to: order.customer?.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSupportReply(ticket: any, message: string): Promise<boolean> {
    const template = emailTemplates.supportTicketReply(ticket, message);
    return this.sendEmail({
      to: ticket.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(user: any): Promise<boolean> {
    const template = emailTemplates.welcomeEmail(user);
    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();
