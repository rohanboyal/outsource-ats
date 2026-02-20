// src/App.tsx - LATEST VERSION WITH PROFILE ROUTE
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, AdminRoute, ClientRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
// ❌ RegisterPage removed - users are now created by admin only
// import { RegisterPage } from './pages/auth/RegisterPage';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage'; // ← NEW: User Profile

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

import { PitchesListPage } from './pages/pitches/PitchesListPage';
import { PitchFormPage } from './pages/pitches/PitchFormPage';
import { PitchDetailPage } from './pages/pitches/PitchDetailPage';

import { ClientLayout } from './pages/client/ClientLayout';
import { ClientDashboardPage } from './pages/client/ClientDashboardPage';
import { ClientCandidatesPage } from './pages/client/ClientCandidatesPage';
import { ClientJDsPage } from './pages/client/ClientJDsPage';
import { ClientInterviewsPage } from './pages/client/ClientInterviewsPage';

// ✅ Admin Pages
import { ManageClientUsersPage } from './pages/admin/ManageClientUsersPage';
import { TeamMembersPage } from './pages/admin/TeamMembersPage';

// Smart redirect based on user role
function RoleBasedRedirect() {
  const { user } = useAuthStore();
  
  if (user?.role === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* ══════════════════════════════════════════
              PUBLIC ROUTES
          ══════════════════════════════════════════ */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            {/* ❌ REGISTER DISABLED - Redirects to login */}
            <Route path="/register" element={<Navigate to="/login" replace />} />
          </Route>

          {/* ══════════════════════════════════════════
              CLIENT PORTAL - Separate Routes
          ══════════════════════════════════════════ */}
          <Route path="/client" element={
            <ClientRoute>
              <ClientLayout />
            </ClientRoute>
          }>
            <Route index element={<Navigate to="/client/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboardPage />} />
            <Route path="candidates" element={<ClientCandidatesPage />} />
            <Route path="jds" element={<ClientJDsPage />} />
            <Route path="interviews" element={<ClientInterviewsPage />} />
          </Route>

          {/* ══════════════════════════════════════════
              MAIN APP - Protected Routes
          ══════════════════════════════════════════ */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            {/* Root & Dashboard */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* ──────────────────────────────────────
                USER PROFILE (All Users)
            ────────────────────────────────────── */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* ──────────────────────────────────────
                CLIENTS MODULE
                Access: Admin, Account Manager, BD/Sales, Finance
            ────────────────────────────────────── */}
            <Route path="/clients" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales', 'finance']}>
                <ClientsListPage />
              </ProtectedRoute>
            } />
            <Route path="/clients/new" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <ClientFormPage />
              </ProtectedRoute>
            } />
            <Route path="/clients/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales', 'finance']}>
                <ClientDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/clients/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <ClientFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                PITCHES MODULE
                Access: Admin, Account Manager, BD/Sales
            ────────────────────────────────────── */}
            <Route path="/pitches" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <PitchesListPage />
              </ProtectedRoute>
            } />
            <Route path="/pitches/new" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <PitchFormPage />
              </ProtectedRoute>
            } />
            <Route path="/pitches/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <PitchDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/pitches/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager', 'bd_sales']}>
                <PitchFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                JOB DESCRIPTIONS MODULE
                Access: All except Client
            ────────────────────────────────────── */}
            <Route path="/jds" element={<JDsListPage />} />
            <Route path="/jds/new" element={
              <ProtectedRoute allowedRoles={['admin', 'account_manager']}>
                <JDFormPage />
              </ProtectedRoute>
            } />
            <Route path="/jds/:id" element={<JDDetailPage />} />
            <Route path="/jds/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <JDFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                CANDIDATES MODULE
                Access: Admin, Recruiter, Account Manager
            ────────────────────────────────────── */}
            <Route path="/candidates" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <CandidatesListPage />
              </ProtectedRoute>
            } />
            <Route path="/candidates/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <CandidateFormPage />
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <CandidateDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/candidates/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <CandidateFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                APPLICATIONS MODULE
                Access: Admin, Recruiter, Account Manager, Finance
            ────────────────────────────────────── */}
            <Route path="/applications" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <ApplicationsListPage />
              </ProtectedRoute>
            } />
            <Route path="/applications/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <ApplicationFormPage />
              </ProtectedRoute>
            } />
            <Route path="/applications/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <ApplicationDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/applications/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <ApplicationFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                INTERVIEWS MODULE
                Access: Admin, Recruiter, Account Manager, Finance
            ────────────────────────────────────── */}
            <Route path="/interviews" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <InterviewsListPage />
              </ProtectedRoute>
            } />
            <Route path="/interviews/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <InterviewFormPage />
              </ProtectedRoute>
            } />
            <Route path="/interviews/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <InterviewDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/interviews/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <InterviewFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                OFFERS MODULE
                Access: Admin, Recruiter, Account Manager, Finance
            ────────────────────────────────────── */}
            <Route path="/offers" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <OffersListPage />
              </ProtectedRoute>
            } />
            <Route path="/offers/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <OfferFormPage />
              </ProtectedRoute>
            } />
            <Route path="/offers/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <OfferDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/offers/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <OfferFormPage />
              </ProtectedRoute>
            } />

            {/* ──────────────────────────────────────
                JOININGS MODULE
                Access: Admin, Recruiter, Account Manager, Finance
            ────────────────────────────────────── */}
            <Route path="/joinings" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <JoiningsListPage />
              </ProtectedRoute>
            } />
            <Route path="/joinings/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <JoiningFormPage />
              </ProtectedRoute>
            } />
            <Route path="/joinings/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager', 'finance']}>
                <JoiningDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/joinings/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin', 'recruiter', 'account_manager']}>
                <JoiningFormPage />
              </ProtectedRoute>
            } />

            {/* ══════════════════════════════════════════
                ADMIN ONLY ROUTES
            ══════════════════════════════════════════ */}
            
            {/* Client Portal Users Management */}
            <Route path="/admin/client-users" element={
              <AdminRoute>
                <ManageClientUsersPage />
              </AdminRoute>
            } />

            {/* Team Members Management */}
            <Route path="/admin/team" element={
              <AdminRoute>
                <TeamMembersPage />
              </AdminRoute>
            } />

            {/* ──────────────────────────────────────
                CATCH ALL - Role-based redirect
            ────────────────────────────────────── */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Global Toast Notifications */}
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}

export default App;