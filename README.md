# Preschool Vocabulary Platform - Frontend

Next.js frontend application for a Cantonese/English vocabulary learning platform for preschool children.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or pnpm
- Backend API running (see backend README)

### Local Development Setup

1. **Install dependencies**

```bash
npm install
# or
pnpm install
```

2. **Configure environment**

```bash
# Create .env.local file
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Preschool Vocabulary
```

3. **Run development server**

```bash
npm run dev
# or
pnpm dev
```

4. **Open browser**

Visit http://localhost:3000

## 📚 Features

- **Parent Dashboard**: Manage multiple child profiles
- **Vocabulary Learning**: Interactive word learning with images and audio
- **Progress Tracking**: Detailed learning analytics and insights
- **Story Generation**: AI-powered personalized stories
- **Multi-language**: English and Cantonese (Traditional Chinese)
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Light and dark theme support

## 🗂️ Project Structure

```
frontend/
├── app/                        # Next.js 14 app router
│   ├── (auth)/                # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/             # Parent dashboard
│   ├── child/                 # Child learning interface
│   │   ├── [childId]/
│   │   ├── learn/
│   │   ├── stories/
│   │   └── progress/
│   ├── api/                   # API route handlers (if any)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── ui/                    # shadcn/ui components
│   ├── auth/                  # Auth components
│   ├── dashboard/             # Dashboard components
│   ├── learning/              # Learning components
│   └── shared/                # Shared components
├── hooks/                     # Custom React hooks
├── lib/                       # Utility functions
│   ├── api.ts                 # API client
│   └── utils.ts               # Helper functions
├── public/                    # Static assets
├── styles/                    # Additional styles
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔧 Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Recharts** - Data visualization

## 🎨 Main Pages

### Public Pages
- `/` - Landing page
- `/login` - Parent login
- `/register` - Parent registration

### Parent Dashboard
- `/dashboard` - Overview of all children
- `/dashboard/children` - Manage child profiles
- `/dashboard/analytics` - Learning analytics

### Child Interface
- `/child/[childId]` - Child home page
- `/child/[childId]/learn` - Vocabulary learning
- `/child/[childId]/stories` - Story reading
- `/child/[childId]/progress` - Progress tracking

## 🌍 Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:8000    # Backend API URL

# Optional
NEXT_PUBLIC_APP_NAME=Preschool Vocabulary    # App name
NEXT_PUBLIC_ENABLE_ANALYTICS=false            # Enable analytics
```

For production:
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## 🚢 Production Deployment

See [VM_SETUP_GUIDE.md](../VM_SETUP_GUIDE.md) in the parent directory for complete production setup instructions.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Production Checklist

- [ ] Update NEXT_PUBLIC_API_URL to production API
- [ ] Enable HTTPS with SSL certificates
- [ ] Optimize images and assets
- [ ] Set up CDN for static assets (optional)
- [ ] Configure proper CORS on backend
- [ ] Test on multiple devices and browsers
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics (optional)

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run type-check
```

## 📦 Component Library

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. To add new components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Theme customization in `app/globals.css`
- **Dark Mode**: Automatic theme switching based on system preference

## 🐛 Troubleshooting

### API Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/docs

# Verify NEXT_PUBLIC_API_URL in .env.local
cat .env.local
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Module Not Found

```bash
# Install missing dependencies
npm install

# Check for TypeScript errors
npm run type-check
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Authentication Flow

1. Parent registers/logs in at `/login` or `/register`
2. JWT token stored in localStorage
3. Token sent with all API requests via Authorization header
4. Protected routes check for valid token
5. Auto-redirect to login if token expired

## 📊 State Management

- **Local State**: React useState for component-specific state
- **Global State**: Zustand for app-wide state (user, theme)
- **Server State**: React Query for API data fetching and caching

## 🧪 Testing (Future)

```bash
# Run tests (when implemented)
npm test

# Run e2e tests
npm run test:e2e
```

## 📝 License

This project is for educational purposes.

---

**For complete VM setup instructions, see**: [VM_SETUP_GUIDE.md](../VM_SETUP_GUIDE.md)
