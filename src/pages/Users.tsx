import { useEffect, useState } from 'react'
import { Search, X, Edit3, Save, User, Mail, Shield, Activity } from 'lucide-react'
import { fetchSupabaseUsers, updateSupabaseUser, getCurrentSupabaseUser, UserProfile } from '@/lib/supabase/authService'

interface EditFormData {
  full_name: string
  role: string
  status: string
  type: string
  created_at: string
}

const ROLES = [
  { id: 'superadministrator', name: 'Super Admin' },
  { id: 'administrator', name: 'Admin' },
  { id: 'internal', name: 'Internal' },
  { id: 'external', name: 'External' },
]

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'deactivated', label: 'Deactivated' },
]

const types = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
]

export default function Users() {
  const [currentRole, setCurrentRole] = useState<string>('internal')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState<EditFormData | null>(null)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    let filtered = [...users]
    if (filterRole !== 'all') filtered = filtered.filter((u) => u.role === filterRole)
    if (filterStatus !== 'all') filtered = filtered.filter((u) => u.status === filterStatus)
    if (filterType !== 'all') filtered = filtered.filter((u) => u.type === filterType)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    setFilteredUsers(filtered)
  }, [filterStatus, filterType, filterRole, searchQuery, users])

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      superadministrator: 'bg-red-500/10 text-red-400',
      administrator: 'bg-purple-500/10 text-purple-400',
      internal: 'bg-emerald-500/10 text-emerald-400',
      external: 'bg-blue-500/10 text-blue-400',
    }
    return colors[role] || 'bg-neutral-500/10 text-neutral-400'
  }

  const getRoleName = (role: string) => {
    const names: { [key: string]: string } = {
      superadministrator: 'Super Admin',
      administrator: 'Admin',
      internal: 'Internal',
      external: 'External',
    }
    return names[role] || role
  }

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      type: user.type,
      created_at: user.created_at.split('T')[0],
    })
  }

  const handleClosePanel = () => {
    setSelectedUser(null)
    setEditForm(null)
  }

  const handleFieldChange = (field: keyof EditFormData, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value })
    }
  }

  const handleUpdate = async () => {
    if (!editForm || !selectedUser) return

    setSaving(true)

    const result = await updateSupabaseUser(selectedUser.id, {
      full_name: editForm.full_name,
      role: editForm.role,
      status: editForm.status,
      type: editForm.type,
    })

    if (result.success) {
      const refreshedUsers = await fetchSupabaseUsers()
      setUsers(refreshedUsers)
      setSelectedUser(null)
      setEditForm(null)
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" /></div>
  }

  const canEditUsers = currentRole === 'superadministrator' || currentRole === 'administrator'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users Management</h1>
        <p className="text-neutral-400 text-sm mt-1">Manage and view all users</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 outline-none">
                <option value="all">All Roles</option>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 outline-none">
                <option value="all">All Status</option>
                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 outline-none">
                <option value="all">All Type</option>
                {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {(filterStatus !== 'all' || filterType !== 'all' || filterRole !== 'all' || searchQuery) && (
                <button onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterRole('all'); setSearchQuery('') }} className="bg-neutral-800 text-neutral-300 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm">
                  <X className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-neutral-900/50 transition-colors ${selectedUser?.id === user.id ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-emerald-400 font-bold border border-neutral-700">{user.full_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium text-neutral-200">{user.full_name}</div>
                          <div className="text-neutral-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>{getRoleName(user.role)}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {canEditUsers && (
                        <button
                          onClick={() => handleSelectUser(user)}
                          className={`text-emerald-400 hover:text-emerald-300 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto ${selectedUser?.id === user.id ? 'bg-emerald-400/20' : 'bg-emerald-400/10 hover:bg-emerald-400/20'}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {selectedUser?.id === user.id ? 'Editing' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>
                )                ) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && editForm && (
          <div className="w-full lg:w-96 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Edit User</h3>
              <button onClick={handleClosePanel} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-4 py-2.5 text-neutral-400 text-sm">
                  {selectedUser.email}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <Shield className="w-3.5 h-3.5" /> Modify Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <Activity className="w-3.5 h-3.5" /> Modify Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                >
                  {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <User className="w-3.5 h-3.5" /> Modify Type
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                >
                  {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <User className="w-3.5 h-3.5" /> Modify Join Date
                </label>
                <input
                  type="date"
                  value={editForm.created_at}
                  onChange={(e) => handleFieldChange('created_at', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleClosePanel}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
