# English Study

A web app to study English with paired texts, translations, and audio.

**Live demo:** https://english-master-omega.vercel.app (gated by a simple login)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-runtime-000000?logo=bun&logoColor=white)

## Overview

The content is organized as collections of markdown and mp3 files. A build script reads those collections and generates a catalog that the React frontend consumes. The catalog refreshes automatically when you start the dev server and when you run a build.

On mobile, navigation uses a content drawer and a fixed bottom bar so you can move between lessons quickly.

## Project structure

- `src/`: the React and TypeScript app code.
- `public/collections/`: content collections (each collection has a `textos/` folder and an `audio/` folder).
- `public/catalog.json`: the catalog generated from the collections.
- `scripts/build-catalog.ts`: the script that builds the catalog from `public/collections`.
- `index.html`: the app entry point at the project root.
- `.pi/skills/`: local Pi skills for UX, UI, and design.

## Access control

The app has a simple login screen in the frontend. Access opens only when the username and password match the environment variables.

1. Create your local environment file:

```bash
cp .env.example .env
```

2. Set the values:

```env
VITE_APP_USER=your-username
VITE_APP_PASSWORD=your-strong-password
```

3. Restart the dev server so the new values load:

```bash
bun run dev
```

This check runs in the frontend. It helps restrict basic access, but it does not replace secure authentication on a backend.

## Run locally

1. Install dependencies:

```bash
bun install
```

2. Start the dev server:

```bash
bun run dev
```

The `predev` script builds the catalog before Vite starts. The app runs at `http://localhost:5173`.

3. Build for production:

```bash
bun run build
```

The `prebuild` script builds the catalog before the production build runs.

## Useful scripts

Run these from the project root:

- `bun run catalog`: build or refresh `public/catalog.json`.
- `bun run dev`: start the dev server.
- `bun run build`: create a production build.
- `bun run preview`: serve the production build locally.
- `bun run lint`: run ESLint.

## Data flow

1. `scripts/build-catalog.ts` scans `public/collections`.
2. For each item, it reads the title from the markdown and checks if the audio exists.
3. The script writes `public/catalog.json`.
4. The frontend loads `/catalog.json` and uses the `/collections/...` paths to open the text and the audio.

## Collection format

Each folder inside `public/collections/<slug>/` should contain:

- `textos/`: `.md` files, one per item.
- `audio/`: `.mp3` files named `texto-<id>.mp3`.

The frontend exposes the paths as:

- Markdown: `/collections/<slug>/textos/<file>.md`
- Audio: `/collections/<slug>/audio/texto-<id>.mp3`

### Example collection

```text
public/collections/my-collection/
  textos/
    001.md
    002.md
  audio/
    texto-001.mp3
    texto-002.mp3
```
