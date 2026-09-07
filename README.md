# Star Quest for iPad

The same game as the desktop version — maths, English spelling and Chinese
characters — rebuilt as a web app so it installs on an iPad.

**This is a rebuild, not a port.** The desktop version is written in Python
with pygame, which cannot run on iOS at all. Everything here was rewritten in
HTML, CSS and JavaScript. The content is identical: the same word list, the
same characters, the same stroke data, the same levels and the same adaptive
difficulty.

---

## Putting it on the iPad

You need to serve these files over the web once. A local file opened straight
from the Files app will not install properly — Safari only offers a real
home-screen app for a page loaded over `http`/`https`.

### The easy way: GitHub Pages (free, about five minutes)

1. Make a free account at [github.com](https://github.com).
2. Create a new repository — call it anything, tick **Public**.
3. Click **Add file → Upload files**, drag in *everything* from this folder,
   and commit.
4. Go to **Settings → Pages**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`, and save.
5. Wait a minute. GitHub shows you a URL like
   `https://yourname.github.io/starquest/`.

### Then, on the iPad

1. Open that URL **in Safari** (it must be Safari, not Chrome).
2. Tap the **Share** button — the square with an arrow out of the top.
3. Scroll down and tap **Add to Home Screen**, then **Add**.

You now have a Star Quest icon on the home screen. Tapping it opens the game
fullscreen with no address bar, exactly like an App Store app.

### Does it need the internet?

Only the first time. A service worker caches the whole app — about 350 KB —
on first load, so after that it runs with the iPad in aeroplane mode.

### Other ways to host it

Netlify Drop (`app.netlify.com/drop`) takes a drag-and-dropped folder and
gives you a URL instantly, with no account. Any web host works. If you have a
Mac on the same wifi, `python3 -m http.server` in this folder and then
`http://<your-mac-ip>:8000` in Safari works too, though the app will only be
offline-capable on `localhost` or `https`.

## What it does not do

It cannot be put on the App Store from here. That needs a Mac, Xcode and a
paid Apple Developer account. For one family, "Add to Home Screen" gives the
same result: an icon, a fullscreen app, and offline play.

## Made for touch

- Every button is at least 64 px, comfortably finger-sized
- Works in portrait or landscape, and resizes to any iPad
- Double-tap zoom is disabled so a stray tap cannot throw off the layout
- Respects the rounded corners and home indicator on newer iPads
- Progress is saved on the device and survives closing the app

Sound needs one tap before iOS will allow it — that is an Apple rule, not a
bug. The first tap anywhere starts the music.

## The same content as the desktop version

| | |
|---|---|
| Adding | four levels, from no carrying to two-digit carrying |
| Taking away | four levels, from no borrowing to two-digit borrowing |
| Times tables | 2, 5, 10 → 3, 4 → 6-9 → 11, 12 |
| Spelling | 118 words in three levels by length, with phonetics and syllables |
| 认汉字 | 86 characters over three textbook levels, four tests, with stroke order |

Levels find themselves by watching accuracy, missed questions come back a few
questions later, and the **For Grown-ups** report shows per-level accuracy.

Both reset buttons are there: **Reset stars** clears only the star count,
**Reset progress** wipes everything. Both ask twice.

## Files

```
index.html              the app shell
main.js                 all the screens
content.js              question generation
progress.js             levels, stars, stickers, saving
art.js                  avatars, stroke order, column method (all SVG)
audio.js                music and effects, via Web Audio
data.js                 the words, characters and stroke shapes
style.css
manifest.webmanifest    what makes it installable
sw.js                   offline caching
icon.svg, icon-*.png    home-screen icons
```

Stroke shapes come from Make Me a Hanzi; see `LICENSE-hanzi-data.txt`.
