import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { 
    projects, 
    createProject, 
    createGroup,
    autoCreateGroupsForProject,
    getGroupsByProject,
    assignMarks,
    deleteProject,
    getEligibleStudentsForProject
  } = useData()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [filterSection, setFilterSection] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [gradingGroup, setGradingGroup] = useState(null)
  const [marks, setMarks] = useState('')

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    section: '',
    subject: '',
    deadline: '',
    groupSize: 4
  })

  const sections = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5']
  const subjects = ['FSAD', 'DBMS', 'OS', 'CN']
  const today = new Date().toISOString().split('T')[0]
  const filteredProjects = projects.filter(p => 
    (filterSection === '' || p.section === filterSection) &&
    (filterSubject === '' || p.subject === filterSubject)
  )

  const handleCreateProject = (e) => {
    e.preventDefault()
    if (newProject.deadline < today) {
      alert('Deadline cannot be before today')
      return
    }
    createProject(newProject)
    setShowCreateModal(false)
    setNewProject({
      title: '',
      description: '',
      section: '',
      subject: '',
      deadline: '',
      groupSize: 4
    })
  }

  const openGroupModal = (project) => {
    setSelectedProject(project)
    setSelectedStudents([])
    setShowGroupModal(true)
  }

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      if (selectedStudents.length < selectedProject.groupSize) {
        setSelectedStudents([...selectedStudents, studentId])
      } else {
        alert(`Maximum ${selectedProject.groupSize} students allowed`)
      }
    }
  }

  const handleCreateGroup = () => {
    if (selectedStudents.length < 2) {
      alert('At least 2 students required')
      return
    }
    createGroup(selectedProject.id, selectedStudents)
    setShowGroupModal(false)
  }

  const handleAssignMarks = () => {
    if (marks < 0 || marks > 100) {
      alert('Marks must be between 0 and 100')
      return
    }
    assignMarks(gradingGroup.id, parseInt(marks))
    setShowGradeModal(false)
    setGradingGroup(null)
    setMarks('')
  }
  const handleDeleteProject = (project) => {
    const ok = window.confirm(`Are you sure you want to delete project "${project.title}"? This will also remove its groups and tasks.`)
    if (!ok) return
    deleteProject(project.id)
  }
  // const projectGroups = selectedProject ? getGroupsByProject(selectedProject.id) : []

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Project
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Filter by Section:</label>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by Subject:</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Projects List */}
      <div className="projects-grid">
        {filteredProjects.map(project => {
          const projectGroupsList = getGroupsByProject(project.id)
          const completedGroups = projectGroupsList.filter(g => String(g.status).toLowerCase() === 'submitted').length
          
          return (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className="badge">{project.status}</span>
              </div>
              <p className="project-subject">{project.subject} - {project.section}</p>
              <p className="project-desc">{project.description}</p>
              <div className="project-info">
                <span>📅 Deadline: {project.deadline}</span>
                <span>👥 Group Size: {project.groupSize}</span>
              </div>
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-number">{projectGroupsList.length}</span>
                  <span className="stat-label">Groups</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{completedGroups}</span>
                  <span className="stat-label">Submitted</span>
                </div>
              </div>
              <div className="project-actions">
  <button 
    className="btn-primary"
    onClick={() => {
      setSelectedProject(project)
      navigate(`/admin/project/${project.id}`)
    }}
  >
    View Details
  </button>
  <button 
    className="btn-secondary"
    onClick={() => openGroupModal(project)}
  >
    Form Group (Manual)
  </button>
  <button
    className="btn-secondary"
    onClick={() => autoCreateGroupsForProject(project.id)}
  >
    Auto Form Groups
  </button>
  <button
    className="btn-danger"
    onClick={() => handleDeleteProject(project)}
  >
    Delete
  </button>
</div>
            </div>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="empty-state">
          <p>No projects found. Create your first project!</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  placeholder="Enter project title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Enter project description"
                  rows="3"
                  required
                />
              </div>
              <div className="form-row">
  <div className="form-group">
    <label>Subject</label>
    <select
      value={newProject.subject}
      onChange={(e) => setNewProject({ ...newProject, subject: e.target.value })}
      required
    >
      <option value="">Select Subject</option>
      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>

  <div className="form-group">
    <label>Section</label>
    <select
      value={newProject.section}
      onChange={(e) => setNewProject({ ...newProject, section: e.target.value })}
      required
    >
      <option value="">Select Section</option>
      {sections.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    min={today}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Group Size</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={newProject.groupSize}
                    onChange={(e) => setNewProject({...newProject, groupSize: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Create Project</button>
            </form>
          </div>
        </div>
      )}

      {/* Form Group Modal */}
      {showGroupModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Form Group for {selectedProject.title}</h2>
              <button className="close-btn" onClick={() => setShowGroupModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Select Students (Max: {selectedProject.groupSize})</label>
              <div className="student-list">
  {getEligibleStudentsForProject(selectedProject).map(student => (
    <div 
      key={student.id} 
      className={`student-item ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
      onClick={() => toggleStudent(student.id)}
    >
      <input 
        type="checkbox" 
        checked={selectedStudents.includes(student.id)}
        onChange={() => toggleStudent(student.id)}
      />
      <span>{student.name}</span>
      <span className="student-email">{student.email}</span>
    </div>
  ))}
</div>
            </div>
            <p className="selected-count">Selected: {selectedStudents.length}/{selectedProject.groupSize}</p>
            <button className="btn-primary" onClick={handleCreateGroup}>
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && gradingGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign Marks</h2>
              <button className="close-btn" onClick={() => setShowGradeModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Enter Marks (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="Enter marks"
              />
            </div>
            <button className="btn-primary" onClick={handleAssignMarks}>
              Submit Marks
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminDashboard
