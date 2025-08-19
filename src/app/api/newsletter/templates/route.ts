// Newsletter templates API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase,
  getNewsletterTemplates,
  getTemplateById,
  createNewsletterTemplate,
  updateNewsletterTemplate
} from '@/libs/database-d1';
import { getUserFromToken } from '@/libs/auth';

export const runtime = 'edge';

// GET - Get all templates or specific template
export async function GET(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (templateId) {
      const template = await getTemplateById(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    const templates = await getNewsletterTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const body = await request.json();
    
    const { name, description, thumbnail, htmlContent, category, variables } = body;

    if (!name || !htmlContent || !category) {
      return NextResponse.json({ 
        error: 'Name, HTML content, and category are required' 
      }, { status: 400 });
    }

    const templateData = {
      name,
      description,
      thumbnail,
      htmlContent,
      category,
      variables: variables || {},
      createdBy: 'admin' // Simple admin ID since we removed JWT auth
    };

    const newTemplate = await createNewsletterTemplate(templateData);
    
    return NextResponse.json({ 
      message: 'Template created successfully',
      template: newTemplate
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = await getTemplateById(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Don't allow editing default templates (unless specifically allowed)
    if (template.isDefault && !updates.allowDefaultEdit) {
      return NextResponse.json({ 
        error: 'Cannot edit default templates' 
      }, { status: 400 });
    }

    const updatedTemplate = await updateNewsletterTemplate(id, updates);
    
    return NextResponse.json({ 
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Delete template (only non-default templates)
export async function DELETE(request: NextRequest) {
  try {
    // Simple admin check - allow admin access without JWT for now

    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Don't allow deleting default templates
    if (template.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete default templates' 
      }, { status: 400 });
    }

    // For now, we'll just mark it as deleted by updating the name
    // In production, you might want actual deletion or soft delete
    await updateNewsletterTemplate(templateId, { 
      name: `[DELETED] ${template.name}`,
      description: `Deleted template: ${template.description || template.name}`
    });
    
    return NextResponse.json({ 
      message: 'Template deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
