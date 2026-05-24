import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthSessionRedirect } from './components/AuthSessionRedirect'
import { ErrorBoundary } from './components/ErrorBoundary'

import Landing           from './pages/Landing'
import Login             from './pages/Login'
import Register          from './pages/Register'
import Settings          from './pages/Settings'
import CoachDashboard    from './pages/coach/CoachDashboard'
import CoachOnboarding   from './pages/coach/CoachOnboarding'
import CoachAtletas      from './pages/coach/CoachAtletas'
import CoachAthleteDetail from './pages/coach/CoachAthleteDetail'
import CoachNuevoAtleta  from './pages/coach/CoachNuevoAtleta'
import CoachPlanner      from './pages/coach/CoachPlanner'
import CoachNuevoWod     from './pages/coach/CoachNuevoWod'
import CoachWhatsApp     from './pages/coach/CoachWhatsApp'
import JoinRedirect      from './pages/JoinRedirect'
import CoachBilling      from './pages/coach/CoachBilling'
import CoachLibrary      from './pages/coach/CoachLibrary'
import CoachGroups       from './pages/coach/CoachGroups'
import AthleteHome       from './pages/athlete/AthleteHome'
import AthleteWeek       from './pages/athlete/AthleteWeek'
import AthleteHistory    from './pages/athlete/AthleteHistory'
import AthleteSubscription from './pages/athlete/AthleteSubscription'
import AthleteSession    from './pages/athlete/AthleteSession'
import AthleteOnboarding from './pages/athlete/AthleteOnboarding'
import AthleteTimers     from './pages/athlete/AthleteTimers'
import AthleteTimerEdit  from './pages/athlete/AthleteTimerEdit'
import TimerPicker       from './pages/timers/TimerPicker'
import TimerAmrap        from './pages/timers/TimerAmrap'
import TimerEmom         from './pages/timers/TimerEmom'
import TimerForTime      from './pages/timers/TimerForTime'
import TimerTabata       from './pages/timers/TimerTabata'

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
          <AuthSessionRedirect />
          <Routes>
            <Route path="/"        element={<Landing />} />
            <Route path="/demo"    element={<Navigate to="/register?role=coach" replace />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join/:coachId" element={<JoinRedirect />} />

            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />

            {/* Coach routes */}
            <Route path="/coach/onboarding" element={
              <ProtectedRoute role="coach"><CoachOnboarding /></ProtectedRoute>
            } />
            <Route path="/coach" element={
              <ProtectedRoute role="coach"><CoachDashboard /></ProtectedRoute>
            } />
            <Route path="/coach/athletes" element={
              <ProtectedRoute role="coach"><CoachAtletas /></ProtectedRoute>
            } />
            <Route path="/coach/athletes/new" element={
              <ProtectedRoute role="coach"><CoachNuevoAtleta /></ProtectedRoute>
            } />
            <Route path="/coach/athletes/:athleteId" element={
              <ProtectedRoute role="coach"><CoachAthleteDetail /></ProtectedRoute>
            } />
            <Route path="/coach/planner" element={
              <ProtectedRoute role="coach"><CoachPlanner /></ProtectedRoute>
            } />
            <Route path="/coach/planner/new" element={
              <ProtectedRoute role="coach"><CoachNuevoWod /></ProtectedRoute>
            } />
            <Route path="/coach/groups" element={
              <ProtectedRoute role="coach"><CoachGroups /></ProtectedRoute>
            } />
            <Route path="/coach/whatsapp" element={
              <ProtectedRoute role="coach"><CoachWhatsApp /></ProtectedRoute>
            } />
            <Route path="/coach/messages" element={<Navigate to="/coach/whatsapp" replace />} />
            <Route path="/coach/billing" element={
              <ProtectedRoute role="coach"><CoachBilling /></ProtectedRoute>
            } />
            <Route path="/coach/library" element={
              <ProtectedRoute role="coach"><CoachLibrary /></ProtectedRoute>
            } />

            {/* Athlete routes */}
            <Route path="/athlete" element={
              <ProtectedRoute role="athlete"><AthleteHome /></ProtectedRoute>
            } />
            <Route path="/athlete/week" element={
              <ProtectedRoute role="athlete"><AthleteWeek /></ProtectedRoute>
            } />
            <Route path="/athlete/history" element={
              <ProtectedRoute role="athlete"><AthleteHistory /></ProtectedRoute>
            } />
            <Route path="/athlete/timers" element={
              <ProtectedRoute role="athlete"><AthleteTimers /></ProtectedRoute>
            } />
            <Route path="/athlete/timers/:mode" element={
              <ProtectedRoute role="athlete"><AthleteTimerEdit /></ProtectedRoute>
            } />
            <Route path="/athlete/subscription" element={
              <ProtectedRoute role="athlete"><AthleteSubscription /></ProtectedRoute>
            } />
            <Route path="/athlete/session" element={
              <ProtectedRoute role="athlete"><AthleteSession /></ProtectedRoute>
            } />
            <Route path="/athlete/onboarding" element={
              <ProtectedRoute role="athlete"><AthleteOnboarding /></ProtectedRoute>
            } />

            {/* Timers (accessible to all authenticated users) */}
            <Route path="/timers"          element={<ProtectedRoute><TimerPicker /></ProtectedRoute>} />
            <Route path="/timers/amrap"    element={<ProtectedRoute><TimerAmrap /></ProtectedRoute>} />
            <Route path="/timers/emom"     element={<ProtectedRoute><TimerEmom /></ProtectedRoute>} />
            <Route path="/timers/fortime"  element={<ProtectedRoute><TimerForTime /></ProtectedRoute>} />
            <Route path="/timers/tabata"   element={<ProtectedRoute><TimerTabata /></ProtectedRoute>} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  )
}
