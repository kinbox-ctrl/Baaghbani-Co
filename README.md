# Baaghbani & Co. — Coming Soon

> A little more green. A little more life.

The coming soon page for Baaghbani & Co., a plant, gifting and green-spaces brand. It's a small Node.js (Express) server that serves a single static page and collects launch sign-ups.

## Run locally

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # restarts on file changes
```

Requires Node 18 or newer.

## Deploy (Cloudflare Workers)

Live at **https://baaghbani-co.kartik-kinbox.workers.dev** (Worker `baaghbani-co`).

```bash
npx wrangler login   # once
npm run deploy       # wrangler deploy
```

On Cloudflare, `worker/index.js` replaces `server.js`. It serves `public/` as static assets and handles `/api/config` and `/api/subscribe`. Sign-ups go into the KV namespace `baaghbani-subscribers` (binding `SUBSCRIBERS`, keys `email:<address>`). To see them:

```bash
npx wrangler kv key list --namespace-id 78c402c4584147e48cbb28442d5dc40a --remote --prefix email:
```

`LAUNCH_DATE` and `INSTAGRAM_URL` are set under `vars` in `wrangler.jsonc`; edit them and run `npm run deploy` again. `future-site/` is never uploaded.

## Configuration (environment variables)

| Variable        | Default                       | Purpose                                                                 |
| --------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `PORT`          | `3000`                        | Port to listen on                                                       |
| `LAUNCH_DATE`   | _(unset)_                     | ISO date, e.g. `2027-01-15T10:00:00+05:30`. Shows a countdown when set. |
| `INSTAGRAM_URL` | `https://www.instagram.com/`  | Link for the Instagram icon                                             |
| `DATA_DIR`      | `./data`                      | Where `subscribers.json` is written                                     |
| `ENABLE_PREVIEW`| _(unset)_                     | Set to `true` to serve the saved full site at `/preview/`               |

## Sign-ups

`POST /api/subscribe` with `{ "email": "..." }` stores emails in `data/subscribers.json` (git-ignored). It's rate-limited per IP and has a honeypot field to filter bots.

On hosts with an ephemeral filesystem (Render free tier, Heroku, and similar), point `DATA_DIR` at a persistent disk, or swap `addSubscriber` in `server.js` for your mailing-list provider (Shopify customers, Klaviyo, Mailchimp).

## The full site (saved for launch)

The main page is a single full-screen "Coming soon" splash. The full homepage (hero, services, our story, newsletter) is kept in `future-site/` and is **not** public. To preview it, start the server with `ENABLE_PREVIEW=true` and open `/preview/`. At launch, move its files into `public/`.

## Structure

```
server.js            Express server, config + subscribe API
public/              What visitors see now
  index.html         Coming soon splash
  coming-soon.css
  coming-soon.js     Countdown, form handling
  favicon.svg
future-site/         Full homepage, saved for launch
  index.html
  styles.css
  app.js
```
