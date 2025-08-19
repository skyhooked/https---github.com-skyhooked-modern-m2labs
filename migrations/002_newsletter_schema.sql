-- Newsletter system tables for M2 Labs
-- Run this to add newsletter functionality

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT,
  lastName TEXT,
  userId TEXT, -- NULL if anonymous subscriber, links to users table if registered
  subscriptionDate TEXT NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  preferences TEXT, -- JSON object with subscription preferences
  source TEXT NOT NULL DEFAULT 'website', -- 'website', 'admin', 'import', etc.
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- Newsletter campaigns table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  previewText TEXT,
  content TEXT NOT NULL, -- HTML content
  templateId TEXT, -- Reference to newsletter_templates
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')) DEFAULT 'draft',
  scheduledAt TEXT, -- When to send (NULL for immediate)
  sentAt TEXT, -- When actually sent
  recipientCount INTEGER DEFAULT 0,
  openCount INTEGER DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  unsubscribeCount INTEGER DEFAULT 0,
  bounceCount INTEGER DEFAULT 0,
  createdBy TEXT NOT NULL, -- User ID who created the campaign
  tags TEXT, -- JSON array of tags for organization
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES users (id),
  FOREIGN KEY (templateId) REFERENCES newsletter_templates (id)
);

-- Newsletter templates table
CREATE TABLE IF NOT EXISTS newsletter_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT, -- Preview image URL
  htmlContent TEXT NOT NULL,
  isDefault BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT, -- 'announcement', 'product', 'artist', 'custom', etc.
  variables TEXT, -- JSON object defining template variables
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES users (id)
);

-- Newsletter analytics table (for detailed tracking)
CREATE TABLE IF NOT EXISTS newsletter_analytics (
  id TEXT PRIMARY KEY,
  campaignId TEXT NOT NULL,
  subscriberId TEXT NOT NULL,
  eventType TEXT NOT NULL CHECK (eventType IN ('sent', 'delivered', 'opened', 'clicked', 'unsubscribed', 'bounced')),
  eventData TEXT, -- JSON object with event-specific data (e.g., clicked URL, bounce reason)
  userAgent TEXT,
  ipAddress TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (campaignId) REFERENCES newsletter_campaigns (id),
  FOREIGN KEY (subscriberId) REFERENCES newsletter_subscribers (id)
);

-- Newsletter unsubscribes table (separate from subscribers for audit trail)
CREATE TABLE IF NOT EXISTS newsletter_unsubscribes (
  id TEXT PRIMARY KEY,
  subscriberId TEXT NOT NULL,
  campaignId TEXT, -- NULL if general unsubscribe
  reason TEXT, -- Optional reason from user
  unsubscribeDate TEXT NOT NULL,
  FOREIGN KEY (subscriberId) REFERENCES newsletter_subscribers (id),
  FOREIGN KEY (campaignId) REFERENCES newsletter_campaigns (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_userId ON newsletter_subscribers (userId);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_isActive ON newsletter_subscribers (isActive);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduledAt ON newsletter_campaigns (scheduledAt);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_createdBy ON newsletter_campaigns (createdBy);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_category ON newsletter_templates (category);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_isDefault ON newsletter_templates (isDefault);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_campaignId ON newsletter_analytics (campaignId);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_subscriberId ON newsletter_analytics (subscriberId);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_eventType ON newsletter_analytics (eventType);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_timestamp ON newsletter_analytics (timestamp);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribes_subscriberId ON newsletter_unsubscribes (subscriberId);

-- Insert default newsletter template
INSERT OR IGNORE INTO newsletter_templates (
  id,
  name,
  description,
  htmlContent,
  isDefault,
  category,
  variables,
  createdBy,
  createdAt,
  updatedAt
) VALUES (
  'default-template-001',
  'M2 Labs Default Template',
  'Clean, branded template for M2 Labs newsletters',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-top: 20px; 
        }
        .header { 
            text-align: center; 
            background: #FF8A3D; 
            color: white; 
            padding: 20px; 
            border-radius: 10px 10px 0 0; 
            margin: -20px -20px 20px -20px; 
        }
        .content { 
            padding: 20px 0; 
        }
        .footer { 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
        }
        .btn { 
            display: inline-block; 
            background: #FF8A3D; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        @media only screen and (max-width: 600px) {
            .container { 
                margin: 10px; 
                padding: 15px; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>M2 Labs</h1>
            <p>{{headerText}}</p>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>M2 Labs - Premium Guitar Effects</p>
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{websiteUrl}}">Visit Website</a></p>
            <p>{{companyAddress}}</p>
        </div>
    </div>
</body>
</html>',
  TRUE,
  'default',
  '{"subject":"Newsletter Subject","headerText":"Stay Connected","content":"Newsletter content goes here","unsubscribeUrl":"{{unsubscribeUrl}}","websiteUrl":"https://m2labs.com","companyAddress":"M2 Labs, Your City, State 12345"}',
  'admin-001',
  datetime('now'),
  datetime('now')
);
