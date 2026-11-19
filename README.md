# Cork7

Cork7 is a static browser game. Its HTML, styles, JavaScript bundles, and game assets are served directly; there is no package installation or build step in this repository.

## Music in the game

Open the Pocket from the music/chat control in the game, choose a music service, and paste a YouTube, YouTube Music, Spotify, or SoundCloud song or playlist link. Spotify playlists use the full-height Spotify embed, and playback continues if you close the Pocket. Spotify may require sign-in; track length and availability are controlled by Spotify. The selected link is saved in the current browser.

## Publishing in-game updates

The in-game **Updates** tab is a bundled release-notes list, not a live feed from social media or a posting form. When releasing a change, add or revise a patch-note entry in `js/patch-notes-vb5RXYXa.js` and keep the matching `_next/static/chunks/patch-notes-vb5RXYXa.js` copy in sync. Describe what players can actually see in the released game.

## Project files

- `index.html` — static app entry point
- `js/` and `_next/static/` — runtime bundles
- `css/` — stylesheets
- `images/`, `onboarding/`, `models/`, and `grabs/` — visual, course, and rider assets

Keep both runtime asset trees and the referenced game assets when copying or deploying the site. Guest progress is stored on the current device; account and online features require their configured backend.

Signed-in users can change a password from **Settings → Account** by confirming the current password. Password recovery requires access to the account email; configure the Supabase Auth reset email template to show `{{ .Token }}` as a code for the in-game recovery form.
