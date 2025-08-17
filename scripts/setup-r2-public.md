# Enable R2 Public Access

To enable public access for your R2 bucket, you need to:

## Option 1: Enable Public Development URL (Recommended for testing)

1. Go to Cloudflare Dashboard → R2 Object Storage
2. Click on your `m2labs-images` bucket
3. Go to **Settings** tab
4. Under **Public access**, click **Connect Domain**
5. Choose **Public Development URL**
6. Enable it - this will give you a URL like: `https://pub-abc123.r2.dev`

## Option 2: Custom Domain (Production)

1. In the same **Settings** tab
2. Click **Connect Domain** → **Custom Domain**
3. Add a domain like `images.m2labs.com`
4. Follow DNS setup instructions

## Current Implementation

Our current setup uses `/api/images/[...path]` to serve images from R2, which:
- ✅ Works without public URLs
- ✅ Provides proper caching headers  
- ✅ Handles authentication if needed later
- ✅ Works immediately without additional setup

The R2 bucket doesn't need public access enabled for our current implementation to work.
