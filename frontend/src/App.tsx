// src/App.tsx - COMPLETE VERSION WITH ALL PHASES
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

// ============================================================================
// LAYOUTS
// ============================================================================
import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';

// ============================================================================
// AUTH PAGES (Phase 1)
// ============================================================================
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// ============================================================================
// DASHBOARD (Phase 2)
// ============================================================================
import { DashboardPage } from './pages/dashboard/DashboardPage';

// ============================================================================
// CLIENT PAGES (Phase 3)
// ============================================================================
import { ClientsListPage } from './pages/clients/ClientsListPage';
import { ClientDetailPage } from './pages/clients/ClientDetailPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';

// ============================================================================
// CANDIDATE PAGES (Phase 4)
// ============================================================================
import { CandidatesListPage } from './pages/candidates/CandidatesListPage';
import { CandidateDetailPage } from './pages/candidates/CandidateDetailPage';
import { CandidateFormPage } from './pages/candidates/CandidateFormPage';

// ============================================================================
// APPLICATION PAGES (Phase 5)
// ============================================================================
import { ApplicationsListPage } from './pages/applications/ApplicationsListPage';

// ============================================================================
// PLACEHOLDER PAGES (To be built in future phases)
// ============================================================================

// Pitches placeholder
function PitchesListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pitches</h1>
      <p className="text-muted-foreground">Pitch management coming soon...</p>
    </div>
  );
}

// JDs placeholder
function JDsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Job Descriptions</h1>
      <p className="text-muted-foreground">JD management coming soon...</p>
    </div>
  );
}

// Interviews placeholder
function InterviewsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Interviews</h1>
      <p className="text-muted-foreground">Interview management coming soon...</p>
    </div>
  );
}

// Offers placeholder
function OffersListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Offers</h1>
      <p className="text-muted-foreground">Offer management coming soon...</p>
    </div>
  );
}

// Joinings placeholder
function JoiningsListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Joinings</h1>
      <p className="text-muted-foreground">Joining management coming soon...</p>
    </div>
  );
}

// Application Detail placeholder
function ApplicationDetailPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Application Details</h1>
      <p className="text-muted-foreground">Application detail page coming soon...</p>
    </div>
  );
}

// Application Form placeholder
function ApplicationFormPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">New Application</h1>
      <p className="text-muted-foreground">Application form coming soon...</p>
    </div>
  );
}

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* ================================================================ */}
          {/* AUTH ROUTES (Public)                                            */}
          {/* ================================================================ */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ================================================================ */}
          {/* PROTECTED ROUTES (Require Authentication)                       */}
          {/* ================================================================ */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* -------------------------------------------------------------- */}
            {/* DASHBOARD                                                      */}
            {/* -------------------------------------------------------------- */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* -------------------------------------------------------------- */}
            {/* CLIENTS (Phase 3)                                              */}
            {/* -------------------------------------------------------------- */}
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />

            {/* -------------------------------------------------------------- */}
            {/* PITCHES (Placeholder)                                          */}
            {/* -------------------------------------------------------------- */}
            <Route path="/pitches" element={<PitchesListPage />} />

            {/* -------------------------------------------------------------- */}
            {/* JOB DESCRIPTIONS (Placeholder)                                 */}
            {/* -------------------------------------------------------------- */}
            <Route path="/jds" element={<JDsListPage />} />

            {/* -------------------------------------------------------------- */}
            {/* CANDIDATES (Phase 4)                                           */}
            {/* -------------------------------------------------------------- */}
            <Route path="/candidates" element={<CandidatesListPage />} />
            <Route path="/candidates/new" element={<CandidateFormPage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />

            {/* -------------------------------------------------------------- */}
            {/* APPLICATIONS (Phase 5)                                         */}
            {/* -------------------------------------------------------------- */}
            <Route path="/applications" element={<ApplicationsListPage />} />
            <Route path="/applications/new" element={<ApplicationFormPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />

            {/* -------------------------------------------------------------- */}
            {/* INTERVIEWS (Placeholder)                                       */}
            {/* -------------------------------------------------------------- */}
            <Route path="/interviews" element={<InterviewsListPage />} />

            {/* -------------------------------------------------------------- */}
            {/* OFFERS (Placeholder)                                           */}
            {/* -------------------------------------------------------------- */}
            <Route path="/offers" element={<OffersListPage />} />

            {/* -------------------------------------------------------------- */}
            {/* JOININGS (Placeholder)                                         */}
            {/* -------------------------------------------------------------- */}
            <Route path="/joinings" element={<JoiningsListPage />} />
          </Route>

          {/* ================================================================ */}
          {/* FALLBACK ROUTE                                                  */}
          {/* ================================================================ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* ==================================================================== */}
      {/* TOAST NOTIFICATIONS                                                 */}
      {/* ==================================================================== */}
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}

export default App;
