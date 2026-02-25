import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import './AdminProjectView.css'

const AdminProjectView = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { 
    projects, 
    groups, 
    getGroupsByProject, 
    assignMarks,
    students 
  } = useData()

  const [showGradeModal, setShowGradeModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [marks, setMarks] = useState('')

  const project = projects.find(p => p.id === projectId)
  const projectGroups = getGroupsByProject(projectId)

  const getMemberDetails = (memberId) => {
    return students.find(s => s.id === memberId) || { name: 'Unknown', email: '' }
  }

  const openGradeModal = (group) => {
    setSelectedGroup(group)
    setMarks(group.marks || '')
    setShowGradeModal(true)
  }

  const handleAssignMarks = () => {
    const marksNum = parseInt(marks)
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      alert('Marks must be between 0 and 100')
      return
    }
    assignMarks(selectedGroup.id, marksNum)
    setShowGradeModal(false)
    setSelectedGroup(null)
    setMarks('')
  }

  const downloadProject = (group) => {
    alert(`Downloading: ${group.submissionFile?.name || 'Project File'}`)
  }

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <button className="btn-primary" onClick={() => navigate('/admin')}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="admin-project-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </button>
        <div className="header-info">
          <h1>{project.title}</h1>
          <p className="header-subject">{project.subject} - {project.section}</p>
          <p className="header-desc">{project.description}</p>
        </div>
      </div>

      <div className="view-stats">
        <div className="stat-card">
          <span className="stat-number">{projectGroups.length}</span>
          <span className="stat-label">Total Groups</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{projectGroups.filter(g => g.status === 'Submitted').length}</span>
          <span className="stat-label">Submitted</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{projectGroups.filter(g => g.status === 'Working').length}</span>
          <span className="stat-label">Working</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{projectGroups.filter(g => g.marks !== null).length}</span>
          <span className="stat-label">Graded</span>
        </div>
      </div>

      <div className="groups-section">
        <h2>Project Groups</h2>
        {projectGroups.length === 0 ? (
          <div className="empty-state">
            <p>No groups formed yet for this project.</p>
            <p>Go back to dashboard to form groups.</p>
          </div>
        ) : (
          <div className="groups-table">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Submission</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projectGroups.map((group, index) => (
                  <tr key={group.id}>
                    <td><span className="group-id">Group {index + 1}</span></td>
                    <td>
                      <div className="member-list">
                        {group.members.map(memberId => {
                          const member = getMemberDetails(memberId)
                          return <span key={memberId} className="member-tag">{member.name}</span>
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${group.status.toLowerCase()}`}>
                        {group.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${group.progress}%` }}></div></div>
                        <span>{group.progress}%</span>
                      </div>
                    </td>
                    <td>
                      {group.submissionFile ? (
                        <span className="file-name">📎 {group.submissionFile.name || 'File'}</span>
                      ) : (
                        <span className="no-file">Not submitted</span>
                      )}
                    </td>
                    <td>
                      {group.marks !== null ? (
                        <span className="marks-value">{group.marks}/100</span>
                      ) : (
                        <span className="no-marks">Not graded</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {group.submissionFile && (
                          <button className="btn-download" onClick={() => downloadProject(group)}>
                            📥 Download
                          </button>
                        )}
                        <button 
                          className="btn-grade"
                          onClick={() => openGradeModal(group)}
                          disabled={!group.submissionFile}
                        >
                          {group.marks !== null ? '✏️ Update' : '📝 Grade'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {showGradeModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign Marks</h2>
              <button className="close-btn" onClick={() => setShowGradeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>Group Members:</strong><br/>
                {selectedGroup.members.map(id => getMemberDetails(id).name).join(', ')}
              </p>
              <p className="modal-info">
                <strong>Submitted File:</strong><br/>
                {selectedGroup.submissionFile?.name || 'Project File'}
              </p>
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
              <button className="btn-primary submit-marks" onClick={handleAssignMarks}>
                Submit Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProjectView