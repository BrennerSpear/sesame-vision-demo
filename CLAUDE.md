# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile PWA (Progressive Web App) vision assistant that captures camera frames, captions them in real-time using LLaVA-13B (via Replicate), streams the captions back instantly, and archives image-text pairs for later search.

## Tech Stack

- Frontend: Next.js (Page Router), Tailwind CSS
- Backend: Vercel Serverless + Edge Functions
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- Realtime: Supabase Realtime
- Image Captioning: Replicate API (LLaVA-13B)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm run typecheck

# Run linting
pnpm check:unsafe

# Run database migrations
npx prisma migrate dev

# Generate database client
npx prisma generate
```

## Architecture

The application consists of:

1. **Frontend**: 
   - Camera component that accesses device camera and captures frames
   - Real-time caption feed using Supabase Realtime
   - Controls for FPS and image quality
   - PWA capabilities for mobile installation

2. **API Endpoints**:
   - `/api/signed-upload`: Provides signed URLs for direct Supabase Storage uploads
   - `/api/caption`: Processes images with LLaVA model and broadcasts results
   - `/api/history`: Retrieves paginated caption history

3. **Database**:
   - `Session` model: Tracks user sessions
   - `Caption` model: Stores image metadata and generated captions

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
REPLICATE_API_TOKEN=your-replicate-token
DATABASE_URL=your-supabase-db-url
DIRECT_URL=your-supabase-direct-db-url
```