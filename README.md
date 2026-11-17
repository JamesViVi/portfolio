# WANG SHU JUN Portfolio

## Adding work

1. Put images or self-hosted video into `assets/creation/<project>/` or `assets/production/<project>/`.
2. Name files in display order: `001.jpg`, `002.jpg`, `003.jpg` … . The GitHub Pages workflow creates `data/media-manifest.json` automatically on each push to `main`.
3. Add a YouTube URL to the relevant list in `data/video-embeds.js` (for example `https://youtu.be/VIDEO_ID`).
4. For the home page, add three 4:5-ish cover photos: `assets/covers/production.jpg`, `creation.jpg`, and `education.jpg`.

## Local preview in VS Code

1. Open this `profolio` folder in VS Code.
2. After adding, removing, or renaming media, press **⇧⌘B** and choose **Update portfolio media index**.
3. Install the VS Code **Live Server** extension if you do not already have it, then right-click `index.html` and choose **Open with Live Server**. Do not double-click `index.html` in Finder: browsers block the media index when it is opened as a local file.

## Editing project text

All project titles, years, layouts, and descriptions are in `data/site-config.js`. The four existing Creation project descriptions have already been added there.

## Changing a link

Change `educationUrl` once in `data/site-config.js` when the Education website receives its final domain.

## Publishing

Push this repository to GitHub, then in **Settings → Pages** select **GitHub Actions** as the deployment source. Every push to `main` deploys the site.
