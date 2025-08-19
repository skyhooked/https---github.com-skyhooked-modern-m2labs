// Newsletter send API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  getCampaignById,
  getActiveSubscribers,
  updateNewsletterCampaign,
  recordNewsletterEvent,
  getTemplateById
} from '@/libs/database-d1';
import { getUserFromToken } from '@/libs/auth';
// Helper function to generate unsubscribe token
function generateUnsubscribeToken(email: string): string {
  // Simple base64 encoding - in production use proper HMAC or JWT
  return Buffer.from(email).toString('base64');
}

// Helper function to generate unsubscribe URL
function generateUnsubscribeUrl(email: string, campaignId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m2labs.com';
  const token = generateUnsubscribeToken(email);
  const params = new URLSearchParams({
    email,
    token
  });
  
  if (campaignId) {
    params.append('campaign', campaignId);
  }
  
  return `${baseUrl}/api/newsletter/unsubscribe?${params.toString()}`;
}

export const runtime = 'edge';

// POST - Send newsletter campaign
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const authUser = token ? await getUserFromToken(token) : null;
    
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeDatabase();
    const body = await request.json();
    const { campaignId, testEmail, sendTest = false } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    // If sending test email
    if (sendTest) {
      if (!testEmail) {
        return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
      }
      
      const testResult = await sendTestEmail(campaign, testEmail);
      return NextResponse.json({
        message: 'Test email sent successfully',
        testResult
      });
    }

    // Get active subscribers
    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 });
    }

    // Update campaign status to sending
    await updateNewsletterCampaign(campaignId, { 
      status: 'sending',
      recipientCount: subscribers.length
    });

    // Process the campaign content
    const processedContent = await processEmailContent(campaign);

    // In a production environment, you would integrate with an email service here
    // For now, we'll simulate the sending process
    const sendResults = await simulateEmailSending(campaign, subscribers, processedContent);

    // Update campaign status to sent
    await updateNewsletterCampaign(campaignId, { 
      status: 'sent',
      sentAt: new Date().toISOString()
    });

    return NextResponse.json({
      message: `Newsletter sent successfully to ${subscribers.length} subscribers`,
      campaignId,
      recipientCount: subscribers.length,
      sendResults
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}

// Helper function to process email content with template variables
async function processEmailContent(campaign: any): Promise<string> {
  let content = campaign.content;
  
  // If using a template, merge template with content
  if (campaign.templateId) {
    const template = await getTemplateById(campaign.templateId);
    if (template) {
      const variables = template.variables || {};
      
      // Replace template variables
      content = template.htmlContent;
      content = content.replace(/\{\{subject\}\}/g, campaign.subject);
      content = content.replace(/\{\{content\}\}/g, campaign.content);
      content = content.replace(/\{\{headerText\}\}/g, variables.headerText || 'Newsletter');
      content = content.replace(/\{\{websiteUrl\}\}/g, variables.websiteUrl || 'https://m2labs.com');
      content = content.replace(/\{\{companyAddress\}\}/g, variables.companyAddress || 'M2 Labs');
    }
  }
  
  return content;
}

// Helper function to send test email
async function sendTestEmail(campaign: any, testEmail: string): Promise<any> {
  const processedContent = await processEmailContent(campaign);
  
  // Add unsubscribe URL for test
  const unsubscribeUrl = generateUnsubscribeUrl(testEmail, campaign.id);
  const finalContent = processedContent.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
  
  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`[TEST EMAIL] Sending to: ${testEmail}`);
  console.log(`[TEST EMAIL] Subject: ${campaign.subject}`);
  console.log(`[TEST EMAIL] Content length: ${finalContent.length} characters`);
  
  return {
    recipient: testEmail,
    subject: campaign.subject,
    contentPreview: finalContent.substring(0, 200) + '...',
    status: 'sent',
    sentAt: new Date().toISOString()
  };
}

// Helper function to simulate email sending (replace with real email service)
async function simulateEmailSending(campaign: any, subscribers: any[], content: string): Promise<any> {
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };

  for (const subscriber of subscribers) {
    try {
      // Generate personalized unsubscribe URL
      const unsubscribeUrl = generateUnsubscribeUrl(subscriber.email, campaign.id);
      const personalizedContent = content.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
      
      // Simulate email sending (in production, use real email service)
      const emailData = {
        to: subscriber.email,
        subject: campaign.subject,
        html: personalizedContent,
        from: 'newsletter@m2labs.com'
      };
      
      // Log for demonstration (remove in production)
      console.log(`[SIMULATED SEND] To: ${subscriber.email}, Subject: ${campaign.subject}`);
      
      // Record analytics event
      await recordNewsletterEvent({
        campaignId: campaign.id,
        subscriberId: subscriber.id,
        eventType: 'sent',
        eventData: { emailData }
      });
      
      results.successful++;
      results.details.push({
        email: subscriber.email,
        status: 'sent',
        sentAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error);
      results.failed++;
      results.details.push({
        email: subscriber.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

// GET - Get campaign send status
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const authUser = token ? await getUserFromToken(token) : null;
    
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    await initializeDatabase();
    const campaign = await getCampaignById(campaignId);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({
      campaignId,
      status: campaign.status,
      recipientCount: campaign.recipientCount,
      openCount: campaign.openCount,
      clickCount: campaign.clickCount,
      unsubscribeCount: campaign.unsubscribeCount,
      bounceCount: campaign.bounceCount,
      sentAt: campaign.sentAt,
      scheduledAt: campaign.scheduledAt
    });
  } catch (error) {
    console.error('Error getting campaign status:', error);
    return NextResponse.json({ error: 'Failed to get campaign status' }, { status: 500 });
  }
}
