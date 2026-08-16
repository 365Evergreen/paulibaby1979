---
title: Why I moved to Cloudflare
excerpt: Speed, simplicity, and edge computing — here's why I made the switch.
date: 2026-08-13
coverImage: https://media.paulibaby.com/cloudflare.jpg
---

I recently migrated my blog to Cloudflare Workers. Here's why:

## The problem

My old setup was slow and expensive. I was paying for:
- A traditional VPS
- Separate CDN
- Object storage with egress fees

## The solution

With Cloudflare Workers + R2:
- **Workers** handle the rendering at the edge
- **R2** stores my media with zero egress fees
- **TinaCMS** lets me edit content visually

The migration was straightforward and the performance improvement is immediately noticeable.
