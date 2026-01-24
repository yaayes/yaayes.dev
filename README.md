# My Technical Blog

A modern, fast, and beautiful technical blog built with Astro, TailwindCSS, and deployed on Cloudflare Pages.

## Features

- **Modern Stack**: Astro + TailwindCSS + MDX
- **Dark Mode**: System-based with manual toggle
- **Search**: Pagefind for fast, client-side search
- **Comments**: giscus (GitHub Discussions)
- **Reactions**: Like, heart, and celebrate buttons
- **Contact Form**: Cloudflare Worker + AWS SES
- **Analytics**: Weekly popular posts from Cloudflare Analytics API
- **Fast**: Optimized for performance
- **Responsive**: Mobile-first design

## Project Structure

```
/
├── .devcontainer/          # VS Code devcontainer configuration
│   └── devcontainer.json
├── src/
│   ├── components/         # Reusable Astro components
│   │   ├── Header.astro
│   │   └── Search.astro
│   ├── content/
│   │   ├── config.ts       # Content collections schema
│   │   └── posts/          # MDX blog posts
│   ├── layouts/
│   │   ├── Layout.astro    # Base layout with dark mode
│   │   └── BlogPost.astro  # Blog post layout
│   ├── pages/
│   │   ├── index.astro     # Home page
│   │   ├── blog/
│   │   │   ├── index.astro # Blog list
│   │   │   └── [slug].astro # Dynamic blog post pages
│   │   └── contact.astro   # Contact form
│   └── styles/
│       └── global.css      # TailwindCSS + custom styles
├── worker/                 # Cloudflare Worker
│   ├── index.js            # Worker code
│   ├── wrangler.toml       # Worker configuration
│   └── package.json
├── public/                 # Static assets
├── astro.config.mjs        # Astro configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 24 (LTS)
- Docker (for devcontainer)

### Development Setup

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd my-blog
```

2. **Open in devcontainer** (recommended)
   - Open in VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Select "Dev Containers: Reopen in Container"

3. **Install dependencies**

```bash
npm install
```

4. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:4321` to see your blog!

### Building for Production

```bash
npm run build
```

This will:

1. Build the Astro site to `dist/`
2. Generate Pagefind search index

Preview the production build:

```bash
npm run preview
```

## Configuration

### Update Site Information

Edit [src/pages/index.astro](src/pages/index.astro) to customize:

- Your name and bio
- Social media links (update URLs)
- Profile emoji/image

### Configure giscus

1. Enable GitHub Discussions on your repository
2. Go to [giscus.app](https://giscus.app)
3. Follow the setup instructions
4. Update the giscus configuration in [src/layouts/BlogPost.astro](src/layouts/BlogPost.astro):
   - `data-repo="YOUR_GITHUB_USERNAME/YOUR_REPO"`
   - `data-repo-id="YOUR_REPO_ID"`
   - `data-category-id="YOUR_CATEGORY_ID"`

### Update Astro Config

Edit [astro.config.mjs](astro.config.mjs):

- Set your `site` URL (for RSS and sitemaps)
- Customize Shiki theme for code blocks

## Cloudflare Worker Setup

### 1. Install Wrangler

```bash
cd worker
npm install
```

### 2. Create KV Namespace

```bash
npx wrangler kv:namespace create KV
```

Copy the namespace ID and update `wrangler.toml` with:

```toml
kv_namespaces = [
  { binding = "KV", id = "YOUR_KV_NAMESPACE_ID" }
]
```

### 3. Set Environment Variables

Edit [worker/wrangler.toml](worker/wrangler.toml):

- `AWS_REGION` (e.g., "us-east-1")
- `SES_FROM_EMAIL` (verified email in AWS SES)
- `SES_TO_EMAIL` (your email to receive contact forms)
- `CLOUDFLARE_ZONE_ID` (from Cloudflare dashboard)

### 4. Set Secrets

```bash
cd worker
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

### 5. Deploy Worker

```bash
npx wrangler deploy
```

Note the deployed Worker URL (e.g., `https://blog-worker.your-subdomain.workers.dev`)

### 6. Update Worker URLs in Frontend

Replace `YOUR_WORKER_URL` in these files with your actual Worker URL:

- [src/pages/index.astro](src/pages/index.astro) (popular posts)
- [src/pages/contact.astro](src/pages/contact.astro) (contact form)
- [src/layouts/BlogPost.astro](src/layouts/BlogPost.astro) (reactions)

## AWS SES Setup

### 1. Verify Email Address

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Choose "Email address"
5. Enter your email and verify it

### 2. Request Production Access

By default, AWS SES is in sandbox mode (can only send to verified emails).

1. In SES console, click "Request production access"
2. Fill out the form explaining your use case
3. Wait for approval (usually 24 hours)

### 3. Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user for SES
3. Attach this policy:

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

4. Create access keys and save them securely
5. Add them as Worker secrets (see step 4 above)

## Cloudflare Pages Deployment

### Option 1: Via Dashboard (Recommended)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
   - **Node version**: 24
5. Click "Save and Deploy"

### Option 2: Via Wrangler

```bash
npx wrangler pages deploy dist --project-name=my-blog
```

### Automatic Deployments

Cloudflare Pages automatically deploys when you push to `main` branch.

For preview deployments on pull requests, enable it in Cloudflare Pages settings.

## Cloudflare Analytics API Setup

### 1. Get Zone ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Scroll down on the Overview page to find "Zone ID"
4. Copy it and add to `worker/wrangler.toml`

### 2. Create API Token

1. Go to [API Tokens page](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit zone DNS" template or custom token with:
   - **Permissions**: Zone > Analytics > Read
   - **Zone Resources**: Include > Specific zone > Your domain
4. Create token and copy it
5. Add as Worker secret:

```bash
cd worker
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

### 3. Scheduled Updates

The Worker is configured to run every Sunday at midnight (see `wrangler.toml`):

```toml
[triggers]
crons = ["0 0 * * 0"]
```

This queries the Analytics API and updates the `popular-posts` KV key with the top 10 most viewed blog posts from the past week.

## Writing Blog Posts

### Create New Post

Create a new `.mdx` file in `src/content/posts/`:

````mdx
---
title: "Your Awesome Post Title"
description: "A compelling description for SEO"
pubDate: 2026-01-24
updatedDate: 2026-01-25 # Optional
author: "Yassine"
tags: ["devops", "kubernetes", "tutorial"]
draft: false # Set to true to hide from production
image: "/images/post-cover.jpg" # Optional
---

# Your Content Here

Write your post content using **Markdown** and _MDX_.

## Code Blocks

```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

## Images

![Alt text](/images/diagram.png)

You can also use Astro components in MDX!

````

### Frontmatter Fields

- `title` (required): Post title
- `description` (required): SEO description
- `pubDate` (required): Publication date
- `updatedDate` (optional): Last updated date
- `author` (optional): Defaults to "Yassine"
- `tags` (optional): Array of tags
- `draft` (optional): Hide from production if true
- `image` (optional): Cover image URL

## Customization

### Colors

Edit CSS custom properties in [src/styles/global.css](src/styles/global.css):

```css
:root {
  --color-text: 15 23 42;        /* Text color (slate-900) */
  --color-bg: 255 255 255;       /* Background (white) */
  --color-border: 226 232 240;   /* Borders (slate-200) */
  --color-primary: 59 130 246;   /* Primary color (blue-500) */
}

.dark {
  --color-text: 226 232 240;     /* Dark mode text (slate-200) */
  --color-bg: 15 23 42;          /* Dark mode bg (slate-900) */
  --color-border: 51 65 85;      /* Dark mode borders (slate-700) */
  --color-primary: 96 165 250;   /* Dark mode primary (blue-400) */
}
````

### Fonts

Add fonts in [src/layouts/Layout.astro](src/layouts/Layout.astro):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

Then update the CSS:

```css
body {
  font-family: "Inter", sans-serif;
}
```

### Components

Create reusable components in `src/components/` and use them in MDX posts:

```astro
---
// src/components/Callout.astro
interface Props {
  type?: 'info' | 'warning' | 'error';
}

const { type = 'info' } = Astro.props;
---

<div class={`callout callout-${type}`}>
  <slot />
</div>
```

## Performance

The blog is optimized for performance:

- Static generation (no client-side JavaScript for content)
- Minimal JavaScript bundle (~10KB)
- Image optimization with Astro's Image component
- Pagefind search (client-side, no backend)
- TailwindCSS (purged unused styles)
- Code splitting
- Lazy loading

Target Lighthouse scores:

- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Free Tier Limits

Everything runs on free tiers:

| Service                  | Free Tier                    | Your Usage               |
| ------------------------ | ---------------------------- | ------------------------ |
| Cloudflare Pages         | Unlimited bandwidth          | Well within              |
| Cloudflare Workers       | 100K requests/day            | Sufficient               |
| Workers KV               | 100K reads, 1K writes/day    | More than enough         |
| AWS SES                  | 62K emails/month (free tier) | Plenty for contact forms |
| Cloudflare Analytics API | 300 queries/5min             | One query per week       |
| giscus (GitHub)          | Unlimited                    | Free forever             |

**Estimated monthly cost: $0**

## Troubleshooting

### Build fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 24.x
```

### Pagefind not working

Ensure the build command includes Pagefind:

```json
{
  "scripts": {
    "build": "astro build && npx pagefind --site dist"
  }
}
```

### Worker deployment fails

```bash
# Login to Cloudflare
npx wrangler login

# Check configuration
npx wrangler whoami
```

### Dark mode not persisting

Clear localStorage and try again:

```javascript
localStorage.clear();
location.reload();
```

## License

MIT

## Support

- **Issues**: Open an issue on GitHub
- **Questions**: Use GitHub Discussions
- **Contact**: Use the contact form on the blog

---

Built with love using [Astro](https://astro.build)
