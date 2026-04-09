import Keycloak from 'keycloak-js'

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak-coolify.nexgenitech.co.in'
const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'oemldashboard'
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'oemldashboard'

const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: realm,
  clientId: clientId,
})

export default keycloak
