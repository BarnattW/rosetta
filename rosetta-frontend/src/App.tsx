import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import JobStatus from './pages/JobStatus'
import CaptionEditor from './pages/CaptionEditor'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/jobs/:jobId/status" element={<ProtectedRoute><JobStatus /></ProtectedRoute>} />
        <Route path="/jobs/:jobId/captions" element={<ProtectedRoute><CaptionEditor /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
