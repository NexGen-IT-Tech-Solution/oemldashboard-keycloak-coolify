import keycloak from './client'

export interface KeycloakUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  enabled: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: KeycloakUser | null
  token: string | null
}

let cachedUser: KeycloakUser | null = null

export const initializeAuth = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      checkLoginIframe: true,
      checkLoginIframeInterval: 30,
    })
    return authenticated
  } catch (error) {
    console.error('Keycloak initialization failed:', error)
    return false
  }
}

export const login = (email?: string) => {
  if (email) {
    window.location.href = `${keycloak.createLoginUrl({ loginHint: email })}`
  } else {
    keycloak.login()
  }
}

export const logout = (redirectUri?: string) => {
  const redirect = redirectUri || window.location.origin + '/login'
  keycloak.logout({ redirectUri: redirect })
}

export const getUser = async (): Promise<KeycloakUser | null> => {
  if (cachedUser && keycloak.authenticated) {
    return cachedUser
  }

  if (!keycloak.authenticated) {
    return null
  }

  try {
    const profile = await keycloak.loadUserProfile()

    cachedUser = {
      id: keycloak.subject || (profile as { id?: string }).id || '',
      email: profile.email || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      fullName: profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile.username || profile.email?.split('@')[0] || 'User',
      role: getUserRole(),
      enabled: true,
    }

    return cachedUser
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

export const getUserRole = (): string => {
  const tokenParsed = keycloak.tokenParsed
  if (!tokenParsed) return 'internal'

  const realmAccess = tokenParsed.realm_access as { roles?: string[] } | undefined
  if (realmAccess?.roles) {
    if (realmAccess.roles.includes('superadministrator')) return 'superadministrator'
    if (realmAccess.roles.includes('administrator')) return 'administrator'
    if (realmAccess.roles.includes('internal')) return 'internal'
    if (realmAccess.roles.includes('external')) return 'external'
  }

  const resourceAccess = tokenParsed.resource_access as Record<string, { roles?: string[] }> | undefined
  const clientRoles = resourceAccess?.['oemldashboard']?.roles
  if (clientRoles) {
    if (clientRoles.includes('superadministrator')) return 'superadministrator'
    if (clientRoles.includes('administrator')) return 'administrator'
    if (clientRoles.includes('internal')) return 'internal'
    if (clientRoles.includes('external')) return 'external'
  }

  return 'internal'
}

export const getToken = (): string | null => {
  return keycloak.token ?? null
}

export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false
}

export const refreshToken = async (): Promise<boolean> => {
  try {
    return await keycloak.updateToken(300)
  } catch {
    return false
  }
}

export const clearCachedUser = () => {
  cachedUser = null
}
