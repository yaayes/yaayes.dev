# Quick Start Guide

Get your blog running locally in 5 minutes!

## For Development (Using Devcontainer)

### 1. Open in VS Code Devcontainer

```bash
# Clone the repository
git clone <your-repo-url>
cd my-blog

# Open in VS Code
code .
```

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and select:
**"Dev Containers: Reopen in Container"**

VS Code will build and start the devcontainer automatically.

### 2. Start Development Server

Once inside the container:

```bash
npm run dev
```

Visit `http://localhost:4321`

### 3. Make Your First Changes

1. **Update your info** in [src/pages/index.astro](src/pages/index.astro):
   - Change the name from "Yassine"
   - Update the bio text
   - Update social media links

2. **Write your first post**:
   - Copy an example from [src/content/posts/](src/content/posts/)
   - Rename it (e.g., `my-first-post.mdx`)
   - Update the frontmatter and content
   - Save and see it live!

3. **Customize colors** in [src/styles/global.css](src/styles/global.css)

### 4. Build for Production

```bash
npm run build
npm run preview
```

Visit `http://localhost:4321` to see the production build.

## Next Steps

- Read the full [README.md](README.md) for all features
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to Cloudflare Pages
- Write more blog posts in `src/content/posts/`
- Customize the design to match your style

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run astro check      # Type check
```

## Project Structure Quick Reference

```
src/
├── pages/
│   ├── index.astro              # Home page (CUSTOMIZE THIS)
│   ├── blog/
│   │   ├── index.astro          # Blog list
│   │   └── [slug].astro         # Blog post pages
│   └── contact.astro            # Contact form
├── content/
│   └── posts/                   # Your blog posts (ADD POSTS HERE)
├── layouts/
│   ├── Layout.astro             # Base layout
│   └── BlogPost.astro           # Blog post layout
├── components/
│   ├── Header.astro             # Navigation
│   └── Search.astro             # Search component
└── styles/
    └── global.css               # TailwindCSS + custom styles
```

## Troubleshooting

### Container won't start

```bash
# Rebuild container
Ctrl+Shift+P → "Dev Containers: Rebuild Container"
```

### Port 4321 already in use

```bash
# Find and kill the process
docker ps
docker stop <container-id>
```

### npm install fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Need Help?

- [Full Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Astro Docs](https://docs.astro.build)
- [Tailwind Docs](https://tailwindcss.com/docs)

---

Happy blogging!
