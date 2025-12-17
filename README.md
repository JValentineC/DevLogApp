# DevLog App

A full-stack developer log application built with React, TypeScript, Express, and MySQL.

## Features

- 📝 Create and manage developer log entries
- 🔐 User authentication with login/logout
- 👤 User profile management (photo, bio, password)
- 📱 Responsive design with dark theme
- 🚀 Deployed on GitHub Pages (frontend) and NearlyFreeSpeech.net (backend)

## Tech Stack

### Frontend

- React 19.1.1
- TypeScript
- Vite 7.1.3
- CSS Grid Layout

### Backend

- Express 5.1.0
- MySQL/MariaDB 11.7
- Node.js

## Project Structure

```
DevLogs/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── About.tsx       # About/Home page
│   │   ├── DevLogList.tsx  # Display dev logs
│   │   ├── EntryLogger.tsx # Create new entries
│   │   ├── Login.tsx       # Login modal
│   │   └── Profile.tsx     # User profile page
│   ├── lib/                # Utilities
│   │   └── api.ts          # API service layer
│   ├── App.tsx             # Main app component
│   └── main.tsx            # App entry point
├── deploy/                 # Backend deployment files
│   ├── index-noprisma.js   # Express API server
│   ├── schema.sql          # Database schema
│   └── *.sql               # Migration files
├── public/                 # Static assets
└── .env.example            # Environment variables template

```

## Setup

### Prerequisites

- Node.js 18+
- MySQL/MariaDB database

### Installation

1. Clone the repository

```bash
git clone https://github.com/JValentineC/DevLogApp.git
cd DevLogApp
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run development server

```bash
npm run dev
```

## Deployment

### Frontend (GitHub Pages)

```bash
npm run deploy
```

### Backend (NearlyFreeSpeech.net)

1. Upload `deploy/index-noprisma.js` to `/home/protected/index.js`
2. Create `.env` file on server with database credentials
3. Configure daemon to run `node index.js`

## Database Schema

- **User** - User accounts (username, password, profile data)
- **DevLog** - Developer log entries (title, content, tags, published status)

## API Endpoints

- `POST /api/auth/login` - User login
- `PUT /api/users/:id` - Update user profile
- `GET /api/devlogs` - Get all dev logs (with filters)
- `POST /api/devlogs` - Create new dev log
- `PUT /api/devlogs/:id` - Update dev log
- `DELETE /api/devlogs/:id` - Delete dev log

## Live Demo

🌐 **Frontend:** https://jvalentinec.github.io/DevLogApp/  
🔗 **API:** https://devlogs-api.nfshost.com/api

## License

MIT
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
