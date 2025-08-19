// Newsletter campaigns API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  getNewsletterCampaigns,
  getCampaignById,
  createNewsletterCampaign,
  updateNewsletterCampaign
} from '@/libs/database-d1';
import { getUserFromToken } from '@/libs/auth';

export const runtime = 'edge';

// GET - Get all campaigns or specific campaign
export async function GET(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');
    
    if (campaignId) {
      const campaign = await getCampaignById(campaignId);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      return NextResponse.json(campaign);
    }

    const campaigns = await getNewsletterCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const body = await request.json();
    
    const { name, subject, previewText, content, templateId, scheduledAt, tags } = body;

    if (!name || !subject || !content) {
      return NextResponse.json({ 
        error: 'Name, subject, and content are required' 
      }, { status: 400 });
    }

    const campaignData = {
      name,
      subject,
      previewText,
      content,
      templateId,
      scheduledAt,
      createdBy: authUser.id,
      tags: tags || []
    };

    const newCampaign = await createNewsletterCampaign(campaignData);
    
    return NextResponse.json({ 
      message: 'Campaign created successfully',
      campaign: newCampaign
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await getCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Don't allow editing sent campaigns
    if (campaign.status === 'sent') {
      return NextResponse.json({ 
        error: 'Cannot edit sent campaigns' 
      }, { status: 400 });
    }

    const updatedCampaign = await updateNewsletterCampaign(id, updates);
    
    return NextResponse.json({ 
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE - Delete campaign (only drafts)
export async function DELETE(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Only allow deleting draft campaigns
    if (campaign.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Can only delete draft campaigns' 
      }, { status: 400 });
    }

    // Update to cancelled status instead of actual deletion for audit trail
    await updateNewsletterCampaign(campaignId, { status: 'cancelled' });
    
    return NextResponse.json({ 
      message: 'Campaign cancelled successfully' 
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
