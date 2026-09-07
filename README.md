# Star Quest for iPad

The same game as the desktop version — maths, English spelling and Chinese
characters — rebuilt as a web app so it installs on an iPad.

**This is a rebuild, not a port.** The desktop version is written in Python
with pygame, which cannot run on iOS at all. Everything here was rewritten in
HTML, CSS and JavaScript. The content is identical: the same word list, the
same characters, the same stroke data, the same levels and the same adaptive
difficulty.

---

## It is already online

**https://ivephoton.github.io/starquest/**

That address is served by GitHub Pages from this repository. Nothing needs to
be set up again.

### Putting it on an iPad

1. Open that URL **in Safari** — it must be Safari. Chrome on iOS cannot
   install a web app.
2. Let the page finish loading once. That first load is when the app copies
   itself onto the iPad for offline use.
3. Tap the **Share** button — the square with an arrow coming out of the top.
4. Scroll down, tap **Add to Home Screen**, then **Add**.

You now have a Star Quest icon on the home screen. Tapping it opens the game
fullscreen with no address bar, exactly like an App Store app.

Use the home-screen icon from then on, not the Safari tab. iOS keeps their
saved progress separate, so stars earned in one will not show up in the other.

### Does it need the internet?

Only that first load. A service worker caches the whole app — about 350 KB —
so after that it runs with the iPad in aeroplane mode.

Sound needs one tap before iOS will allow it. That is an Apple rule, not a
bug. The first tap anywhere starts the music.

---

## Changing the game later

Upload the changed files to this repository (**Add file → Upload files**, then
**Commit changes**). GitHub Pages rebuilds in about a minute.

**Then do this, or the iPad will ignore the update.** Open `sw.js` and bump
the version on the third line:

```js
const CACHE = 'starquest-v1';   // → 'starquest-v2', then 'v3', and so on
```

Any iPad with the app installed holds a complete cached copy and serves that
copy in preference to the network. It only throws the old copy away when it
sees a cache name it does not recognise. Skip this and the game will look
exactly as it did before, no matter how many times you reload — which is
baffling if you have forgotten why.

After bumping it, close the app on the iPad and reopen it twice: once to fetch
the new version in the background, once to run it.

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
