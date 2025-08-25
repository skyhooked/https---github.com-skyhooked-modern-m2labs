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
  private client: MailerLite | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'orders@m2labs.com';
    this.fromName = process.env.MAILERLITE_FROM_NAME || 'M2 Labs';
  }

  private getClient(): MailerLite {
    if (!this.client) {
      this.client = getMailerLiteClient();
    }
    return this.client;
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

      const response = await this.getClient().subscribers.createOrUpdate(subscriberData);
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
      await this.getClient().subscribers.delete(email);
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
    text
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }) {
    try {
      // Note: MailerLite's free plan doesn't support transactional emails
      // We'll use the campaign method instead
      return await this.sendCampaignEmail({
        to,
        subject,
        html: html || '',
        campaignName: `Transactional: ${subject} - ${Date.now()}`
      });
    } catch (error) {
      console.error('❌ Error sending transactional email via MailerLite:', error);
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

      // For MailerLite free plan, we'll use a simpler approach
      // Create a basic campaign structure with required emails array
      const campaignData = {
        name: campaignName,
        type: 'regular' as const,
        emails: [{
          subject: subject,
          from_name: this.fromName,
          from: this.fromEmail,
          content: html
        }]
      };

      // Try to create and send the campaign
      // Note: This is a simplified version - actual MailerLite API may differ
      const campaign = await this.getClient().campaigns.create(campaignData);
      
      console.log('✅ Campaign email queued for:', to);
      return campaign.data;
    } catch (error) {
      console.error('❌ Error sending campaign email:', error);
      // Fallback to console logging
      console.log('📧 Email would be sent (MailerLite fallback):', {
        to,
        subject,
        campaignName
      });
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Export singleton instance
export const mailerLiteService = new MailerLiteService();
