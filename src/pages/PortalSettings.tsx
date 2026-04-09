import { useState, useEffect } from 'react'
import { Globe, Edit3, Save, Upload, Image } from 'lucide-react'

interface Portal {
  id: string
  name: string
  url: string
  logoUrl: string
}

const defaultPortals: Portal[] = [
  { id: '1', name: 'OEML', url: 'https://nexerp.oeml.ae', logoUrl: '' },
  { id: '2', name: 'OPVT', url: 'https://nexerp.opvt.ae', logoUrl: '' },
  { id: '3', name: 'ASAL', url: 'https://nexerp.alasayel.om', logoUrl: '' },
  { id: '6', name: 'Test Server', url: 'https://oemltd.u.frappe.cloud/app', logoUrl: '' },
]

export default function PortalSettings() {
  const [portals, setPortals] = useState<Portal[]>(defaultPortals)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Portal | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadedLogos, setUploadedLogos] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const savedPortals = localStorage.getItem('portalConfig')
    if (savedPortals) {
      setPortals(JSON.parse(savedPortals))
    }
    const savedLogos = localStorage.getItem('portalLogos')
    if (savedLogos) {
      setUploadedLogos(JSON.parse(savedLogos))
    }
  }, [])

  const handleEdit = (portal: Portal) => {
    setEditingId(portal.id)
    setEditForm({ ...portal })
    setSaved(false)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleChange = (field: keyof Portal, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value })
    }
  }

  const handleLogoUpload = (portalId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const logoDataUrl = event.target?.result as string
        setUploadedLogos((prev) => {
          const updated = { ...prev, [portalId]: logoDataUrl }
          localStorage.setItem('portalLogos', JSON.stringify(updated))
          return updated
        })
        if (editForm && editForm.id === portalId) {
          setEditForm({ ...editForm, logoUrl: logoDataUrl })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (editForm) {
      setSaving(true)
      setTimeout(() => {
        setPortals((prev) =>
          prev.map((p) => (p.id === editForm.id ? editForm : p))
        )
        localStorage.setItem('portalConfig', JSON.stringify(
          portals.map((p) => (p.id === editForm.id ? editForm : p))
        ))
        setEditingId(null)
        setEditForm(null)
        setSaving(false)
        setSaved(true)
      }, 500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Existing Portal Redirect</h1>
        <p className="text-neutral-400 text-sm mt-1">Edit and update portal redirect links and logos</p>
      </div>

      <div className="grid gap-4">
        {portals.map((portal) => (
          <div
            key={portal.id}
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6"
          >
            {editingId === portal.id && editForm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-600">
                    {editForm.logoUrl || uploadedLogos[portal.id] ? (
                      <img
                        src={editForm.logoUrl || uploadedLogos[portal.id]}
                        alt={portal.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image className="w-8 h-8 text-neutral-500" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(portal.id, e)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1">Portal Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-neutral-400 text-xs mb-1">Redirection Link</label>
                    <input
                      type="url"
                      value={editForm.url}
                      onChange={(e) => handleChange('url', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {uploadedLogos[portal.id] ? (
                      <img
                        src={uploadedLogos[portal.id]}
                        alt={portal.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Globe className="w-7 h-7 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{portal.name}</p>
                    <p className="text-neutral-400 text-sm">{portal.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {saved && editingId === null && (
                    <span className="text-emerald-400 text-sm">Saved!</span>
                  )}
                  <button
                    onClick={() => handleEdit(portal)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}