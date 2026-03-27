# NeuBridge Landing Page

Single-file responsive landing page for [mindbridge-landing.vercel.app](https://mindbridge-landing.vercel.app).

## Deploying to Vercel

### Option A: Drag and Drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the `landing/` folder onto the page
3. Deploy — done

### Option B: Connect to GitHub
1. Import the `jhethics-bot/mindbridge-app` repo on Vercel
2. Set **Root Directory** to `landing`
3. Set **Framework Preset** to "Other"
4. Deploy

Vercel will auto-deploy on every push to master.

## Supabase Waitlist

The signup form POSTs to the `waitlist` table via Supabase REST API. The anon key is already configured in `index.html`.

### Waitlist table schema

If the `waitlist` table doesn't exist yet, create it:

```sql
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anonymous inserts (public signup)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);
```

### Updating the anon key

If the Supabase project changes, update `SUPABASE_ANON_KEY` in `index.html` (search for the variable near the bottom of the file).

## Customizing Content

Everything is in a single `index.html` file — no build step required:

- **Colors**: CSS custom properties at the top (`:root` block)
- **Stats/Copy**: Edit the HTML directly
- **Sections**: Each section is clearly labeled with HTML comments
- **Responsive**: Mobile-first with breakpoints at 640px and 900px

## Tech Stack

- Pure HTML/CSS/JS — no frameworks, no dependencies
- System font stack (no external font loading)
- ~25KB total page weight
- Accessible: semantic HTML, ARIA labels, WCAG contrast ratios
