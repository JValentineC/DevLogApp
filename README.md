# DevLog App

A full-stack developer log application built with React, TypeScript, Express, and MySQL. Features a modern UI with TailwindCSS and DaisyUI components.

## Features

- 📝 Create and manage developer log entries
- 🔐 User authentication with JWT and bcrypt
- 👤 User profile management (photo, bio, password)
- 👥 Role-based access control (User, Admin, Super Admin)
- 🎓 Alumni engagement tracking (admin only)
- 📊 Cycle management and captain assignments
- 🎨 Modern drawer navigation with collapsible sidebar
- 📱 Fully responsive design with mobile-first approach
- 🌙 Beautiful dark theme with DaisyUI components
- 🚀 Deployed on GitHub Pages (frontend) and NearlyFreeSpeech.net (backend)

## Tech Stack

### Frontend

- React 19.1.1
- TypeScript 5.8.3
- Vite 7.1.3
- TailwindCSS 3.x
- DaisyUI 5.5.14

### Backend

- Express 5.1.0
- MySQL/MariaDB 11.7
- JWT Authentication
- Bcrypt password hashing
- Helmet (security)
- Express Rate Limiting
- Node.js 18+

## UI Components

### Navigation
- **Drawer Layout** - Collapsible sidebar navigation (always open on desktop)
- **Responsive Navbar** - Hamburger menu for mobile, persistent sidebar for desktop
- **User Avatar Dropdown** - Profile and logout options
- **Icon-based Menu** - Clean icons with tooltips when collapsed

### Pages
- **Home** - About page and project information
- **Developer Logs** - Browse and create dev log entries
- **Profile** - User settings and profile customization
- **Admin Panel** - User management (super admin only)
- **Engagement** - Alumni tracking and cycle management (admin+)

### Components
- **DaisyUI Modals** - Entry creation and editing
- **Status Badges** - Visual indicators for account status
- **Captain Badges** - Special designation for cycle captains
- **Responsive Tables** - Data display with filtering and pagination

## Project Structure

```
DevLogs/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── About.tsx       # About/Home page
│   │   ├── DevLogList.tsx  # Display dev logs
│   │   ├── EntryLogger.tsx # Create new entries
│   │   ├── EditLogger.tsx  # Edit existing entries
│   │   ├── Login.tsx       # Login modal
│   │   ├── Profile.tsx     # User profile page
│   │   ├── UserList.tsx    # Browse users
│   │   ├── AdminUserManagement.tsx  # Admin user controls
│   │   └── Engagement.tsx  # Alumni engagement tracking
│   ├── lib/                # Utilities
│   │   └── api.ts          # API service layer
│   ├── App.tsx             # Main app with drawer layout
│   ├── main.tsx            # App entry point
│   └── index.css           # Tailwind directives
├── deploy/                 # Backend deployment files
│   ├── index-noprisma.js   # Express API server
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── schema.sql          # Database schema
│   └── *.sql               # Migration files
├── public/                 # Static assets
├── tailwind.config.js      # TailwindCSS configuration
├── postcss.config.js       # PostCSS configuration
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

### Core Tables
- **User** - User accounts with role-based access (user, admin, super_admin)
- **DevLog** - Developer log entries with author information
- **Person** - Alumni/members with contact information
- **Cycle** - Training cycles (e.g., Cycle 50, Cycle 51)
- **CycleMembership** - Links people to their cycles
- **CaptainAssignment** - Tracks cycle captains
- **ICaaMembership** - iCAA membership tracking
- **Resume** - Resume storage for alumni
- **JobSeekingProfile** - Job search preferences and status

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with rate limiting

### User Management
- `PUT /api/users/:id` - Update user profile
- `PATCH /api/users/:id/password` - Change password
- `GET /api/users` - Get all users (authenticated)
- `PATCH /api/users/:id/role` - Update user role (super admin only)
- `DELETE /api/users/:id` - Delete user (super admin only)

### DevLogs
- `GET /api/devlogs` - Get all dev logs (with filters)
- `GET /api/devlogs/:id` - Get single dev log
- `POST /api/devlogs` - Create new dev log (authenticated)
- `PUT /api/devlogs/:id` - Update dev log (owner/admin)
- `DELETE /api/devlogs/:id` - Delete dev log (owner/admin)

### Alumni Engagement (Admin+)
- `GET /api/people` - Get alumni with filtering
- `GET /api/cycles` - Get all cycles with member counts

## Live Demo

🌐 **Frontend:** https://jvalentinec.github.io/DevLogApp/  
🔗 **API:** https://devlogs-api.nfshost.com/api

## Screenshots

### Desktop - Drawer Layout
- Persistent sidebar with icon navigation
- Responsive content area
- User avatar dropdown

### Mobile - Collapsible Menu
- Hamburger menu toggle
- Full-width content
- Touch-optimized interface

## Development

### Available Scripts

```bash
npm run dev              # Start Vite dev server
npm run dev:server       # Start Express API server
npm run dev:full         # Run both frontend and backend
npm run build            # Build for production
npm run deploy           # Deploy to GitHub Pages
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run database migrations
```

## Security Features

- JWT token-based authentication
- Bcrypt password hashing (10 rounds)
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS configuration
- Role-based access control
- Input validation and sanitization

## License

MIT

---

Built with ❤️ by Jonathan Valentine Chung
