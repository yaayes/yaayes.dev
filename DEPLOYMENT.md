# Deployment Guide

Step-by-step guide to deploy your blog to production.

## Prerequisites Checklist

- [ ] GitHub repository created
- [ ] Cloudflare account created
- [ ] AWS account created (for SES)
- [ ] Domain connected to Cloudflare (optional, but recommended)

## Step 1: AWS SES Setup (15 minutes)

### 1.1 Verify Email

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Region: Select your preferred region (e.g., us-east-1)
3. Click "Verified identities" → "Create identity"
4. Select "Email address"
5. Enter your email (this will be the FROM email)
6. Click "Create identity"
7. Check your email and click the verification link

### 1.2 Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/home#/users)
2. Click "Add users"
3. Username: `blog-ses-sender`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Click "Create policy"
8. Use JSON tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

9. Name it `SESSendEmailPolicy`
10. Go back and attach this policy to the user
11. Click "Next" until "Create user"
12. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### 1.3 Request Production Access

1. In SES console, click "Account dashboard"
2. Click "Request production access"
3. Fill the form:
   - **Mail type**: Transactional
   - **Website URL**: Your blog URL
   - **Use case description**:
     ```
     Personal technical blog contact form. Estimated 10-50 emails per month.
     Users fill a contact form and messages are forwarded to my email.
     ```
4. Submit and wait for approval (usually < 24 hours)

**Note**: While in sandbox mode, you can only send to verified emails. Add your personal email as verified identity for testing.

## Step 2: Cloudflare Worker Setup (10 minutes)

### 2.1 Install Dependencies

```bash
cd worker
npm install
```

### 2.2 Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window. Authorize Wrangler.

### 2.3 Create KV Namespace

```bash
npx wrangler kv:namespace create KV
```

Output will look like:

```
{ binding = "KV", id = "abcd1234..." }
```

Copy the `id` and update `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "KV", id = "YOUR_ID_HERE" }
]
```

### 2.4 Get Cloudflare Zone ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain (or skip if you don't have one yet)
3. Scroll down to "Zone ID" on the overview page
4. Copy it and update `wrangler.toml`:

```toml
CLOUDFLARE_ZONE_ID = "YOUR_ZONE_ID"
```

### 2.5 Create Cloudflare API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Read Analytics" template or create custom:
   - Permissions: Zone → Analytics → Read
   - Zone Resources: Include → Specific zone → Your domain
4. Create token and copy it

### 2.6 Update wrangler.toml

Edit `worker/wrangler.toml`:

```toml
[vars]
AWS_REGION = "us-east-1"  # Your AWS region
SES_FROM_EMAIL = "noreply@yourdomain.com"  # Your verified SES email
SES_TO_EMAIL = "your@email.com"  # Where contact forms should be sent
CLOUDFLARE_ZONE_ID = "YOUR_ZONE_ID"
```

### 2.7 Set Secrets

```bash
cd worker

# AWS credentials
npx wrangler secret put AWS_ACCESS_KEY_ID
# Paste the access key from Step 1.2

npx wrangler secret put AWS_SECRET_ACCESS_KEY
# Paste the secret key from Step 1.2

# Cloudflare API token
npx wrangler secret put CLOUDFLARE_API_TOKEN
# Paste the token from Step 2.5
```

### 2.8 Deploy Worker

```bash
npx wrangler deploy
```

Output will show your Worker URL:

```
https://blog-worker.YOUR_SUBDOMAIN.workers.dev
```

**Save this URL!** You'll need it in the next step.

## Step 3: Update Frontend with Worker URL (5 minutes)

Replace `YOUR_WORKER_URL` in these files with your actual Worker URL:

### 3.1 src/pages/index.astro

```javascript
const response = await fetch('https://YOUR_ACTUAL_WORKER_URL.workers.dev/popular-posts', {
```

### 3.2 src/pages/contact.astro

```javascript
const WORKER_URL = "https://YOUR_ACTUAL_WORKER_URL.workers.dev";
```

### 3.3 src/layouts/BlogPost.astro

```javascript
const WORKER_URL = "https://YOUR_ACTUAL_WORKER_URL.workers.dev";
```

### 3.4 Commit and push

```bash
git add .
git commit -m "Configure Worker URL"
git push origin main
```

## Step 4: Configure giscus (5 minutes)

### 4.1 Enable Discussions

1. Go to your GitHub repository
2. Settings → General → Features
3. Check "Discussions"

### 4.2 Configure giscus

1. Go to [giscus.app](https://giscus.app)
2. Enter your repository: `username/repo-name`
3. Under "Discussion Category", select "General" (or create a new one)
4. Copy the configuration values

### 4.3 Update BlogPost.astro

Edit `src/layouts/BlogPost.astro`:

```html
<div
  class="giscus"
  data-repo="YOUR_USERNAME/YOUR_REPO"
  data-repo-id="YOUR_REPO_ID"
  data-category="General"
  data-category-id="YOUR_CATEGORY_ID"
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="top"
  data-theme="preferred_color_scheme"
  data-lang="en"
  data-loading="lazy"
  crossorigin="anonymous"
  async
></div>
```

Commit and push:

```bash
git add src/layouts/BlogPost.astro
git commit -m "Configure giscus"
git push origin main
```

## Step 5: Deploy to Cloudflare Pages (10 minutes)

### 5.1 Connect Repository

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Click "Connect to Git"
4. Select GitHub
5. Authorize Cloudflare
6. Select your blog repository

### 5.2 Configure Build

**Build settings**:

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (leave empty)

**Environment variables**:
Click "Add variable" for:

- Name: `NODE_VERSION`
- Value: `24`

### 5.3 Deploy

1. Click "Save and Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Your site will be live at: `https://YOUR_PROJECT.pages.dev`

### 5.4 Custom Domain (Optional)

1. Go to your project → "Custom domains"
2. Click "Set up a custom domain"
3. Enter your domain: `blog.yourdomain.com`
4. Follow DNS setup instructions
5. Wait for SSL certificate (automatic, ~5 minutes)

## Step 6: Update Site Configuration (2 minutes)

Edit `astro.config.mjs`:

```javascript
export default defineConfig({
  site: "https://yourdomain.com", // Your actual domain
  // ... rest of config
});
```

Commit and push:

```bash
git add astro.config.mjs
git commit -m "Update site URL"
git push origin main
```

Cloudflare Pages will automatically rebuild and deploy.

## Step 7: Test Everything (10 minutes)

### 7.1 Test Contact Form

1. Go to `/contact`
2. Fill out the form
3. Submit
4. Check your email (the TO email from wrangler.toml)

### 7.2 Test Reactions

1. Go to any blog post
2. Click reaction buttons
3. Refresh page - counts should persist

### 7.3 Test Comments

1. Go to any blog post
2. Scroll to comments section
3. Sign in with GitHub
4. Post a test comment

### 7.4 Test Search

1. Go to `/blog`
2. Use the search bar
3. Try searching for keywords from your posts

### 7.5 Test Dark Mode

1. Click the theme toggle in the header
2. Refresh page - preference should persist
3. Try changing system theme - should follow if no manual override

## Step 8: Monitor (Optional)

### 8.1 Cloudflare Analytics

1. Go to Cloudflare Pages → Your project → Analytics
2. View traffic, bandwidth, and requests

### 8.2 Worker Logs

```bash
cd worker
npx wrangler tail
```

Keep this running to see real-time logs.

### 8.3 Popular Posts

The Worker runs every Sunday at midnight to update popular posts. To manually trigger:

```bash
cd worker
npx wrangler dev
# In another terminal:
curl -X POST http://localhost:8787/__scheduled
```

## Troubleshooting

### Contact Form: Email not sending

1. Check AWS SES sandbox mode - verify recipient email
2. Check Worker logs: `npx wrangler tail`
3. Verify AWS credentials are correct
4. Check SES sending limits

### Reactions: Not persisting

1. Check Worker logs for errors
2. Verify KV namespace is correctly configured
3. Check CORS headers in Worker

### Comments: Not loading

1. Verify GitHub Discussions is enabled
2. Check giscus configuration values
3. Check browser console for errors
4. Verify repository is public (or user has access)

### Build: Failing on Cloudflare Pages

1. Check Node version is set to 24
2. Check build logs for specific errors
3. Verify all dependencies are in package.json
4. Try building locally: `npm run build`

### Popular Posts: Not updating

1. Check CLOUDFLARE_API_TOKEN is set correctly
2. Check CLOUDFLARE_ZONE_ID matches your domain
3. View Worker logs during scheduled run
4. Manually trigger to test: see Step 8.3

## Post-Deployment Checklist

- [ ] Contact form working
- [ ] Reactions working
- [ ] Comments working
- [ ] Search working
- [ ] Dark mode toggle working
- [ ] Custom domain configured (if applicable)
- [ ] Site URL updated in astro.config.mjs
- [ ] Social links updated in index.astro
- [ ] About section personalized
- [ ] First blog post published
- [ ] README updated with your information
- [ ] AWS SES production access requested

## Next Steps

1. **Write content**: Add more blog posts
2. **SEO**: Add sitemap and robots.txt (Astro can generate these)
3. **Analytics**: Consider adding Plausible or Cloudflare Web Analytics
4. **Performance**: Run Lighthouse and optimize
5. **Social sharing**: Add Open Graph meta tags
6. **RSS Feed**: Add RSS feed for subscribers
7. **Newsletter**: Consider adding email newsletter (Buttondown, ConvertKit)

## Maintenance

### Regular tasks

- **Weekly**: Check popular posts are updating
- **Monthly**: Review AWS SES usage and costs
- **Quarterly**: Update dependencies
- **Yearly**: Renew domain registration

### Updates

```bash
# Update Astro and dependencies
npm update

# Update Worker dependencies
cd worker
npm update

# Rebuild and deploy
npm run build
git add .
git commit -m "Update dependencies"
git push origin main
```

## Cost Estimates

Assuming moderate traffic (1,000 visitors/month):

| Service              | Monthly Cost    | Notes                            |
| -------------------- | --------------- | -------------------------------- |
| Cloudflare Pages     | **$0**          | Unlimited bandwidth on free tier |
| Cloudflare Workers   | **$0**          | Well under 100K requests/day     |
| Workers KV           | **$0**          | Under limits                     |
| AWS SES              | **$0**          | Free tier: 62K emails/month      |
| Cloudflare Analytics | **$0**          | Free on all plans                |
| GitHub               | **$0**          | Public repos                     |
| Domain               | **$10-15/year** | Only paid component              |

**Total: ~$1/month** (or $0 if using .pages.dev subdomain)

---

**Congratulations!** Your blog is now live and fully functional.

If you encounter any issues, refer to the troubleshooting section or check the main README.
