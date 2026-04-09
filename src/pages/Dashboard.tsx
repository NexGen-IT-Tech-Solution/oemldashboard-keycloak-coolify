import { useEffect, useState } from 'react'
import { Clock, ExternalLink, Info } from 'lucide-react'
import { getUser, KeycloakUser } from '@/lib/keycloak/authService'
import oemlLogo from '@/assets/logos/OEML.png'
import opvtLogo from '@/assets/logos/OPVT.png'
import asalLogo from '@/assets/logos/ASAL.png'
import pipesizeLogo from '@/assets/logos/pipesize.png'
import nexgenLogo from '@/assets/logos/metabase.png'

interface TimeZone {
  name: string
  offset: number
}

interface Portal {
  id: string
  name: string
  url: string
}

const logoMap: { [key: string]: string } = {
  'oeml': oemlLogo,
  'opvt': opvtLogo,
  'asal': asalLogo,
  'pipesize': pipesizeLogo,
  'nexgenbi': nexgenLogo,
}

const defaultPortals: Portal[] = [
  { id: 'oeml', name: 'OEML', url: 'https://nexerp.oeml.ae' },
  { id: 'opvt', name: 'OPVT', url: 'https://nexerp.opvt.ae' },
  { id: 'asal', name: 'ASAL', url: 'https://nexerp.alasayel.om' },
  { id: 'pipesize', name: 'Pipe Size', url: 'https://oemldxb-my.sharepoint.com/:b:/g/personal/itsupport_oeml_ae/IQBtVVNoDk7BSYdG63oTHEabAUJ4OoNQmsRBJ1a5TD0mLsc?e=eihZlK' },
  { id: 'nexgenbi', name: 'NexGen BI', url: 'https://nexgen-bi.nexgenitech.link/' },
]

const timeZones: TimeZone[] = [
  { name: 'UAE (Dubai)', offset: 4 },
  { name: 'UAE (Abu Dhabi)', offset: 4 },
  { name: 'Oman (Muscat)', offset: 4 },
]

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<KeycloakUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [clocks, setClocks] = useState<{ [key: string]: { time: string; date: string } }>({})

  useEffect(() => {
    const updateClocks = () => {
      const newClocks: { [key: string]: { time: string; date: string } } = {}
      const now = new Date()
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      timeZones.forEach((tz, idx) => {
        const localTime = new Date(utc + 3600000 * tz.offset)
        newClocks[idx] = {
          time: localTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
          date: localTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        }
      })
      setClocks(newClocks)
    }
    updateClocks()
    const interval = setInterval(updateClocks, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser()
        setCurrentUser(userData)
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" /></div>
  }

  const roleName = currentUser?.role 
    ? currentUser.role.replace(/([A-Z])/g, ' ').trim()
    : 'User'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-neutral-400 text-sm mt-1">Welcome back, {currentUser?.fullName || currentUser?.email?.split('@')[0] || 'User'}!</p>
        <p className="text-neutral-500 text-xs mt-1">Role: <span className="text-emerald-400 capitalize">{roleName}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timeZones.map((tz, idx) => (
          <div key={idx} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-neutral-300">{tz.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-400/10">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{clocks[idx]?.time || '--:--:--'}</p>
                <p className="text-neutral-500 text-xs">{clocks[idx]?.date || ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {defaultPortals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {defaultPortals.map((portal) => (
            <a key={portal.id} href={portal.url} target="_blank" rel="noopener noreferrer" className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg flex items-center justify-between hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center p-2 overflow-hidden">
                  <img src={logoMap[portal.id]} alt={portal.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{portal.name}</p>
                  <p className="text-neutral-400 text-sm">Click to open portal</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10"><ExternalLink className="w-6 h-6 text-emerald-400" /></div>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-neutral-800 mb-4">
            <Info className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Portals Available</h3>
          <p className="text-neutral-400 text-sm">There are no portals available at the moment.</p>
        </div>
      )}
    </div>
  )
}
