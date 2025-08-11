// contexts/AuthContext.tsx
import React, { createContext, useContext, useState,type ReactNode } from 'react'

type AuthMethod = 'secret' | 'wallet' | null

interface AuthContextType {
  isAuthenticated: boolean
  authMethod: AuthMethod
  setIsAuthenticated: (value: boolean) => void
  setAuthMethod: (method: AuthMethod) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)

  const logout = () => {
    setIsAuthenticated(false)
    setAuthMethod(null)
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      authMethod,
      setIsAuthenticated, 
      setAuthMethod,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}