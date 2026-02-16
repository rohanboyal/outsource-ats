// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { DashboardPage } from './pages/dashboard/DashboardPage';

import { ClientsListPage } from './pages/clients/ClientsListPage';
import { ClientDetailPage } from './pages/clients/ClientDetailPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';

import { CandidatesListPage } from './pages/candidates/CandidatesListPage';
import { CandidateDetailPage } from './pages/candidates/CandidateDetailPage';
import { CandidateFormPage } from './pages/candidates/CandidateFormPage';

import { ApplicationsListPage } from './pages/applications/ApplicationsListPage';
import { ApplicationFormPage } from './pages/applications/ApplicationFormPage';
import { ApplicationDetailPage } from './pages/applications/ApplicationDetailPage';

import { JDsListPage } from './pages/jds/JDsListPage';
import { JDFormPage } from './pages/jds/JDFormPage';
import { JDDetailPage } from './pages/jds/JDDetailPage';

import { InterviewsListPage } from './pages/interviews/InterviewsListPage';
import { InterviewFormPage } from './pages/interviews/InterviewFormPage';
import { InterviewDetailPage } from './pages/interviews/InterviewDetailPage';

import { OffersListPage } from './pages/offers/OffersListPage';
import { OfferFormPage } from './pages/offers/OfferFormPage';
import { OfferDetailPage } from './pages/offers/OfferDetailPage';

import { JoiningsListPage } from './pages/joinings/JoiningsListPage';
import { JoiningFormPage } from './pages/joinings/JoiningFormPage';
import { JoiningDetailPage } from './pages/joinings/JoiningDetailPage';

function PitchesListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pitches</h1>
      <p className="text-muted-foreground">Pitch management coming soon...</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* PROTECTED ROUTES */}
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
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />

            <Route path="/pitches" element={<PitchesListPage />} />

            <Route path="/jds" element={<JDsListPage />} />
            <Route path="/jds/new" element={<JDFormPage />} />
            <Route path="/jds/:id" element={<JDDetailPage />} />
            <Route path="/jds/:id/edit" element={<JDFormPage />} />

            <Route path="/candidates" element={<CandidatesListPage />} />
            <Route path="/candidates/new" element={<CandidateFormPage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />

            <Route path="/applications" element={<ApplicationsListPage />} />
            <Route path="/applications/new" element={<ApplicationFormPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />

            <Route path="/interviews" element={<InterviewsListPage />} />
            <Route path="/interviews/new" element={<InterviewFormPage />} />
            <Route path="/interviews/:id" element={<InterviewDetailPage />} />
            <Route path="/interviews/:id/edit" element={<InterviewFormPage />} />

            <Route path="/offers" element={<OffersListPage />} />
            <Route path="/offers/new" element={<OfferFormPage />} />
            <Route path="/offers/:id" element={<OfferDetailPage />} />
            <Route path="/offers/:id/edit" element={<OfferFormPage />} />

            <Route path="/joinings" element={<JoiningsListPage />} />
            <Route path="/joinings/new" element={<JoiningFormPage />} />
            <Route path="/joinings/:id" element={<JoiningDetailPage />} />
            <Route path="/joinings/:id/edit" element={<JoiningFormPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}

export default App;
