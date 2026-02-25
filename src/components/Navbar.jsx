import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
  <Link to="/">Student Group Project Management</Link>
</div>
      <div className="navbar-menu">
        {user ? (
          <>
            <span className="navbar-user">
              Welcome, {user.name} ({user.role === 'admin' ? 'Teacher' : 'Student'})
            </span>
            {user.role === 'admin' ? (
              <Link to="/admin" className="navbar-link">Dashboard</Link>
            ) : (
              <Link to="/student" className="navbar-link">Dashboard</Link>
            )}
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar