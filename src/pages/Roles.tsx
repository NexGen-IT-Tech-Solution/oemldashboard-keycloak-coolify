import { useEffect, useState } from 'react'
import { Shield, Plus, X, Check, Users } from 'lucide-react'
import { fetchSupabaseUsers, createSupabaseUser, updateSupabaseUser, getCurrentSupabaseUser, UserProfile } from '@/lib/supabase/authService'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

const ROLES: Role[] = [
  { id: 'superadministrator', name: 'Super Administrator', description: 'Complete 100% access to all features and configurations', permissions: ['dashboard', 'users', 'roles', 'settings', 'create_user', 'modify_user', 'delete_user', 'manage_all_users'] },
  { id: 'administrator', name: 'Administrator', description: 'Dashboard access, create/modify users, no SuperAdmin access', permissions: ['dashboard', 'users', 'settings', 'create_user', 'modify_user'] },
  { id: 'internal', name: 'Internal User', description: 'Dashboard Overview with portal access', permissions: ['dashboard', 'portals'] },
  { id: 'external', name: 'External User', description: 'Limited dashboard access', permissions: ['dashboard', 'portals'] },
]

export default function Roles() {
  const [currentRole, setCurrentRole] = useState<string>('internal')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'internal', password: '' })
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseUser = await getCurrentSupabaseUser()
        if (supabaseUser) {
          setCurrentRole(supabaseUser.role)
        }

        const fetchedUsers = await fetchSupabaseUsers()
        setUsers(fetchedUsers)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const updateUserRole = async (userId: string, newRole: string) => {
    const result = await updateSupabaseUser(userId, { role: newRole })
    if (result.success) {
      const refreshedUsers = await fetchSupabaseUsers()
      setUsers(refreshedUsers)
    }
    setEditingUser(null)
  }

  const createUser = async () => {
    setError('')
    setCreating(true)

    const result = await createSupabaseUser(
      newUser.email,
      newUser.password,
      newUser.full_name,
      newUser.role
    )

    if (result.success) {
      const refreshedUsers = await fetchSupabaseUsers()
      setUsers(refreshedUsers)
      setShowCreateModal(false)
      setNewUser({ email: '', full_name: '', role: 'internal', password: '' })
    } else {
      setError(result.error || 'Failed to create user')
    }

    setCreating(false)
  }

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      superadministrator: 'bg-red-500/10 text-red-400 border-red-500/20',
      administrator: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      internal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      external: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }
    return colors[role] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
  }

  const getRoleName = (role: string) => {
    const names: { [key: string]: string } = { superadministrator: 'Super Admin', administrator: 'Admin', internal: 'Internal', external: 'External' }
    return names[role] || role
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" /></div>
  }

  const canManageRoles = currentRole === 'superadministrator' || currentRole === 'administrator'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage user roles and access permissions</p>
        </div>
        {canManageRoles && (
          <button onClick={() => setShowCreateModal(true)} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Create User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const userCount = users.filter((u) => u.role === role.id).length
          return (
            <div key={role.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${getRoleColor(role.id)}`}><Shield className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-semibold text-white">{role.name}</h3>
                  <p className="text-xs text-neutral-500">{userCount} user{userCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mb-4">{role.description}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((perm) => (<span key={perm} className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400 capitalize">{perm.replace('_', ' ')}</span>))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5" /> User Roles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800 uppercase text-xs">
              <tr><th className="px-6 py-4 font-medium">User</th><th className="px-6 py-4 font-medium">Role</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-emerald-400 font-bold border border-neutral-700">{user.full_name.charAt(0).toUpperCase()}</div>
                      <div><div className="font-medium text-neutral-200">{user.full_name}</div><div className="text-neutral-500 text-xs">{user.email}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {canManageRoles && editingUser === user.id ? (
                      <select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value)} onBlur={() => setEditingUser(null)} autoFocus className="bg-neutral-800 border border-neutral-600 text-neutral-100 text-xs rounded px-2 py-1 outline-none">
                        {ROLES.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                      </select>
                    ) : (
                      <button onClick={() => canManageRoles && setEditingUser(user.id)} className={`px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer hover:opacity-80 ${getRoleColor(user.role)}`}>{getRoleName(user.role)}</button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : user.status === 'paused' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManageRoles && (
                      <button onClick={() => setEditingUser(editingUser === user.id ? null : user.id)} className="text-emerald-400 hover:text-emerald-300 font-medium text-xs bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded-lg transition-colors">
                        {editingUser === user.id ? 'Done' : 'Manage'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {error && (<div className="bg-red-950/50 border border-red-900/50 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>)}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-300 block mb-1.5">Full Name</label>
                <input type="text" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Enter full name" />
              </div>
              <div>
                <label className="text-sm text-neutral-300 block mb-1.5">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Enter email" />
              </div>
              <div>
                <label className="text-sm text-neutral-300 block mb-1.5">Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Enter password" />
              </div>
              <div>
                <label className="text-sm text-neutral-300 block mb-1.5">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50">
                  {ROLES.filter((r) => r.id !== 'superadministrator').map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
              <button onClick={createUser} disabled={!newUser.email || !newUser.password || !newUser.full_name || creating} className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
