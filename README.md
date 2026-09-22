# Arena Africa - Prediction Market Platform

An Africa-first, API-first peer-to-peer prediction market platform built with Next.js 16, React 19, TypeScript, and PostgreSQL.

## Features

- 🌍 **Africa-First Design**: Optimized for African markets with mobile money and USSD support
- 🔄 **Real-Time Updates**: WebSocket-based live market and prediction updates
- ⚡ **Modern Tech Stack**: Next.js 16 (App Router), React 19, TypeScript
- 💰 **Mobile Money Integration**: Simulated M-Pesa, MTN MoMo, Airtel Money
- 👥 **Chama Pools**: Community-based predictive savings groups
- 📱 **USSD Simulator**: Feature phone accessibility via *384#
- 📊 **Dynamic Pricing**: LMSR AMM for fair market prices
- 🛡️ **Security**: Role-based access control, policy engine
- 🎨 **Theme System**: Dark/light mode with persistence and cross-tab sync

## Recent Improvements

### ✅ UI/UX Enhancements
- **React Query Integration**: Efficient data fetching with caching and background updates
- **Component Library**: Reusable UI primitives (Button, Input, Card, Skeleton)
- **Notification System**: Toast and persistent notifications with notification center
- **Virtual Scrolling**: Efficient rendering of large market lists
- **Theme Improvements**: Fixed FOIT, cross-tab sync, enhanced accessibility
- **WebSocket Foundation**: Real-time updates infrastructure in place

### ✅ Prediction Engine
- **LMSR AMM**: Logarithmic Market Scoring Rule for dynamic pricing
- **Suggestion Engine**: Automated discovery of prediction topics from free resources
- **Human-in-the-Loop**: Review and approval workflow for suggestions
- **Multi-source Aggregation**: RSS, Crypto, Sports, and Weather APIs
- **Relevance Scoring**: Africa-boosted topic ranking algorithm

## Architecture

### Core Components
- **Next.js 16**: App Router with server components and API routes
- **React 19**: Concurrent features and improved performance
- **TypeScript**: End-to-end type safety
- **PostgreSQL**: Relational database with Drizzle ORM
- **Tailwind CSS**: Utility-first styling with dark mode support
- **React Query**: Data fetching, caching, and state management
- **WebSocket**: Real-time bidirectional communication

### Key Systems
- **Authentication**: Dual-path system (Server Actions & API routes)
- **Policy Engine**: Centralized authorization with KYC and velocity limits
- **LMSR AMM**: Dynamic pricing with bounded risk
- **Suggestion Engine**: Automated topic discovery with human review
- **USSD Gateway**: Simulated feature phone accessibility
- **Chama System**: Community pooling mechanism

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `AUTH_SECRET`: Secret for authentication tokens
   - `GEMINI_API_KEY` (optional): For AI features
4. Push database schema:
   ```bash
   npx drizzle-kit push --config=drizzle.config.json
   ```
5. Apply indexes:
   ```bash
   psql $DATABASE_URL -f src/db/indexes.sql
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Secret for authentication tokens | No (defaults to insecure dev value) |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | No (degrades to heuristic if missing) |

## Project Structure
```
/src
  /app                 # Next.js app directory (pages, layouts, API routes)
  /components          # Reusable UI components
  /lib                 # Utility functions, hooks, and services
  /actions             # Server actions for mutations
  /db                  # Database schema, seeds, and indexes
  /docs                # Documentation
```

## Available Scripts
- `npm run dev` - Start development server (Turbopack)
- `npm run build` - Production build
- `npm run start` - Run production build
- `npm run lint` - ESLint code review
- `npm run typecheck` - TypeScript type checking

## UI Best Practices Implemented
✅ **React Query** - Data fetching and caching  
✅ **Component Library** - Button, Input, Card, Skeleton components  
✅ **Notifications** - Toast and persistent notification system  
✅ **Virtual Scrolling** - Efficient large list rendering  
✅ **Theme System** - Dark/light mode with persistence  
✅ **Accessibility** - ARIA labels, keyboard navigation  
✅ **Code Splitting** - Route and component-based splitting  
✅ **Lazy Loading** - Dynamic imports for non-critical resources  
✅ **Skeleton Loaders** - Placeholder loading states  

## Future Enhancements
- WebSocket implementation for real-time updates
- Playwright end-to-end testing
- Sentry error tracking and performance monitoring
- Format.js upgrade for advanced i18n
- RTL language support preparation
- Accessibility audit with screen reader users
- Storybook documentation for component library
- Feature flag system for gradual rollouts

## License
MIT License - see LICENSE file for details