# MelodyShare

A desktop application for viewing your Spotify listening statistics. Built with Tauri, React, and TypeScript.

## Features

- Connect your Spotify account to view personalized listening stats
- View your top tracks and artists
- Track your listening habits over time
- Beautiful Spotify-inspired dark interface

## Getting Started

### Prerequisites

- Node.js
- Rust
- A Spotify Developer account
- A Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/andrei12225/melodyshare-desktop.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUB_KEY=your_supabase_public_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Building

To build for production:

```bash
npm run tauri build
```

The executable will be in `src-tauri/target/release/`.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS 4
- **Backend**: Rust (Tauri 2)
- **Auth**: Supabase (OAuth)
- **Music Data**: Spotify Web API
