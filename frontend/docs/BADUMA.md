# Baduma customer UI

The hero is an AI-assisted, wire-removed edit of the supplied restaurant photo; the wordmark is cropped from the original image.

The customer routes are isolated from the existing Ceyteq workspace. Start the frontend and open `/login` to see the customer interface. `/profile` requires a verified Supabase session. Menu categories link to WhatsApp; online cart and order tracking are not connected to an ordering backend yet.

## Configure passwordless sign-in

1. Copy `frontend/.env.example` to `frontend/.env.local` if it does not already exist. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the public URL and publishable/anon key of the intended Baduma Supabase project. Do not use a service-role or secret key in `NEXT_PUBLIC_*` variables.
2. In that project's Supabase Auth settings, enable email authentication and/or configure an SMS provider and phone authentication. For magic links, add the deployed `https://your-domain/auth/callback` URL to the redirect allow list. If you want email codes as well as magic links, include Supabase's `{{ .Token }}` in the appropriate email template.
3. Install dependencies with `npm ci`, then run `npm run dev` from `frontend/`. Use HTTPS for deployed authentication and ensure your Supabase project has appropriate Row Level Security policies for any customer data.

Next.js embeds public Supabase values in client bundles at build time. For Docker Compose, set these variables in the root `.env`, then rebuild the frontend image. They must refer to the same project on the server and in the browser. The customer UI does not create a Supabase project or alter an existing project's settings.
