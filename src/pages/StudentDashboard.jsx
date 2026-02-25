import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import './StudentDashboard.css'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    projects, 
    groups, 
    getGroupByProjectAndUser,
    getProjectsBySectionAndSubject 
  } = useData()

  const [filterSection, setFilterSection] = useState(user?.section || '')
const [filterSubject, setFilterSubject] = useState('')

  // Get unique sections and subjects from projects
  const sections = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5']
  const subjects = ['FSAD', 'DBMS', 'OS', 'CN']

  const canSeeProject = (project, user) => {
    return (user.enrollments || []).some(
      e => e.subject === project.subject && e.section === project.section
    )
  }

  // Filter projects based on user's section and selected filters
  const userProjects = projects.filter(p => {
    // first: only projects for this student's enrolled subject+section
    if (!canSeeProject(p, user)) return false
  
    // then apply the dashboard filters
    const matchesFilterSection = filterSection === '' || p.section === filterSection
    const matchesFilterSubject = filterSubject === '' || p.subject === filterSubject
    return matchesFilterSection && matchesFilterSubject
  })

  const getProjectStatus = (project) => {
    const group = getGroupByProjectAndUser(project.id, user.id)
    if (!group) return 'not-joined'
    if (group.status === 'Submitted') return 'submitted'
    return 'working'
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>📚 Student Dashboard</h1>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-section">{user.section}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Filter by Section:</label>
          <select 
            value={filterSection} 
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by Subject:</label>
          <select 
            value={filterSubject} 
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* My Groups Section */}
      <div className="my-groups-section">
        <h2>My Projects</h2>
        <div className="groups-list">
          {groups
            .filter(g => g.members.includes(user.id))
            .map(group => {
              const project = projects.find(p => p.id === group.projectId)
              if (!project) return null
              
              return (
                <div key={group.id} className="group-card">
                  <div className="group-header">
                    <h3>{project.title}</h3>
                    <span className={`status-badge ${group.status.toLowerCase()}`}>
                      {group.status}
                    </span>
                  </div>
                  <p className="group-subject">{project.subject}</p>
                  <div className="group-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${group.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{group.progress}% Complete</span>
                  </div>
                  <div className="group-members">
                    <span className="members-label">Team Members:</span>
                    <div className="member-avatars">
                      {group.members.map(memberId => {
                        const member = { id: 's1', name: 'John Smith' } // This would come from students data
                        return (
                          <div key={memberId} className="member-avatar" title={member?.name || 'Member'}>
                            {(member?.name || 'M').charAt(0)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    View Project
                  </button>
                </div>
              )
            })}
        </div>
      </div>

      {/* Available Projects Section */}
      <div className="available-projects-section">
        <h2>Available Projects</h2>
        <div className="projects-grid">
          {userProjects.map(project => {
            const status = getProjectStatus(project)
            const group = getGroupByProjectAndUser(project.id, user.id)
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.title}</h3>
                  <span className={`status-badge ${status}`}>
                    {status === 'not-joined' ? 'Available' : status}
                  </span>
                </div>
                <p className="project-subject">{project.subject} - {project.section}</p>
                <p className="project-desc">{project.description}</p>
                <div className="project-info">
                  <span>📅 Deadline: {project.deadline}</span>
                  <span>👥 Group Size: {project.groupSize}</span>
                </div>
                {group && (
                  <div className="group-info">
                    <span>Your Group Progress: {group.progress}%</span>
                  </div>
                )}
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  {status === 'not-joined' ? 'Join Project' : 'View Project'}
                </button>
              </div>
            )
          })}
        </div>

        {userProjects.length === 0 && (
          <div className="empty-state">
            <p>No projects available for your section.</p>
          </div>
        )}
      </div>
    </div>
  )
}
export default StudentDashboard