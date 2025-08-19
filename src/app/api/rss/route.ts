import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getNewsPosts } from '@/libs/database-d1';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const posts = await getNewsPosts();
    
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>M2 Labs News</title>
    <description>Latest news and updates from M2 Labs - Guitar pedals, artist features, and more</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    <language>en-US</language>
    <managingEditor>info@m2labs.com (M2 Labs)</managingEditor>
    <webMaster>info@m2labs.com (M2 Labs)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>M2 Labs News System</generator>
    <image>
      <url>${baseUrl}/logos/H-Logo-white.svg</url>
      <title>M2 Labs</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
${posts.map(post => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.fullContent.substring(0, 300) + '...'}]]></description>
      <link>${baseUrl}/news#${post.id}</link>
      <guid isPermaLink="false">${post.id}</guid>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <author>info@m2labs.com (${post.author})</author>
      <category>Music</category>
      ${post.coverImage ? `<enclosure url="${post.coverImage.startsWith('http') ? post.coverImage : baseUrl + post.coverImage}" type="image/jpeg" length="0" />` : ''}
      <content:encoded><![CDATA[
        ${post.coverImage ? `<img src="${post.coverImage.startsWith('http') ? post.coverImage : baseUrl + post.coverImage}" alt="${post.title}" style="max-width: 100%; height: auto; margin-bottom: 15px;" />` : ''}
        <p><strong>${post.excerpt || ''}</strong></p>
        ${post.fullContent}
        <p><em>Published by ${post.author} on ${new Date(post.publishDate).toLocaleDateString()}</em></p>
      ]]></content:encoded>
    </item>`).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json({ error: 'Failed to generate RSS feed' }, { status: 500 });
  }
}
