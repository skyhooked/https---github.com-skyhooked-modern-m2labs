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
