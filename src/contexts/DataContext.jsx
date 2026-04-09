import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as dataApi from '../api/dataApi'

const DataContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
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

  const normalizeGroup = (group) => {
    if (!group) return group
    const normalizedMembers = Array.isArray(group.members)
      ? group.members
      : (Array.isArray(group.memberIds) ? group.memberIds : [])

    const rawStatus = typeof group.status === 'string' ? group.status : 'Working'
    const normalizedStatus = rawStatus === rawStatus.toUpperCase()
      ? rawStatus.charAt(0) + rawStatus.slice(1).toLowerCase()
      : rawStatus

    return {
      ...group,
      members: normalizedMembers,
      status: normalizedStatus,
    }
  }

  useEffect(() => {
    const loadLocalStudents = () => {
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
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
    }

    const initMockData = () => {
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
        submissionFile: { name: 'project_submission_g2.zip' },
        marks: null,
        progress: 100
      }
      ])

      setTasks([
      { id: 't1', groupId: 'g1', title: 'Design Database Schema', assignedTo: 's2', status: 'Completed', createdBy: 's1' },
      { id: 't2', groupId: 'g1', title: 'Create React Components', assignedTo: 's3', status: 'In Progress', createdBy: 's1' },
      { id: 't3', groupId: 'g1', title: 'Implement Authentication', assignedTo: 's4', status: 'Pending', createdBy: 's1' },
      { id: 't4', groupId: 'g1', title: 'Write Documentation', assignedTo: 's1', status: 'Pending', createdBy: 's1' },
      { id: 't5', groupId: 'g2', title: 'Database Design', assignedTo: 's6', status: 'Completed', createdBy: 's1' },
      { id: 't6', groupId: 'g2', title: 'API Development', assignedTo: 's8', status: 'Completed', createdBy: 's1' },
      ])
    }

    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    const safeLoad = async (fn, fallback) => {
      try {
        const result = await fn()
        return result ?? fallback
      } catch {
        return fallback
      }
    }

    const loadRemoteData = async () => {
      const [remoteProjects, remoteGroups, remoteTasks, remoteStudents] = await Promise.all([
        safeLoad(dataApi.listProjects, []),
        safeLoad(dataApi.listGroups, []),
        safeLoad(dataApi.listTasks, []),
        safeLoad(dataApi.listStudents, []),
      ])
      setProjects(remoteProjects)
      setGroups((remoteGroups || []).map(normalizeGroup))
      setTasks(remoteTasks)
      if (Array.isArray(remoteStudents) && remoteStudents.length > 0) {
        setStudents(remoteStudents)
      }
    }

    loadLocalStudents()

    if (!apiEnabled) {
      initMockData()
      return
    }

    loadRemoteData().catch(() => {
      initMockData()
      addNotification('Backend not reachable, using mock data.')
    })
  }, [])

  // Project operations
  const createProject = (projectData) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (!apiEnabled) {
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

    ;(async () => {
      try {
        const created = await dataApi.createProject({
          ...projectData,
          createdBy: user?.id,
        })
        setProjects(prev => [...prev, created])
        addNotification('Project created successfully!')
      } catch (e) {
        addNotification(`Failed to create project: ${e?.message || 'Unknown error'}`)
      }
    })()
  }
  const deleteProject = (projectId) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    const removeProjectLocally = () => {
      setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)))

      const groupsToRemove = groups
        .filter(g => String(g.projectId) === String(projectId))
        .map(g => String(g.id))

      setGroups(prev => prev.filter(g => String(g.projectId) !== String(projectId)))

      if (groupsToRemove.length > 0) {
        setTasks(prev => prev.filter(t => !groupsToRemove.includes(String(t.groupId))))
      }
    }

    const isNumericId = (value) => /^\d+$/.test(String(value))

    if (apiEnabled) {
      if (!isNumericId(projectId)) {
        alert('Cannot delete: project is not synced to the backend.')
        addNotification('Cannot delete: project is not synced to the backend.')
        return
      }

      ;(async () => {
        try {
          await dataApi.deleteProject(projectId)
          removeProjectLocally()
          addNotification('Project deleted successfully!')
        } catch (e) {
          console.error("Delete failed:", e)
          const message = e?.message || 'Unknown error'
          alert(`Backend delete failed: ${message}`)
          addNotification(`Backend delete failed: ${message}`)
        }
      })()
      return
    }

    // Mock/local mode (or mock IDs while API is enabled)
    removeProjectLocally()
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
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'
    const project = projects.find(p => p.id === projectId)
    if (!project) return null

    if (apiEnabled) {
      const membersNum = (memberIds || []).map(Number).filter(Number.isFinite)
      if (membersNum.length !== (memberIds || []).length) {
        alert('Some selected students are not synced with the backend yet.')
        return null
      }

      ;(async () => {
        try {
          const created = await dataApi.createGroup({
            projectId: Number(projectId),
            members: membersNum,
            leaderId: membersNum[0],
            status: 'WORKING',
            marks: null,
            progress: 0,
          })
          setGroups(prev => [...prev, normalizeGroup(created)])
          addNotification('Group created successfully!')
        } catch (e) {
          addNotification(`Failed to create group: ${e?.message || 'Unknown error'}`)
        }
      })()
      return null
    }

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
    return groups.find(g =>
      String(g.projectId) === String(projectId) &&
      (g.members || []).map(String).includes(String(userId))
    )
  }

  const getGroupsByProject = (projectId) => {
    return groups.filter(g => String(g.projectId) === String(projectId))
  }

  // Task operations
  const addTask = (groupId, taskData) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (apiEnabled) {
      ;(async () => {
        try {
          const created = await dataApi.createTask(groupId, {
            ...taskData,
            assignedTo: taskData?.assignedTo != null ? Number(taskData.assignedTo) : null,
            createdBy: taskData?.createdBy != null ? Number(taskData.createdBy) : null,
          })
          setTasks(prev => [...prev, created])
        } catch (e) {
          addNotification(`Failed to add task: ${e?.message || 'Unknown error'}`)
        }
      })()
      return null
    }

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
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (apiEnabled) {
      ;(async () => {
        try {
          const updated = await dataApi.updateTaskStatus(taskId, status)
          setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)))
        } catch (e) {
          addNotification(`Failed to update task: ${e?.message || 'Unknown error'}`)
        }
      })()
      return
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status } : t
    ))
  }

  const getTasksByGroup = (groupId) => {
    return tasks.filter(t => String(t.groupId) === String(groupId))
  }

  // File operations
  const submitProject = (groupId, file) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (apiEnabled) {
      ;(async () => {
        try {
          const updated = await dataApi.submitGroupSubmission(groupId, file)
          setGroups(prev => prev.map(g => (g.id === groupId ? normalizeGroup(updated) : g)))
          addNotification('Project submitted successfully!')
        } catch (e) {
          addNotification(`Failed to submit project: ${e?.message || 'Unknown error'}`)
        }
      })()
      return
    }

    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, status: 'Submitted', submissionFile: file.name } : g
    ))
    addNotification('Project submitted successfully!')
  }

  const deleteSubmission = (groupId) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (apiEnabled) {
      ;(async () => {
        try {
          const updated = await dataApi.deleteGroupSubmission(groupId)
          setGroups(prev => prev.map(g => (g.id === groupId ? normalizeGroup(updated) : g)))
          addNotification('Submission deleted successfully!')
        } catch (e) {
          addNotification(`Failed to delete submission: ${e?.message || 'Unknown error'}`)
        }
      })()
      return
    }

    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, status: 'Working', submissionFile: null, marks: null } : g
    ))
    addNotification('Submission deleted successfully!')
  }

  const assignMarks = (groupId, marks) => {
    const apiEnabled = (import.meta.env.VITE_API_ENABLED || 'false') === 'true'

    if (apiEnabled) {
      ;(async () => {
        try {
          const updated = await dataApi.assignMarks(groupId, marks)
          setGroups(prev => prev.map(g => (g.id === groupId ? normalizeGroup(updated || { ...g, marks }) : g)))
          addNotification('Marks assigned successfully!')
        } catch (e) {
          addNotification(`Failed to assign marks: ${e?.message || 'Unknown error'}`)
        }
      })()
      return
    }

    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, marks } : g
    ))
    addNotification('Marks assigned successfully!')
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
