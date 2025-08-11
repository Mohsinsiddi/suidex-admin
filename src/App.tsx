import React from 'react'
import AdminDashboard from './components/AdminDashboard'
import { AuthModal } from './components/AuthModal'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()

  // Show admin dashboard if user is authenticated
  if (isAuthenticated) {
    return <AdminDashboard />
  }

  // Show auth modal by default - this is the first barrier
  return (
    <AuthModal 
      isOpen={true}
      onClose={() => {}} // Prevent closing - auth is required
      onAuthenticated={() => {}} // Handled by context
    />
  )
}

export default App