import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import JobStatus from './pages/JobStatus'
import CaptionEditor from './pages/CaptionEditor'
import ComingSoon from './pages/ComingSoon'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import { ToastProvider } from './components/Toast'

export default function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <AppLayout><Upload /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/jobs/:jobId/status" element={
          <ProtectedRoute>
            <AppLayout><JobStatus /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/jobs/:jobId/captions" element={
          <ProtectedRoute><CaptionEditor /></ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <AppLayout><ComingSoon title="Billing" description="Token purchases and usage history coming soon." /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout><ComingSoon title="Settings" description="Account settings and preferences coming soon." /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  )
}
