import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Register.css'

const SECTIONS = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5']
const SUBJECTS = ['FSAD', 'DBMS', 'OS', 'CN']

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  
  const [enrollments, setEnrollments] = useState(
    SUBJECTS.map(sub => ({ subject: sub, section: '' }))
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const handleEnrollmentChange = (index, section) => {
    setEnrollments(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], section }
      return copy
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
  
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
  
    // For students, require at least one subject+section pair
    let cleanedEnrollments = []
    if (formData.role === 'student') {
      cleanedEnrollments = enrollments.filter(e => e.section)
      if (cleanedEnrollments.length === 0) {
        setError('Please choose at least one subject with a section')
        return
      }
    }
  
    setLoading(true)
    const result = register({
      ...formData,
      enrollments: formData.role === 'student' ? cleanedEnrollments : [],
    })
  
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : '/student')
    } else {
      setError(result.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="register-container">
      <div className="register-card">
      <div className="register-header">
  <h1>Student Group Project Management</h1>
  <p>Create your account</p>
</div>

        <form onSubmit={handleSubmit} className="register-form">
          <h2>Register</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          {formData.role === 'student' && (
  <div className="form-group">
    <label>Subjects and Sections</label>
    {SUBJECTS.map((sub, index) => (
      <div key={sub} className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>{sub}</label>
          <select
            value={enrollments[index].section}
            onChange={(e) => handleEnrollmentChange(index, e.target.value)}
          >
            <option value="">No section (not taking this subject)</option>
            {SECTIONS.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>
    ))}
    <small>Choose a section for each subject you are taking. Leave blank if you don’t take that subject.</small>
  </div>
)}

          <div className="form-group">
            <label>Register As</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="admin">Teacher/Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary register-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  )}