Vision:
A mobile PWA that turns your iPhone into a live “what-am-I-seeing?” assistant—capturing camera frames, captioning them in real time with LLaVA-13B, streaming the captions back instantly, and archiving every image-and-text pair for later search.

· Frontend responsibilities
PWA shell

- Next.js Page Router, next-pwa for installable fullscreen app.

Camera capture loop

- getUserMedia({ video: { facingMode: 'environment' }}).

- Draw frame to <canvas>, toBlob('image/jpeg', 0.75).

- Throttle FPS (slider).

Upload handshake

- GET /api/signed-upload → {uploadUrl, getUrl, path}.

- supabase.storage.from(bucket).uploadToSignedUrl(path, token, file) (or plain PUT).

PO- ST /api/caption with {path, ts, session}.

Realtime listener

- supabase.channel('session:'+sessionId) → on broadcast:caption append {caption, imgUrl} to live feed.

History view

- GET /api/history pagination, render timeline.

Controls / UX

- FPS slider, quality indicator, error/retry handling, optional Supabase Auth (magic-link or OAuth).

Everything else—signed uploads, caption generation, realtime push, persistence—runs in three lean Vercel functions plus Supabase’s managed services.


iPhone PWA
  ├─ GET  /api/signed-upload  ───▶  Vercel Edge  ──┐
  │                                               │
  ├─ PUT  frame.jpeg  ───────────────▶  Supabase Storage
  │                                               │
  └─ POST /api/caption {path,ts,session} ─────────▶ Vercel Serverless
                                                   │  ├─ signed GET URL
                                                   │  ├─ Replicate LLaVA
                                                   │  ├─ INSERT caption row
                                                   │  └─ Broadcast over Supabase Realtime
                                                   ▼
                                      Realtime WS  ◀── phone receives {caption,ts,url}



| Route                      | Runtime             | Purpose                                                                                                                                                                                                                                            | Core logic |
| -------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **GET /api/signed-upload** | *Edge*              | Hand back a 5-min signed **PUT** URL + public/read path for Supabase Storage.                                                                                                                                                                      |            |
| **POST /api/caption**      | *Serverless (Node)* | Body `{path, ts, session}` → <br>1. create signed **GET** URL for the file<br>2. `fetch` Replicate LLaVA<br>3. `INSERT` into Postgres (`captions` table, pgvector optional)<br>4. REST broadcast `{caption, ts, url}` to `session:<uuid>` channel. |            |
| **GET /api/history**       | *Serverless*        | `?session&cursor` → `SELECT * FROM captions ORDER BY ts DESC LIMIT 200`.                                                                                                                                                                           |            |
| Area      | npm packages                                                       |
| --------- | ------------------------------------------------------------------ |
| Core      | `next`, `react`, `next-pwa`, `tailwindcss`, `@biomejs/biome`       |
| Supabase  | `@supabase/supabase-js`                                            |
| DB        | `prisma`, `@prisma/client` (+ `pgvector` extension in Supabase PG) |
| Inference | `replicate`                                                        |
| Misc      | `uuid`, `zod`, `framer-motion` (UI polish)                         |