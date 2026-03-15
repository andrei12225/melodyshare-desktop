# AGENTS.md - Developer Guide for MelodyShare

This document provides guidance for AI agents working on the MelodyShare codebase.

## Project Overview

MelodyShare is a Tauri v2 desktop application with a React 19 + TypeScript frontend and Rust backend. It integrates with Spotify and Supabase for user authentication.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, TailwindCSS 4
- **Backend**: Rust (Tauri 2)
- **Auth**: Supabase (OAuth)
- **Icons**: react-icons

---

## Build Commands

### Frontend (npm)

```bash
# Start development server
npm run dev

# Build for production (runs tsc first, then vite build)
npm run build

# Preview production build
npm run preview
```

### Tauri (Rust Backend)

```bash
# Run Tauri in development mode
npm run tauri dev

# Build Tauri application
npm run tauri build

# Run Tauri with specific options
npm run tauri <command>
```

### TypeScript

TypeScript is run as part of `npm run build`. The strict mode is enabled with these options:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Note**: There is currently no test framework configured in this project.

---

## Code Style Guidelines

### TypeScript

- Use **strict TypeScript** - always define proper types
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Enable all strict compiler options

### React Components

- Use **functional components** with arrow functions or `function` keyword
- Use **PascalCase** for component names and file names (e.g., `MainPage.tsx`)
- Use **camelCase** for utility functions and variables
- Destructure props explicitly in component signatures
- Use TypeScript interfaces for component props

```typescript
// Good
interface MainPageProps {
  session: Session | null;
}

export default function MainPage({ session }: MainPageProps) {
  // ...
}

// Avoid
export default function MainPage(props: any) {
  const { session } = props;
}
```

### Imports

- Order imports logically: external libs → internal modules → CSS
- Use absolute imports with path aliases if configured
- Import types separately when possible: `import { SomeType } from 'module'`
- Use named exports for components

```typescript
import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import { Session } from "@supabase/supabase-js";
import MainPage from "./components/MainPage";
```

### Naming Conventions

- **Components**: PascalCase (`LoginButton`, `SplashScreen`)
- **Files**: PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)
- **CSS IDs/Classes**: kebab-case (`main-page-container`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Interfaces**: PascalCase, prefix with `I` only when needed (prefer `User` over `IUser`)

### CSS & TailwindCSS

- Use **TailwindCSS v4** syntax: `@import "tailwindcss";`
- Use utility classes for styling (e.g., `className="flex justify-center p-4"`)
- Use custom CSS for complex layouts via CSS modules or component CSS files
- Define component-specific styles in `App.css` or separate CSS files

```css
/* TailwindCSS v4 import */
@import "tailwindcss";

/* Custom component styles */
#mainPageContainer {
  display: grid;
  grid-template-rows: auto 1fr auto;
}
```

### Error Handling

- Use try/catch for async operations
- Handle API errors gracefully with user feedback
- Log errors appropriately for debugging
- Use TypeScript types to enforce error handling

```typescript
async function getLikedSongs(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me/tracks", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    console.log("Spotify Error", response.statusText);
    return [];
  }

  return response.json();
}
```

### Tauri/Rust Backend

- Keep Rust code minimal - most logic should be in the frontend
- Use Tauri commands (#[tauri::command]) for any backend functionality
- Follow standard Rust conventions (snake_case functions, PascalCase types)

---

## Project Structure

```
MelodyShare/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── supabase/           # Supabase client setup
│   ├── App.tsx             # Main app component
│   ├── App.css             # Global styles
│   └── main.tsx            # Entry point
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri app setup
│   │   └── main.rs         # Binary entry
│   └── Cargo.toml          # Rust dependencies
├── package.json            # Node dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── AGENTS.md              # This file
```

---

## Environment Variables

Required environment variables (create `.env`):

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUB_KEY=your_supabase_public_key
```

Access in code via `import.meta.env.VITE_*`

---

## Common Tasks

### Adding a new component

1. Create `src/components/ComponentName.tsx`
2. Use PascalCase for filename and component name
3. Define props interface with TypeScript
4. Export as default
5. Import and use in parent component

### Adding a new Tauri command

1. Add function in `src-tauri/src/lib.rs` with `#[tauri::command]`
2. Register in `.invoke_handler(tauri::generate_handler![...])`
3. Call from frontend using `@tauri-apps/api`

### Building for release

```bash
npm run tauri build
```

The executable will be in `src-tauri/target/release/`
