import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import './ProjectDetails.css'

const ProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    projects, 
    students,
    getGroupByProjectAndUser,
    getTasksByGroup,
    addTask,
    updateTaskStatus,
    submitProject,
    deleteSubmission
  } = useData()
  const [activeTab, setActiveTab] = useState('details')
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isEditingSubmission, setIsEditingSubmission] = useState(false)

  const project = projects.find(p => String(p.id) === String(projectId))
  const userGroup = getGroupByProjectAndUser(projectId, user.id)
  const groupTasks = userGroup ? getTasksByGroup(userGroup.id) : []

  const getMemberDetails = (memberId) => {
    return students.find(s => s.id === memberId) || { name: 'Unknown', email: '' }
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTask.title || !newTask.assignedTo) {
      alert('Please fill in all fields')
      return
    }
    addTask(userGroup.id, {
      title: newTask.title,
      assignedTo: newTask.assignedTo,
      createdBy: user.id
    })
    setNewTask({ title: '', assignedTo: '' })
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    updateTaskStatus(taskId, newStatus)
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }
    if (!confirm('Are you sure you want to submit this project?')) {
      return
    }    submitProject(userGroup.id, selectedFile)
    alert(String(userGroup.status).toLowerCase() === 'submitted' ? 'Submission updated successfully!' : 'Project submitted successfully!')
    setSelectedFile(null)
    setIsEditingSubmission(false)
  }

  const handleDeleteSubmission = () => {
    if (!userGroup || String(userGroup.status).toLowerCase() !== 'submitted') return
    if (!confirm('Are you sure you want to delete your submission?')) {
      return
    }
    deleteSubmission(userGroup.id)
    setSelectedFile(null)
    setIsEditingSubmission(false)
    alert('Submission deleted successfully!')
  }

  const getSubmissionFileName = () => {
    if (!userGroup?.submissionFile) return 'Project File'
    return typeof userGroup.submissionFile === 'string'
      ? userGroup.submissionFile
      : userGroup.submissionFile.name
  }

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <button className="btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  const isGroupLeader = userGroup && userGroup.leaderId === user.id

  return (
    <div className="project-details">
      {/* Header */}
      <div className="details-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="header-content">
          <h1>{project.title}</h1>
          <p className="header-subject">{project.subject} - {project.section}</p>
        </div>
        {userGroup && (
          <div className="header-status">
            <span className={`status-badge ${userGroup.status.toLowerCase()}`}>
              {userGroup.status}
            </span>
            {userGroup.marks !== null && (
              <span className="marks-badge">
                Marks: {userGroup.marks}/100
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
          📋 Details
        </button>
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          📝 Tasks ({groupTasks.length})
        </button>
        <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
          👥 Team
        </button>
        <button className={`tab ${activeTab === 'submission' ? 'active' : ''}`} onClick={() => setActiveTab('submission')}>
          📤 Submission
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="detail-card">
              <h3>Description</h3>
              <p>{project.description}</p>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">📅 Deadline</span>
                <span className="detail-value">{project.deadline}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">👥 Group Size</span>
                <span className="detail-value">{project.groupSize} students</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📚 Subject</span>
                <span className="detail-value">{project.subject}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🏫 Section</span>
                <span className="detail-value">{project.section}</span>
              </div>
            </div>
            {userGroup && (
              <div className="progress-section">
                <h3>Project Progress</h3>
                <div className="progress-container">
                  <div className="progress-bar-large">
                    <div className="progress-fill-large" style={{ width: `${userGroup.progress}%` }}></div>
                  </div>
                  <span className="progress-percentage">{userGroup.progress}%</span>
                </div>
              </div>
            )}
            {!userGroup && <div className="not-joined-notice"><p>⚠️ You are not assigned to a group yet.</p></div>}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            {userGroup ? (
              <>
                {isGroupLeader && (
                  <div className="add-task-form">
                    <h3>Assign New Task</h3>
                    <form onSubmit={handleAddTask}>
                      <div className="task-form-row">
                        <input type="text" placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} required />
                        <select value={newTask.assignedTo} onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})} required>
                          <option value="">Select Member</option>
                          {(userGroup.members || []).map(memberId => {
                            const member = getMemberDetails(memberId)
                            return <option key={memberId} value={memberId}>{member.name}</option>
                          })}
                        </select>
                        <button type="submit" className="btn-primary">+ Add Task</button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="tasks-list">
                  <h3>Team Tasks</h3>
                  {groupTasks.length === 0 ? <div className="no-tasks"><p>No tasks yet</p></div> : groupTasks.map(task => {
                    const assignedMember = getMemberDetails(task.assignedToId || task.assignedTo)
                    return (
                      <div key={task.id} className={`task-card ${task.status.toLowerCase().replace(' ', '-')}`}>
                        <div className="task-info">
                          <h4>{task.title}</h4>
                          <span className="assigned-to">Assigned to: {assignedMember.name}</span>
                        </div>
                        <select value={task.status} onChange={(e) => handleTaskStatusChange(task.id, e.target.value)} className={`status-select ${task.status.toLowerCase().replace(' ', '-')}`}>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : <div className="not-joined-notice"><p>Join a group to manage tasks</p></div>}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="team-tab">
            {userGroup ? (
              <div className="team-grid">
                {(userGroup.members || []).map(memberId => {
                  const member = getMemberDetails(memberId)
                  const isLeader = memberId === userGroup.leaderId
                  return (
                    <div key={memberId} className={`team-card ${isLeader ? 'leader' : ''}`}>
                      <div className="member-avatar-large">{(member.name || 'M').charAt(0)}</div>
                      <h4>{member.name}</h4>
                      <p className="member-email">{member.email}</p>
                      {isLeader && <span className="leader-badge">👑 Group Leader</span>}
                      {memberId === user.id && <span className="you-badge">You</span>}
                    </div>
                  )
                })}
              </div>
            ) : <div className="not-joined-notice"><p>You are not in a group</p></div>}
          </div>
        )}

        {/* Submission Tab */}
        {activeTab === 'submission' && (
          <div className="submission-tab">
            {userGroup ? (
              <div className="submission-content">                {String(userGroup.status).toLowerCase() === 'submitted' ? (
                  <div className="submitted-status">
                    <div className="success-icon">✅</div>
                    <h3>Project Submitted!</h3>
                    <p className="file-info">📎 File: {getSubmissionFileName()}</p>
                    {userGroup.marks !== null && (
                      <div className="marks-received">
                        <h4>Marks Received: {userGroup.marks}/100</h4>
                      </div>
                    )}
                    <div className="submission-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setIsEditingSubmission(prev => !prev)}
                      >
                        {isEditingSubmission ? 'Cancel Edit' : 'Edit Submission'}
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={handleDeleteSubmission}
                      >
                        Delete Submission
                      </button>
                    </div>
                    {isEditingSubmission && (
                      <div className="submit-form submission-edit-form">
                        <h3>Edit Submission</h3>
                        <p className="submit-instructions">Upload a new project file to replace the current submission</p>
                        <form onSubmit={handleSubmit}>
                          <div className="file-input-wrapper">
                            <input type="file" id="project-file-edit" onChange={handleFileChange} accept=".zip,.pdf,.doc,.docx,.ppt,.pptx" />
                            <label htmlFor="project-file-edit" className="file-label">
                              {selectedFile ? selectedFile.name : '📁 Choose replacement file...'}
                            </label>
                          </div>
                          <button type="submit" className="btn-primary submit-btn">
                            Save Changes
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="submit-form">
                    <h3>Submit Your Project</h3>
                    <p className="submit-instructions">Upload your project files (ZIP, PDF, DOC)</p>
                    <form onSubmit={handleSubmit}>
                      <div className="file-input-wrapper">
                        <input type="file" id="project-file" onChange={handleFileChange} accept=".zip,.pdf,.doc,.docx,.ppt,.pptx" />
                        <label htmlFor="project-file" className="file-label">
                          {selectedFile ? selectedFile.name : '📁 Choose file...'}
                        </label>
                      </div>
                      <button type="submit" className="btn-primary submit-btn">
                        📤 Submit Project
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : <div className="not-joined-notice"><p>Join a group to submit project</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}
export default ProjectDetails
