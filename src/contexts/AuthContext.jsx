import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])

  // Load all users from localStorage on startup
  useEffect(() => {
    const storedUsers = localStorage.getItem('allUsers')
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers))
    } else {
      // Default mock users
      const defaultUsers = [
        { id: 'admin1', name: 'Mr. Anderson', email: 'admin@school.com', password: 'password123', role: 'admin', section: 'All', subjects: ['All'] },
        { id: 's1', name: 'John Smith', email: 'student1@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
        { id: 's2', name: 'Jane Doe', email: 'student2@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
        { id: 's3', name: 'Mike Johnson', email: 'student3@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
        { id: 's4', name: 'Sarah Wilson', email: 'student4@school.com', password: 'password123', role: 'student', section: 'CS-B', subjects: ['Web Development', 'Database Systems'] },
        { id: 's5', name: 'Tom Brown', email: 'student5@school.com', password: 'password123', role: 'student', section: 'IT-A', subjects: ['Web Development'] },
      ]
      setAllUsers(defaultUsers)
      localStorage.setItem('allUsers', JSON.stringify(defaultUsers))
    }

    // Check for logged in user
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (email, password, role) => {
    // Read from localStorage to always have latest data (avoids stale state after register)
    const users = JSON.parse(localStorage.getItem('allUsers') || '[]')
    const foundUser = users.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      // Check if role matches
      if (foundUser.role !== role) {
        return { success: false, message: `Please login as ${foundUser.role}` }
      }
      const userData = { 
        id: foundUser.id, 
        name: foundUser.name, 
        email: foundUser.email, 
        role: foundUser.role,
        section: foundUser.section,
        subjects: foundUser.subjects
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, user: userData }
    }
    
    return { success: false, message: 'Invalid email or password' }
  }

  const register = (userData) => {
    const { name, email, password, role, enrollments = [] } = userData
  
    // Check if user already exists
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
      // For students: store full subject+section pairs
      enrollments: role === 'student' ? enrollments : [],
    }
  
    const updatedUsers = [...allUsers, newUser]
    setAllUsers(updatedUsers)
    localStorage.setItem('allUsers', JSON.stringify(updatedUsers))
  
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('user', JSON.stringify(userWithoutPassword))
    
    return { success: true, user: userWithoutPassword }
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}