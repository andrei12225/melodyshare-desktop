# MelodyShare

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/5/54/Spotify_Logo_RGB_Green.png" alt="Spotify" width="100" />
  <br>
  <strong>MelodyShare</strong> — A desktop application for viewing your Spotify listening statistics and connecting with friends.
</p>

<p align="center">
  <a href="https://github.com/andrei12225/melodyshare-desktop/releases">
    <img src="https://img.shields.io/github/v/release/andrei12225/melodyshare-desktop" alt="Release" />
  </a>
  <a href="https://github.com/andrei12225/melodyshare-desktop/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/andrei12225/melodyshare-desktop" alt="License" />
  </a>
</p>

---

## About

MelodyShare is a cross-platform desktop application that integrates with your Spotify account to provide detailed insights into your listening habits. Built with Tauri, React, and TypeScript, it offers a fast, native experience with a beautiful dark-mode interface inspired by Spotify's design language.

In addition to personal stats, MelodyShare allows you to connect with friends, view their top tracks, and chat directly within the app.

## Features

- **Personalized Dashboard**: View your top tracks, artists, and genres over customizable time ranges (4 weeks, 6 months, all time).
- **Listening History**: Explore your recently played tracks and detailed listening statistics.
- **Playlist Management**: Browse and manage your Spotify playlists.
- **Friends System**: Send friend requests, accept invitations, and see what your friends are listening to.
- **Real-time Chat**: Share songs and messages with friends directly within the app.
- **Native Desktop Experience**: Built with Tauri for a lightweight, secure, and performant desktop application.
- **Responsive Design**: Optimized for both desktop and mobile layouts.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS 4
- **Backend**: Rust (Tauri 2)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Authentication**: Supabase Auth (Spotify OAuth)
- **Music Data**: Spotify Web API

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable)
- A [Spotify Developer](https://developer.spotify.com/) account
- A [Supabase](https://supabase.com/) project

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/andrei12225/melodyshare-desktop.git
   cd melodyshare-desktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUB_KEY=your_supabase_public_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project.
   - Run the database migrations/schema (refer to `schema.sql` if available in older commits, or configure tables manually).
   - Enable Row Level Security (RLS) policies for `profiles`, `messages`, and `friendships` tables.
   - Enable Realtime for the `messages` and `friendships` tables.

5. **Configure Spotify Developer**
   - Create a new app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
   - Set the Redirect URI to your app's URL (e.g., `http://localhost:1420` for local development).
   - Copy the Client ID and Client Secret.

### Running the App

**Development Mode**
```bash
npm run tauri dev
```

**Production Build**
```bash
npm run tauri build
```

The built executable will be located in `src-tauri/target/release/`.

## Project Structure

```
melodyshare/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── lib/                # TypeScript types and utilities
│   ├── spotify/            # Spotify API integration
│   └── supabase/           # Supabase client configuration
├── src-tauri/              # Rust backend source
│   ├── src/                # Tauri application logic
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
├── package.json            # Node dependencies
└── README.md               # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify](https://www.spotify.com/) for the Web API
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tauri](https://tauri.app/) for the excellent desktop framework
