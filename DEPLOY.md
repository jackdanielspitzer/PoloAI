## ⚠️ Action needed: update your existing Apps Script deployment

Since you first deployed, testing surfaced a real limit: Apps Script Web Apps serve responses to
the browser through an internal redirect that silently fails above roughly 32–64KB — which a real
team's data (rosters + a season of games) will exceed. `Code.gs` has been rewritten to send data
in chunks instead of one big blob, tested against your actual live deployment up to ~180KB with no
issues. You need to push this updated code to your **existing** deployment (this keeps the same
URL — nothing else changes):

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Select all the existing code and delete it, then paste in the current contents of
   [`appsscript/Code.gs`](appsscript/Code.gs) (it's different from what you pasted before —
   it now stores data across multiple rows instead of one cell).
3. Save (Ctrl/Cmd+S).
4. **Deploy → Manage deployments** → click the pencil/edit icon on your existing deployment →
   under "Version" choose **New version** → **Deploy**.
   (Don't use "New deployment" — that would give you a different URL, and `index.html` is
   already pointing at the old one.)
5. That's it — same URL, no changes needed to `index.html` or GitHub Pages.

Any old data in the sheet from before this update gets cleanly ignored (different storage
format) — the app will just treat it as empty and rebuild from your local data on first sync.

---

# Deploying PoloAI with shared state — completely free, no credit card

Two pieces, both free forever, both tied to accounts you already have or can make in two minutes:

- **The data** lives in a Google Sheet, read/written by a small script that runs inside Google's
  own infrastructure (Apps Script) — this is your shared backend. No API key, no billing screen,
  ever. It uses your Google account's own access to your own spreadsheet.
- **The app** (`index.html`) is hosted on GitHub Pages — free static hosting, no card.

You do the account/setup steps below yourself — I can't create accounts or click through OAuth
screens on your behalf. Everything else (the actual code) is already written and tested.

## 1. Set up the shared data backend (Google Apps Script)

1. Go to [sheets.google.com](https://sheets.google.com), create a new blank spreadsheet.
   Name it anything, e.g. "PoloAI Data".
2. In the sheet, go to **Extensions → Apps Script**. A new tab opens with a code editor.
3. Delete whatever's in the default `Code.gs` file, and paste in the entire contents of
   [`appsscript/Code.gs`](appsscript/Code.gs) from this folder.
4. Save the project (the disk icon, or Ctrl/Cmd+S). Give it a name if asked.
5. Click **Deploy → New deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Set "Execute as" to **Me**, and "Who has access" to **Anyone**.
8. Click **Deploy**.
9. Google will ask you to authorize it — click through **Advanced → Go to [project name] (unsafe)**.
   This warning is normal and expected for a personal script you wrote yourself; it's not a sign
   anything is wrong.
10. Copy the **Web app URL** it gives you — it looks like
    `https://script.google.com/macros/s/AKfycb.../exec`. That's your shared backend.

## 2. Point the app at it

Open `index.html` in this folder, find this line near the top of the `<script>`:

```js
const SHARED_STATE_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```

Replace the placeholder with the URL you just copied, e.g.:

```js
const SHARED_STATE_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

(Tell me the URL and I'll do this edit for you — no need to touch the file yourself.)

## 3. Host it on GitHub Pages

1. If you don't have one, make a free account at [github.com](https://github.com).
2. Create a new repository (Settings icon → New repository). Make it public, name it
   anything (e.g. `poloai`).
3. On the repo page, click **Add file → Upload files**, and upload `index.html` from this
   folder. Commit the upload.
4. Go to the repo's **Settings → Pages**. Under "Source", choose the `main` branch and
   `/ (root)` folder, then Save.
5. Wait about a minute, then refresh that Pages settings screen — it'll show your live URL,
   something like `https://yourusername.github.io/poloai/`.

That's it — open that URL from any device, and everyone who opens it shares the same data
(rosters, games, live stats, plays, pasted box scores, accounts), synced roughly every 8 seconds.

## Ongoing changes

When you want something changed, ask me and I'll edit `index.html` directly. To actually put a
change live, you re-upload the updated file:

- Go to your repo on GitHub → click `index.html` → the pencil (edit) icon, or use
  **Add file → Upload files** again to replace it → Commit.
- GitHub Pages picks up the change automatically within a minute or two.

I won't push that update for you — putting a change live is always something you do on
purpose, not a side effect of me editing a file.

## Notes

- Each browser keeps a local cache in `localStorage` for instant loading and as a fallback if
  the connection drops — but the Google Sheet is the real source of truth once it exists.
- Only shared data syncs: rosters, games, stats, plays, pasted box scores, accounts. Which page
  you're on, whether you're logged in on that specific device, and mic state stay local to your
  browser and are never synced or overwritten by someone else's session.
- If sync ever seems stuck, the most common cause is the Apps Script deployment needing
  re-authorization after you edit `Code.gs` — redeploy (Deploy → Manage deployments → edit →
  new version) after any change to that file.
