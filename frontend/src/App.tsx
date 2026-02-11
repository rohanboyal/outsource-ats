// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

// Layouts
import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';



// Placeholder pages (you can copy these from PlaceholderPages.tsx)
function ClientsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clients</h1>
      <p className="text-muted-foreground">Client management coming in Phase 3...</p>
    </div>
  );
}

function PitchesListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pitches</h1>
      <p className="text-muted-foreground">Pitch management coming in Phase 3...</p>
    </div>
  );
}

function JDsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Job Descriptions</h1>
      <p className="text-muted-foreground">JD management coming in Phase 3...</p>
    </div>
  );
}

function CandidatesListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Candidates</h1>
      <p className="text-muted-foreground">Candidate management coming in Phase 3...</p>
    </div>
  );
}

function ApplicationsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Applications</h1>
      <p className="text-muted-foreground">Application pipeline coming in Phase 3...</p>
    </div>
  );
}

function InterviewsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Interviews</h1>
      <p className="text-muted-foreground">Interview management coming in Phase 3...</p>
    </div>
  );
}

function OffersListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Offers</h1>
      <p className="text-muted-foreground">Offer management coming in Phase 3...</p>
    </div>
  );
}

function JoiningsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Joinings</h1>
      <p className="text-muted-foreground">Joining management coming in Phase 3...</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/pitches" element={<PitchesListPage />} />
            <Route path="/jds" element={<JDsListPage />} />
            <Route path="/candidates" element={<CandidatesListPage />} />
            <Route path="/applications" element={<ApplicationsListPage />} />
            <Route path="/interviews" element={<InterviewsListPage />} />
            <Route path="/offers" element={<OffersListPage />} />
            <Route path="/joinings" element={<JoiningsListPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}

export default App;
