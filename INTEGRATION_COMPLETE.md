# API Integration - Setup Complete! 🎉

## ✅ What's Been Created

### 1. Authentication System

- **`/lib/auth-context.tsx`** - Auth context provider with user state management
- **`/app/login/page.tsx`** - Login page with error handling
- **`/app/register/page.tsx`** - Registration page with validation
- **`/app/layout.tsx`** - Updated with AuthProvider wrapper

### 2. Child Profile Management

- **`/app/create-child/page.tsx`** - Create child profile form
- **`/app/home-with-api.tsx`** - Example homepage using real API data

### 3. Reusable Hooks & Components

- **`/hooks/use-api.ts`** - Hooks for data fetching and mutations
- **`/components/ui/spinner.tsx`** - Loading spinner component

## 🚀 Quick Start Guide

### Step 1: Start Both Servers

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

### Step 2: Test the Flow

1. Go to http://localhost:3000/register
2. Create an account (email: test@example.com, password: password123)
3. You'll be auto-logged in and redirected
4. Create a child profile
5. See real data from the API!

## 📚 Usage Examples

### Using the Auth Context

```typescript
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function MyComponent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using the API Hooks

```typescript
import { useApi, useMutation } from '@/hooks/use-api';
import { getChildren, createChild } from '@/lib/api';

export default function ChildrenList() {
  // Fetch data with loading/error states
  const { data: children, loading, error, refetch } = useApi(
    () => getChildren()
  );

  // Mutation with loading state
  const { mutate: addChild, loading: creating } = useMutation(createChild);

  async function handleCreateChild() {
    try {
      await addChild({
        name: 'New Child',
        age: 4
      });
      refetch(); // Refresh the list
    } catch (err) {
      alert('Failed to create child');
    }
  }

  if (loading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {children?.map(child => (
        <div key={child.id}>{child.name}</div>
      ))}
      <button onClick={handleCreateChild} disabled={creating}>
        {creating ? 'Creating...' : 'Add Child'}
      </button>
    </div>
  );
}
```

### Protected Route Pattern

```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) return null;

  return <div>Protected content for {user.full_name}</div>;
}
```

## 🔄 Converting Existing Components

### Before (Mock Data):

```typescript
import { childProfile, categories } from '@/lib/mock-data';

export default function MyComponent() {
  return <div>{childProfile.name}</div>;
}
```

### After (Real API):

```typescript
import { useApi } from '@/hooks/use-api';
import { getChildren, getCategories } from '@/lib/api';

export default function MyComponent() {
  const { data: children, loading } = useApi(() => getChildren());
  const { data: categories } = useApi(() => getCategories());

  if (loading) return <Spinner />;

  return <div>{children?.[0]?.name}</div>;
}
```

## 🎯 Next Steps

1. **Update your existing pages** to use the API instead of mock data
2. **Add logout button** to navigation
3. **Create parent dashboard** with real progress data
4. **Add word learning flow** with progress tracking
5. **Implement learning sessions** to track engagement

## 🛡️ Error Handling Best Practices

```typescript
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ComponentWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);

  async function handleAction() {
    setError(null);
    try {
      await someApiCall();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handleAction}>Do Something</Button>
    </div>
  );
}
```

## 📱 Example: Full Feature Component

Check `/app/home-with-api.tsx` for a complete example showing:

- ✅ Auth checking
- ✅ Loading states
- ✅ Error handling
- ✅ API data fetching
- ✅ Conditional rendering
- ✅ Navigation

## 🔐 Authentication Flow

1. User registers → Auto-login → Redirect to home
2. User logs in → Token stored → Redirect to home
3. Token included in all API requests
4. On 401 error → Token cleared → Redirect to login
5. User logs out → Token cleared → Redirect to home

## 💡 Tips

- Always wrap pages with auth check
- Use `useApi` for GET requests
- Use `useMutation` for POST/PUT/DELETE
- Show loading spinners for better UX
- Display error messages clearly
- Provide retry buttons on errors
- Use the Spinner component consistently

Your app is now fully integrated with the backend! 🚀
