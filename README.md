

# Astro Blog Template


A modern, minimal and good-looking personal blog template built with **Astro 7** and **Tailwind CSS 4** — the homepage is left blank for you to build on. Fully static, zero client-side JavaScript by default, and easy to customize from a single config file.

[![Astro](screenshots/astro-7.1.svg)](https://astro.build)
[![Tailwind CSS](screenshots/tailwindcss-4.svg)](https://tailwindcss.com)
[![License](screenshots/license-mit.svg)](LICENSE)
[![Node.js](screenshots/node-22.svg)](https://nodejs.org)

> **English** | [简体中文](./README.md)

> 🌐 Live demo: <https://ruijieking.github.io>

## 📸 Preview

![Home](screenshots/main.png)

## ✨ Features

- **Minimal** — a lightweight, good-looking basic blog, ready to extend
- 🌗 **Dark / Light theme** with FOUC (flash-of-unstyled-content) protection, remembers your choice
- 🖼️ **Wallpaper system** — separate wallpaper sets per theme, cross-fade transitions, persisted per theme
- 📝 **Blog** powered by Astro content collections (title, description, pubDate, category, tags)
- 📚 **Archive timeline** grouped by year, with **instant search** and **multi-tag filtering**
- 💬 **Daily Talk** — a lightweight microblog / short-note section
- 📷 **Photo albums** — folder-based albums with stacked covers and a **lightbox** viewer
- 📑 **Table of contents** auto-generated from headings on each post page
- 🔍 **Full SEO** — Open Graph, Twitter Cards, canonical URLs, and JSON-LD structured data
- 📡 **RSS feed**, **sitemap**, and **robots.txt**
- ✨ Scroll-in animations and frosted-glass card design
- 📱 Fully responsive, with a mobile hamburger menu
- ⚡ **Optimized images** out of the box (`astro:assets` + `sharp`, WebP output)
- 🚀 **One-command deploy** to GitHub Pages via GitHub Actions

## �️ Screenshots

| Home | Post |
| --- | --- |
| ![Home](screenshots/csreenshuot-home.png) | ![Post](screenshots/screenshots-post.png) |

| Archive | Talk |
| --- | --- |
| ![Archive](screenshots/screenshot-archive.png) | ![Talk](screenshots/screenshot-talk.png) |

## �🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.12.0
- npm (or pnpm / yarn)

### 1. Install

```bash
npm install
```

### 2. Develop

Start the dev server at <http://localhost:4321>:

```bash
npm run dev
```

### 3. Build & Preview

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

## 🎨 Customization

Everything you need to personalize the site lives in **one file**: `src/site.config.ts`. Change it once and the whole site updates automatically.

```ts
export const site = {
  name: 'My Blog',                    // site name (logo, footer, page titles, SEO)
  defaultTitle: 'My Blog',            // fallback page title
  description: 'Write code, take photos, record life.',
  url: 'https://example.com',         // your site domain
  ogImage: '/og.png',                 // social share image (public/, 1200×630)
  ogSiteName: 'My Blog',              // name shown on share cards
  author: {
    name: 'Your Name',
    github: 'your-github-username',
    location: 'Your City',
  },
  about: 'This is my personal blog, built with Astro.',
  nav: [
    { href: '/talk', label: 'Talk' },
    { href: '/blog', label: 'Blog' },
    { href: '/archive', label: 'Archive' },
    { href: '/photo', label: 'Photo' },
    { href: '/about', label: 'About' },
  ],
};
```

## 📝 Adding Content

### Blog posts

Add a Markdown file to `src/content/blog/`:

```md
---
title: 'Hello World'         # required
description: 'My first post' # required
pubDate: '2026-01-01'        # required
category: 'Life'             # optional
tags: ['astro', 'blog']      # optional
---

Content here…
```

### Daily Talk

Add a Markdown file to `src/content/talk/` (no title required):

```md
---
update: '2026-01-01-12:00'
---

Short note text…
```

### Photo albums

Create a folder inside `src/assets/album/` — **each folder becomes an album (the folder name becomes the album name)**, and its images are displayed automatically:

```
src/assets/album/
├── Trip/          ← album: "Trip"
│   ├── photo1.jpg
│   └── photo2.png
└── Daily/
    └── photo3.jpg
```

### Wallpapers

Place wallpapers in `src/assets/wallpaper/`:

```
src/assets/wallpaper/
├── light/         ← wallpapers shown in light theme
└── dark/          ← wallpapers shown in dark theme
```

A file named `默认light.png` / `默认dark.png` (or the first file in each folder) is used as the default wallpaper.

## 🗂️ Project Structure

```
├── public/                 # static assets (favicon, og.png)
├── src/
│   ├── assets/
│   │   ├── album/          # photo albums (folder = album)
│   │   └── wallpaper/      # theme wallpapers (light/ dark/)
│   ├── components/         # UI components
│   ├── content/
│   │   ├── blog/           # blog posts (.md)
│   │   └── talk/           # daily talk notes (.md)
│   ├── layouts/            # BaseLayout (theme, wallpapers, SEO)
│   ├── pages/              # routes
│   ├── styles/global.css   # Tailwind entry
│   ├── content.config.ts   # content collection schemas
│   └── site.config.ts      # ⭐ global site config
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🚢 Deployment

### GitHub Pages (highly recommended if you don't need a backend — free and simple)

The included workflow at `.github/workflows/deploy.yml` builds and deploys automatically on every push to `main`:

1. Push this template to a GitHub repository.
2. Go to **Settings → Pages** and set the source to **GitHub Actions**.
3. Done — every push to `main` now rebuilds and redeploys.

### Other platforms

This is a static site — run `npm run build` and deploy the `dist/` folder to any host:

- **Netlify**: build command `npm run build`, publish directory `dist`
- **Vercel**: framework preset **Astro**
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`

> 💡 Set `site.url` in `src/site.config.ts` to your production domain for correct canonical URLs, sitemap, and robots.txt.

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| [Astro](https://astro.build) 7 | Static site framework |
| [Tailwind CSS](https://tailwindcss.com) 4 | Styling (`@tailwindcss/vite`) |
| [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography) | Post typography |
| [astro:assets](https://docs.astro.build/en/guides/images/) + [sharp](https://sharp.pixelplumbing.com) | Image optimization |
| [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) | Sitemap generation |
| [@astrojs/rss](https://docs.astro.build/en/guides/rss/) | RSS feed |

## 📄 License

[MIT](./LICENSE) © 2026 ruijieking

