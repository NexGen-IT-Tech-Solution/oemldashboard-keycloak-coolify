const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak-coolify.nexgenitech.co.in'
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'oemldashboard'

const ADMIN_CLIENT_ID = 'admin-cli'

let adminToken: string | null = null
let tokenExpiry: number = 0

interface KeycloakUserRepresentation {
  id?: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  enabled?: boolean
  emailVerified?: boolean
  credentials?: Array<{
    type: string
    value: string
    temporary?: boolean
  }>
  groups?: string[]
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  type: string
  created_at: string
  enabled: boolean
}

const getAdminToken = async (): Promise<string | null> => {
  if (adminToken && Date.now() < tokenExpiry) {
    return adminToken
  }

  try {
    const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ADMIN_CLIENT_ID,
        client_secret: import.meta.env.VITE_KEYCLOAK_ADMIN_SECRET || '',
      }),
    })

    if (!response.ok) {
      console.error('Failed to get admin token:', response.status)
      return null
    }

    const data = await response.json()
    adminToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return adminToken
  } catch (error) {
    console.error('Error getting admin token:', error)
    return null
  }
}

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const token = await getAdminToken()
  if (!token) return []

  try {
    const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?max=1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch users:', response.status)
      return []
    }

    const users: KeycloakUserRepresentation[] = await response.json()
    
    return users.map(user => {
      const role = getUserRoleFromGroups(user.groups || [])
      return {
        id: user.id || '',
        email: user.email || user.username || '',
        full_name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username || 'User',
        role: role,
        status: user.enabled ? 'active' : 'deactivated',
        type: role === 'internal' || role === 'superadministrator' || role === 'administrator' ? 'internal' : 'external',
        created_at: new Date().toISOString(),
        enabled: user.enabled || false,
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
  const token = await getAdminToken()
  if (!token) return null

  try {
    const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) return null

    const user: KeycloakUserRepresentation = await response.json()
    
    return {
      id: user.id || '',
      email: user.email || user.username || '',
      full_name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || 'User',
      role: getUserRoleFromGroups(user.groups || []),
      status: user.enabled ? 'active' : 'deactivated',
      type: 'internal',
      created_at: new Date().toISOString(),
      enabled: user.enabled || false,
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  role: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  const token = await getAdminToken()
  if (!token) {
    return { success: false, error: 'Failed to authenticate as admin' }
  }

  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const userPayload: KeycloakUserRepresentation = {
    username: email,
    email: email,
    firstName: firstName,
    lastName: lastName,
    enabled: true,
    emailVerified: false,
    credentials: [
      {
        type: 'password',
        value: password,
        temporary: false,
      },
    ],
    groups: [role],
  }

  try {
    const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userPayload),
    })

    if (response.status === 201) {
      const locationHeader = response.headers.get('Location')
      const userId = locationHeader?.split('/').pop() || ''
      
      if (userId && role) {
        await assignRoleToUser(userId, role, token)
      }

      return { success: true, userId }
    } else if (response.status === 409) {
      return { success: false, error: 'User with this email already exists' }
    } else {
      const errorData = await response.json()
      return { success: false, error: errorData.errorMessage || 'Failed to create user' }
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Network error while creating user' }
  }
}

export const updateUser = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'status' | 'type'>>
): Promise<{ success: boolean; error?: string }> => {
  const token = await getAdminToken()
  if (!token) {
    return { success: false, error: 'Failed to authenticate as admin' }
  }

  try {
    const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      return { success: false, error: 'User not found' }
    }

    const existingUser: KeycloakUserRepresentation = await userResponse.json()

    if (updates.full_name) {
      const nameParts = updates.full_name.trim().split(/\s+/)
      existingUser.firstName = nameParts[0] || ''
      existingUser.lastName = nameParts.slice(1).join(' ') || ''
    }

    if (updates.status) {
      existingUser.enabled = updates.status === 'active'
    }

    const updateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(existingUser),
    })

    if (!updateResponse.ok) {
      return { success: false, error: 'Failed to update user' }
    }

    if (updates.role) {
      await assignRoleToUser(userId, updates.role, token)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: 'Network error while updating user' }
  }
}

export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  const token = await getAdminToken()
  if (!token) {
    return { success: false, error: 'Failed to authenticate as admin' }
  }

  try {
    const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 204) {
      return { success: true }
    } else {
      return { success: false, error: 'Failed to delete user' }
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Network error while deleting user' }
  }
}

const assignRoleToUser = async (userId: string, role: string, token: string): Promise<void> => {
  const availableRolesResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!availableRolesResponse.ok) return

  const availableRoles = await availableRolesResponse.json()
  const targetRole = availableRoles.find((r: { name: string }) => r.name === role)

  if (!targetRole) return

  await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([targetRole]),
  })
}

const getUserRoleFromGroups = (groups: string[]): string => {
  if (groups.includes('superadministrator')) return 'superadministrator'
  if (groups.includes('administrator')) return 'administrator'
  if (groups.includes('internal')) return 'internal'
  if (groups.includes('external')) return 'external'
  return 'internal'
}
