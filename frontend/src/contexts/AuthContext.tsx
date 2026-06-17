import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'

interface AuthUser {
  _id: string
  id: string
  name: string
  role: 'intern' | 'admin' | 'superadmin'
  isFirstTimeIntern: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string) => Promise<string>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))

    const _id =
      decoded.userId ??
      decoded.sub ??
      decoded._id ??
      decoded.id

    if (!_id) return null

    return {
      _id,
      id: _id,
      name: decoded.name ?? '',
      role: decoded.role,
      isFirstTimeIntern: decoded.isFirstTimeIntern ?? true,
    }
  } catch {
    return null
  }
}

function getLandingRoute(role: string): string {
  if (role === 'admin' || role === 'superadmin') {
    return '/admin/queries'
  }

  return '/faqs'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)

    const decoded = decodeJwt(storedToken)

    if (decoded) {
      setUser(decoded)

      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        localStorage.setItem('user', JSON.stringify(decoded))
      }
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        const fullUser: AuthUser = {
          _id: data.userId,
          id: data.userId,
          name: data.name,
          role: data.role,
          isFirstTimeIntern: data.isFirstTimeIntern ?? true,
        }

        setUser(fullUser)
        localStorage.setItem('user', JSON.stringify(fullUser))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        setUser(null)
        setToken(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(async (newToken: string): Promise<string> => {
    localStorage.setItem('token', newToken)
    setToken(newToken)

    const decoded = decodeJwt(newToken)

    if (decoded) {
      setUser(decoded)

      // IMPORTANT: save immediately for route guards
      localStorage.setItem('user', JSON.stringify(decoded))

      api
        .get('/auth/me')
        .then(({ data }) => {
          const fullUser: AuthUser = {
            _id: data.userId,
            id: data.userId,
            name: data.name,
            role: data.role,
            isFirstTimeIntern: data.isFirstTimeIntern ?? true,
          }

          setUser(fullUser)
          localStorage.setItem('user', JSON.stringify(fullUser))
        })
        .catch(() => {
          // ignore background refresh failures
        })

      return getLandingRoute(decoded.role)
    }

    const { data } = await api.get('/auth/me')

    const fullUser: AuthUser = {
      _id: data.userId,
      id: data.userId,
      name: data.name,
      role: data.role,
      isFirstTimeIntern: data.isFirstTimeIntern ?? true,
    }

    setUser(fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    return getLandingRoute(data.role)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return ctx
}