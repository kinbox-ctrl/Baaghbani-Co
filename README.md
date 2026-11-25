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

## Configuration (environment variables)

| Variable        | Default                       | Purpose                                                                 |
| --------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `PORT`          | `3000`                        | Port to listen on                                                       |
| `LAUNCH_DATE`   | _(unset)_                     | ISO date, e.g. `2027-01-15T10:00:00+05:30`. Shows a countdown when set. |
| `INSTAGRAM_URL` | `https://www.instagram.com/`  | Link for the Instagram icon                                             |
| `DATA_DIR`      | `./data`                      | Where `subscribers.json` is written                                     |

## Sign-ups

`POST /api/subscribe` with `{ "email": "..." }` stores emails in `data/subscribers.json` (git-ignored). It's rate-limited per IP and has a honeypot field to filter bots.

On hosts with an ephemeral filesystem (Render free tier, Heroku, and similar), point `DATA_DIR` at a persistent disk, or swap `addSubscriber` in `server.js` for your mailing-list provider (Shopify customers, Klaviyo, Mailchimp).

## Structure

```
server.js          Express server, config + subscribe API
public/
  index.html       The page
  styles.css       Styles
  app.js           Reveal animations, countdown, form handling
  favicon.svg
```
