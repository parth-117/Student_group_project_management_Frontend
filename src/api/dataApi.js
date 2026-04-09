import { apiFetch, apiDownloadBlob } from './http'

export const listProjects = () => apiFetch('/api/projects')
export const createProject = (payload) => apiFetch('/api/projects', { method: 'POST', body: payload })
export const deleteProject = (projectId) => apiFetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })

export const listGroups = () => apiFetch('/api/groups')
export const listGroupsByProject = (projectId) =>
  apiFetch(`/api/projects/${encodeURIComponent(projectId)}/groups`)

export const createGroup = (payload) => apiFetch('/api/groups', { method: 'POST', body: payload })

export const updateGroup = (groupId, payload) =>
  apiFetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: 'PUT', body: payload })

export const assignMarks = (groupId, marks) =>
  apiFetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: 'PATCH', body: { marks } })

export const listTasks = () => apiFetch('/api/tasks')

export const createTask = (groupId, payload) =>
  apiFetch(`/api/tasks/group/${encodeURIComponent(groupId)}`, { method: 'POST', body: payload })

export const updateTaskStatus = (taskId, status) =>
  apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: { status } })

export const listStudents = () => apiFetch('/api/users?role=student')

export const submitGroupSubmission = async (groupId, file) => {
  const form = new FormData()
  form.append('file', file)
  return apiFetch(`/api/groups/${encodeURIComponent(groupId)}/submission`, { method: 'POST', body: form })
}

export const deleteGroupSubmission = (groupId) =>
  apiFetch(`/api/groups/${encodeURIComponent(groupId)}/submission`, { method: 'DELETE' })

export const downloadGroupSubmission = (groupId) =>
  apiDownloadBlob(`/api/groups/${encodeURIComponent(groupId)}/submission`)
