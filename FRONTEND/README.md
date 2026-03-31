# Autolight Frontend

This is the static source code (Frontend) for the **Autolight** project - A smart lighting control system for university campuses.

The project is built using modern web technologies, allowing for remote monitoring and configuration of lighting areas.

## Technologies Used

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Axios

## System Requirements

- **Node.js**: v18.0.0 or higher (latest LTS version recommended)
- **NPM**: v9.x or higher (or use pnpm/yarn)

## Installation and Setup Guide

### 1. Install Dependencies

Navigate to the `FRONTEND` directory and run the installation command:

```bash
cd FRONTEND
npm install
```

### 2. Environment Setup (API Configuration)

Make sure you have created an environment file `.env` based on `.env.example` (if any), or create a `.env` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```
*(Modify the URL above if your backend is running on a different port or domain)*

### 3. Run Development Server

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The server will default to running on port `http://localhost:5173/` (Vite). You can access this URL in your browser.

## Build for Production

To optimize the source code and generate a production-ready build:

```bash
npm run build
```

The static source code will be generated in the `dist/` directory. You can serve this directory using web servers like Nginx, Apache, or through hosting services.

To preview the build locally:

```bash
npm run preview
```

## Directory Structure

```text
FRONTEND/
├── public/                 # Public static assets (icons, PWAs, logos, etc.)
├── src/                    # Main source code
│   ├── api/                # API definition files (axios instance, auth, areas, etc.)
│   ├── assets/             # Background images, fonts, etc.
│   ├── components/         # Common components (Button, Card, Modal, UI elements)
│   ├── hooks/              # Custom React Hooks
│   ├── pages/              # Main application pages
│   ├── services/           # Common business logic outside of components
│   ├── types/              # Type Interfaces definitions (TS)
│   ├── App.tsx             # Root component of the application
│   ├── index.css           # Global CSS
│   └── main.tsx            # Application entry point
├── .env                    # Environment variables file (May need to be created)
├── eslint.config.js        # Linting configuration
├── package.json            # Dependency and script management
├── index.html              # Default HTML template
├── tailwind.config.js      # Tailwind configuration (if using an older version or plugins)
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite (Bundler) configuration
```

## API Communication Documentation

Refer to the Endpoints description table documentation for the Backend (already in the system) if you are acting as a Frontend Dev integrating API calls.
