import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [groups, setGroups] = useState([])
  const [tasks, setTasks] = useState([])
  const [students, setStudents] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Initialize mock students
// Load students from AuthContext users stored in localStorage
const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')

// Keep only students, and map to { id, name, email, section }
setStudents(
  allUsers
    .filter(u => u.role === 'student')
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      enrollments: u.enrollments || [],
    }))
)

    // Initialize mock projects
    setProjects([
      {
        id: 'p1',
        title: 'E-Commerce Platform',
        description: 'Build a full-stack e-commerce application with payment integration, shopping cart, and admin dashboard.',
        section: 'CS-B',
        subject: 'Web Development',
        deadline: '2024-12-15',
        groupSize: 4,
        status: 'Active',
        createdBy: 'admin1',
        createdAt: '2024-11-01'
      },
      {
        id: 'p2',
        title: 'Student Database Management',
        description: 'Design and implement a database system for student records with CRUD operations.',
        section: 'CS-B',
        subject: 'Database Systems',
        deadline: '2024-12-20',
        groupSize: 3,
        status: 'Active',
        createdBy: 'admin1',
        createdAt: '2024-11-05'
      },
      {
        id: 'p3',
        title: 'Library Management System',
        description: 'Create a comprehensive library management software with book tracking and member management.',
        section: 'IT-A',
        subject: 'Web Development',
        deadline: '2024-12-18',
        groupSize: 4,
        status: 'Active',
        createdBy: 'admin1',
        createdAt: '2024-11-10'
      }
    ])

    // Initialize mock groups
    setGroups([
      {
        id: 'g1',
        projectId: 'p1',
        members: ['s1', 's2', 's3', 's4'],
        leaderId: 's1',
        status: 'Working',
        submissionFile: null,
        marks: null,
        progress: 65
      },
      {
        id: 'g2',
        projectId: 'p2',
        members: ['s1', 's6', 's8'],
        leaderId: 's1',
        status: 'Submitted',
        submissionFile: 'project_submission_g2.zip',
        marks: null,
        progress: 100
      }
    ])

    // Initialize mock tasks
    setTasks([
      { id: 't1', groupId: 'g1', title: 'Design Database Schema', assignedTo: 's2', status: 'Completed', createdBy: 's1' },
      { id: 't2', groupId: 'g1', title: 'Create React Components', assignedTo: 's3', status: 'In Progress', createdBy: 's1' },
      { id: 't3', groupId: 'g1', title: 'Implement Authentication', assignedTo: 's4', status: 'Pending', createdBy: 's1' },
      { id: 't4', groupId: 'g1', title: 'Write Documentation', assignedTo: 's1', status: 'Pending', createdBy: 's1' },
      { id: 't5', groupId: 'g2', title: 'Database Design', assignedTo: 's6', status: 'Completed', createdBy: 's1' },
      { id: 't6', groupId: 'g2', title: 'API Development', assignedTo: 's8', status: 'Completed', createdBy: 's1' },
    ])
  }, [])

  // Project operations
  const createProject = (projectData) => {
    const newProject = {
      ...projectData,
      id: `p${Date.now()}`,
      status: 'Active',
      createdBy: user?.id,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setProjects(prev => [...prev, newProject])
    addNotification('Project created successfully!')
    return newProject
  }
  const deleteProject = (projectId) => {
    // Remove the project itself
    setProjects(prev => prev.filter(p => p.id !== projectId))

    // Remove all groups for that project
    const groupsToRemove = groups.filter(g => g.projectId === projectId).map(g => g.id)
    setGroups(prev => prev.filter(g => g.projectId !== projectId))

    // Remove all tasks belonging to those groups
    if (groupsToRemove.length > 0) {
      setTasks(prev => prev.filter(t => !groupsToRemove.includes(t.groupId)))
    }

    addNotification('Project deleted successfully!')
  }

  const getProjectsBySectionAndSubject = (section, subject) => {
    return projects.filter(p => 
      (section === '' || p.section === section) &&
      (subject === '' || p.subject === subject)
    )
  }

  // Group operations
  const createGroup = (projectId, memberIds) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return null

    const newGroup = {
      id: `g${Date.now()}`,
      projectId,
      members: memberIds,
      leaderId: memberIds[0],
      status: 'Working',
      submissionFile: null,
      marks: null,
      progress: 0
    }
    setGroups(prev => [...prev, newGroup])
    addNotification('Group formed successfully!')
    return newGroup
  }
  const autoCreateGroupsForProject = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return []

    const groupSize = Number(project.groupSize) || 3

    // Get all registered students from localStorage
// Get all registered students from localStorage
const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
const eligible = allUsers
  .filter(u => u.role === 'student')
  // Student is eligible if any enrollment matches project.subject + project.section
  .filter(u =>
    (u.enrollments || []).some(
      e => e.subject === project.subject && e.section === project.section
    )
  )
  .map(u => u.id)

    // Remove students already in a group for this project
    const alreadyGrouped = new Set(
      groups
        .filter(g => g.projectId === projectId)
        .flatMap(g => g.members)
    )
    const pool = eligible.filter(id => !alreadyGrouped.has(id))

    // Shuffle students so grouping is random
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const newGroups = []

    // Split into chunks of size = groupSize
    for (let i = 0; i < pool.length; i += groupSize) {
      const members = pool.slice(i, i + groupSize)

      // If last chunk is 1 student, merge into previous group
      if (members.length === 1 && newGroups.length > 0) {
        newGroups[newGroups.length - 1].members.push(members[0])
        continue
      }

      if (members.length >= 2) {
        newGroups.push({
          id: `g${Date.now()}_${i}`,
          projectId,
          members,
          leaderId: members[0],
          status: 'Working',
          submissionFile: null,
          marks: null,
          progress: 0,
        })
      }
    }

    setGroups(prev => [...prev, ...newGroups])
    addNotification(`Auto-formed ${newGroups.length} group(s).`)
    return newGroups
  }
  const getEligibleStudentsForProject = (project) => {
    if (!project) return []
    return students.filter(s =>
      (s.enrollments || []).some(
        e => e.subject === project.subject && e.section === project.section
      )
    )
  }


  const getGroupByProjectAndUser = (projectId, userId) => {
    return groups.find(g => g.projectId === projectId && g.members.includes(userId))
  }

  const getGroupsByProject = (projectId) => {
    return groups.filter(g => g.projectId === projectId)
  }

  // Task operations
  const addTask = (groupId, taskData) => {
    const newTask = {
      ...taskData,
      id: `t${Date.now()}`,
      groupId,
      status: 'Pending'
    }
    setTasks(prev => [...prev, newTask])
    return newTask
  }

  const updateTaskStatus = (taskId, status) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status } : t
    ))
  }

  const getTasksByGroup = (groupId) => {
    return tasks.filter(t => t.groupId === groupId)
  }

  // File operations
  const submitProject = (groupId, file) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, status: 'Submitted', submissionFile: file.name } : g
    ))
    addNotification('Project submitted successfully!')
  }

  const deleteSubmission = (groupId) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, status: 'Working', submissionFile: null, marks: null } : g
    ))
    addNotification('Submission deleted successfully!')
  }

  const assignMarks = (groupId, marks) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, marks } : g
    ))
    addNotification('Marks assigned successfully!')
  }

  // Notification operations
  const addNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString()
    }
    setNotifications(prev => [notification, ...prev].slice(0, 5))
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // Get students by section
  const getStudentsBySection = (section) => {
    return students.filter(s => s.section === section)
  }

  // Get all unique sections and subjects
  const getSections = () => [...new Set(students.map(s => s.section))]
  const getSubjects = () => [...new Set(projects.map(p => p.subject))]

  const value = {
    projects,
    groups,
    tasks,
    students,
    notifications,
    createProject,
    deleteProject,
    autoCreateGroupsForProject,
    getProjectsBySectionAndSubject,
    createGroup,
    getGroupByProjectAndUser,
    getGroupsByProject,
    addTask,
    updateTaskStatus,
    getTasksByGroup,
    submitProject,
    deleteSubmission,
    assignMarks,
    getStudentsBySection,
    getSections,
    getSubjects,
    addNotification,
    clearNotifications,
    getEligibleStudentsForProject,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
