import React, { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/authApi'

const AuthContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState(() => {
    const storedUsers = localStorage.getItem('allUsers')
    if (storedUsers) return JSON.parse(storedUsers)

    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'
    if (apiEnabled) {
      localStorage.setItem('allUsers', JSON.stringify([]))
      return []
    }

    const defaultUsers = [
      { id: 'admin1', name: 'Mr. Anderson', email: 'admin@school.com', password: 'password123', role: 'admin', section: 'All', subjects: ['All'] },
      { id: 's1', name: 'John Smith', email: 'student1@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
      { id: 's2', name: 'Jane Doe', email: 'student2@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
      { id: 's3', name: 'Mike Johnson', email: 'student3@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
      { id: 's4', name: 'Sarah Wilson', email: 'student4@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
      { id: 's5', name: 'Tom Brown', email: 'student5@school.com', password: 'password123', role: 'student', section: 'IT-A', subjects: ['Web Development'] },
    ]
    localStorage.setItem('allUsers', JSON.stringify(defaultUsers))
    return defaultUsers
  })

  useEffect(() => {
    localStorage.setItem('allUsers', JSON.stringify(allUsers))
  }, [allUsers])

  const normalizeRole = (value) => {
    if (!value) return value
    const r = String(value).toLowerCase()
    if (r === 'teacher') return 'admin'
    if (r === 'faculty') return 'admin'
    return r
  }

  const login = async (email, password, role) => {
    setLoading(true)
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (!apiEnabled) {
      try {
        const users = JSON.parse(localStorage.getItem('allUsers') || '[]')
        const foundUser = users.find(u => u.email === email && u.password === password)

        if (foundUser) {
          if (foundUser.role !== role) {
            return { success: false, message: `Please login as ${foundUser.role}` }
          }
          const userData = { 
            id: foundUser.id, 
            name: foundUser.name, 
            email: foundUser.email, 
            role: foundUser.role,
            section: foundUser.section,
            subjects: foundUser.subjects,
            enrollments: foundUser.enrollments || [],
          }
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          return { success: true, user: userData }
        }

        return { success: false, message: 'Invalid email or password' }
      } finally {
        setLoading(false)
      }
    }

    try {
      const response = await authApi.login({ email, password })
      const token = response?.token || response?.accessToken || response?.jwt
      const userPayload = response?.user || response

      const userData = {
        ...userPayload,
        role: normalizeRole(userPayload?.role),
      }

      if (userData?.role && role && userData.role !== role) {
        return { success: false, message: `Please login as ${userData.role}` }
      }

      if (token) localStorage.setItem('authToken', token)
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))

      // keep local student list usable in UI (members -> names)
      const users = JSON.parse(localStorage.getItem('allUsers') || '[]')
      if (userData?.email && !users.some(u => u.email === userData.email)) {
        const updated = [...users, userData]
        localStorage.setItem('allUsers', JSON.stringify(updated))
        setAllUsers(updated)
      }

      return { success: true, user: userData }
    } catch (e) {
      return { success: false, message: e?.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    const { name, email, password, role, enrollments = [] } = userData

    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (!apiEnabled) {
      try {
        const existingUser = allUsers.find(u => u.email === email)
        if (existingUser) {
          return { success: false, message: 'Email already registered' }
        }

        const newUser = { 
          id: `user_${Date.now()}`, 
          name, 
          email, 
          password, 
          role,
          enrollments: role === 'student' ? enrollments : [],
        }

        const updatedUsers = [...allUsers, newUser]
        setAllUsers(updatedUsers)
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers))

        const { password: _, ...userWithoutPassword } = newUser
        setUser(userWithoutPassword)
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        return { success: true, user: userWithoutPassword }
      } finally {
        setLoading(false)
      }
    }

    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role,
        enrollments: role === 'student' ? enrollments : [],
      })

      const token = response?.token || response?.accessToken || response?.jwt
      const userPayload = response?.user || response
      const userSafe = {
        ...userPayload,
        role: normalizeRole(userPayload?.role || role),
        enrollments: userPayload?.enrollments || (role === 'student' ? enrollments : []),
      }

      if (token) localStorage.setItem('authToken', token)
      setUser(userSafe)
      localStorage.setItem('user', JSON.stringify(userSafe))

      const users = JSON.parse(localStorage.getItem('allUsers') || '[]')
      const updated = users.some(u => u.email === email) ? users : [...users, userSafe]
      localStorage.setItem('allUsers', JSON.stringify(updated))
      setAllUsers(updated)

      return { success: true, user: userSafe }
    } catch (e) {
      return { success: false, message: e?.message || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')

    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'
    if (apiEnabled) {
      authApi.logout().catch(() => {})
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )} 
