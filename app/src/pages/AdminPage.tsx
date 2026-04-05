import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'

interface Registration {
  id: string
  parentName: string
  childName: string
  childAge: string
  phone: string
  email: string
  consent: boolean
  createdAt: string
  checkedIn?: boolean
  checkedInAt?: string // Время прихода
}

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('admin_auth') === 'true')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState(false)
  
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)

  useEffect(() => {
    loadRegistrations()
    const interval = setInterval(loadRegistrations, 3000)
    return () => clearInterval(interval)
  }, [])

  function loadRegistrations() {
    const data: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]')
    setRegistrations(data)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === 'akbar123') {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
    } else {
      setAuthError(true)
      setPasswordInput('')
    }
  }

  function toggleCheckIn(id: string) {
    const now = new Date().toISOString()
    const updated = registrations.map(r => {
      if (r.id === id) {
        const nextState = !r.checkedIn
        return { 
          ...r, 
          checkedIn: nextState,
          checkedInAt: nextState ? now : undefined 
        }
      }
      return r
    })
    localStorage.setItem('registrations', JSON.stringify(updated))
    setRegistrations(updated)
    if (selectedReg?.id === id) {
      setSelectedReg(prev => prev ? { ...prev, checkedIn: !prev.checkedIn, checkedInAt: !prev.checkedIn ? now : undefined } : null)
    }
  }

  function deleteRegistration(id: string) {
    if (!window.confirm('Удалить эту регистрацию?')) return
    const updated = registrations.filter(r => r.id !== id)
    localStorage.setItem('registrations', JSON.stringify(updated))
    setRegistrations(updated)
    if (selectedReg?.id === id) setSelectedReg(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 border-4 border-yellow-400 shadow-[20px_20px_0px_rgba(250,204,21,0.2)]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Вход в админку</h1>
            <p className="text-gray-400 font-bold mt-2">Введите пароль доступа</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                placeholder="ПАРОЛЬ"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setAuthError(false) }}
                className={`w-full px-6 py-4 rounded-2xl border-4 ${authError ? 'border-red-500 bg-red-50' : 'border-black'} focus:shadow-[0_0_20px_rgba(250,204,21,0.5)] outline-none transition-all text-center font-black text-xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-gray-300`}
                autoFocus
              />
              {authError && <p className="text-red-500 font-black text-xs uppercase mt-3 text-center animate-bounce">❌ Неверный пароль!</p>}
            </div>
            
            <button type="submit" className="w-full py-5 bg-black text-yellow-400 font-black rounded-2xl uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
              Войти в систему
            </button>
            <a href="/" className="block text-center text-gray-400 font-bold text-sm hover:text-black transition-colors pt-2">
              ← На главную
            </a>
          </form>
        </div>
      </div>
    )
  }

  function exportCSV() {
    const headers = ['ФИО родителя', 'Имя ребёнка', 'Возраст', 'Телефон', 'Email', 'Дата регистрации', 'Статус', 'Время прихода']
    const rows = filtered.map(r => [
      r.parentName, r.childName, r.childAge, r.phone, r.email,
      new Date(r.createdAt).toLocaleString('ru-RU'),
      r.checkedIn ? 'ПРИШЁЛ' : 'ОЖИДАЕТСЯ',
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString('ru-RU') : '-'
    ])
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = registrations
    .filter(r =>
      r.parentName.toLowerCase().includes(search.toLowerCase()) ||
      r.childName.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return a.parentName.localeCompare(b.parentName, 'ru')
    })

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.jpg" alt="KIBERone" className="w-9 h-9 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-sm text-gray-900">KIBERone</span>
                <span className="text-xs text-gray-400 block leading-none">Панель заявок</span>
              </div>
            </a>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="px-2.5 sm:px-4 py-2 bg-yellow-400 text-black text-[11px] sm:text-sm font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center gap-1.5 sm:gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              <span>QR-сканер</span>
            </button>
            <a href="/" className="px-2.5 sm:px-4 py-2 bg-gray-100 text-gray-600 text-[11px] sm:text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center">
              ← На сайт
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Всего заявок</p>
            <p className="text-4xl font-black text-gray-900">{registrations.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Сегодня</p>
            <p className="text-4xl font-black text-blue-600">
              {registrations.filter(r => {
                const d = new Date(r.createdAt)
                const now = new Date()
                return d.toDateString() === now.toDateString()
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Найдено</p>
            <p className="text-4xl font-black text-emerald-600">{filtered.length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по имени, телефону или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'name')}
                className="px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="date">По дате</option>
                <option value="name">По имени</option>
              </select>
              <button
                onClick={exportCSV}
                disabled={filtered.length === 0}
                className="px-5 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                📥 Экспорт CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              {search ? 'Ничего не найдено' : 'Заявок пока нет'}
            </h3>
            <p className="text-gray-300">
              {search ? 'Попробуйте изменить параметры поиска' : 'Они появятся здесь после регистрации на сайте'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Родитель</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ребёнок</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Телефон</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Дата</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedReg(reg)}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{reg.parentName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 text-sm">{reg.childName}, {reg.childAge} лет</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit ${reg.checkedIn ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                            {reg.checkedIn ? 'Пришёл' : 'Ожидается'}
                          </span>
                          {reg.checkedInAt && (
                            <span className="text-[10px] text-gray-400 mt-1 font-bold">
                              🕒 {new Date(reg.checkedInAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 text-sm font-mono">{reg.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-400 text-sm">{new Date(reg.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRegistration(reg.id) }}
                          className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((reg) => (
                <div key={reg.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm" onClick={() => setSelectedReg(reg)}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-900">{reg.parentName}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRegistration(reg.id) }}
                      className="text-xs text-red-500 font-semibold hover:bg-red-50 px-2 py-1 rounded-lg"
                    >
                      Удалить
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">👧 {reg.childName}, {reg.childAge} лет</p>
                    <p className="text-gray-600">📱 {reg.phone}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <p className="text-gray-400 text-xs">
                        {new Date(reg.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                      {reg.checkedIn && (
                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 uppercase">
                          ✅ Пришёл {reg.checkedInAt && new Date(reg.checkedInAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedReg(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Детали заявки</h3>
              <button onClick={() => setSelectedReg(null)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <Field label="ФИО родителя" value={selectedReg.parentName} />
              <Field label="Имя ребёнка" value={selectedReg.childName} />
              <Field label="Возраст ребёнка" value={`${selectedReg.childAge} лет`} />
              <Field label="Телефон" value={selectedReg.phone} />
              <Field label="Статус" value={selectedReg.checkedIn ? '✅ Пришёл' : '⌛ Ожидается'} />
              <Field label="Дата регистрации" value={new Date(selectedReg.createdAt).toLocaleString('ru-RU')} />
            </div>
            <div className="flex flex-col gap-3 mt-8">
              {!selectedReg.checkedIn && (
                <button
                  onClick={() => { toggleCheckIn(selectedReg.id) }}
                  className="w-full py-4 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition-all shadow-[0_4px_14px_rgba(34,197,94,0.39)]"
                >
                  Отметить прибытие
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { deleteRegistration(selectedReg.id); setSelectedReg(null) }}
                  className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  Удалить
                </button>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6 text-white text-center">
              <div>
                <h3 className="text-xl font-black">Сканер билетов</h3>
                <p className="text-gray-400 text-sm">Наведите камеру на QR-код</p>
              </div>
              <button onClick={() => setShowScanner(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="relative rounded-3xl overflow-hidden border-4 border-yellow-400 aspect-square mb-6 bg-black">
              <Scanner
                onScan={(result) => {
                  try {
                    const rawValue = result[0].rawValue
                    let ticketId = ''

                    // Try parsing as JSON (for old tickets)
                    try {
                      const data = JSON.parse(rawValue)
                      ticketId = data.id
                    } catch (e) {
                      // If not JSON, check if it's our URL format
                      if (rawValue.includes('ticket=')) {
                        const url = new URL(rawValue)
                        ticketId = url.searchParams.get('ticket') || ''
                      } else {
                        ticketId = rawValue // Maybe just the ID was encoded
                      }
                    }

                    const found = registrations.find(r => r.id === ticketId)
                    if (found) {
                      setSelectedReg(found)
                      setShowScanner(false)
                      setScanResult(null)
                    } else {
                      setScanResult(`Билет ${ticketId} не найден`)
                    }
                  } catch(e) {
                    setScanResult('Ошибка при чтении кода')
                  }
                }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
              {/* Scan HUD */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-yellow-400 animate-pulse"></div>
            </div>

            {scanResult && (
              <p className="text-red-400 text-center font-bold mb-4">{scanResult}</p>
            )}

            <button
               onClick={() => setShowScanner(false)}
               className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  )
}
