import { useState, useEffect, useRef } from 'react'
import { HeroSection } from '../components/ui/hero'
import { SpeakersHorizontalScroll } from '../components/ui/speakers'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import emailjs from '@emailjs/browser'
import { supabase, mapToDB } from '../lib/supabase'
import type { Registration } from '../lib/supabase'

// ============== Phone Validation ==============
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  
  let formatted = '+7'
  if (digits.length > 1) formatted += ' (' + digits.slice(1, 4)
  if (digits.length > 4) formatted += ') ' + digits.slice(4, 7)
  if (digits.length > 7) formatted += '-' + digits.slice(7, 9)
  if (digits.length > 9) formatted += '-' + digits.slice(9, 11)
  
  return formatted
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('7')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ============== Intersection Observer Hook ==============
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, ...options })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

// ============== Intersection Observer Hook ==============
export default function LandingPage() {
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    childAge: '',
    phone: '+7',
    email: '',
    consent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Registration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)


  const aboutSection = useInView()
  const whySection = useInView()
  const topicsSection = useInView()
  const audienceSection = useInView()
  const formSection = useInView()

  // Recovery & Initial sync
  useEffect(() => {
    syncLocalData()
  }, [])

  async function syncLocalData() {
    const localData: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]')
    if (localData.length === 0) return

    for (const reg of localData) {
      // Check if already in DB
      const { data } = await supabase.from('registrations').select('id').eq('id', reg.id).single()
      if (!data) {
        await supabase.from('registrations').insert(mapToDB(reg))
      }
    }
  }

  function handlePhoneChange(value: string) {
    let digits = value.replace(/\D/g, '')
    if (!digits.startsWith('7')) digits = '7' + digits
    if (digits.length > 11) digits = digits.slice(0, 11)
    setFormData(prev => ({ ...prev, phone: formatPhone(digits) }))
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!formData.parentName.trim()) newErrors.parentName = 'Введите ваше имя'
    if (!formData.childName.trim()) newErrors.childName = 'Введите имя ребёнка'
    if (!formData.childAge.trim()) newErrors.childAge = 'Укажите возраст'
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Введите корректный номер телефона'
    if (!formData.email.trim()) {
      newErrors.email = 'Введите email'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Введите корректный email'
    }
    if (!formData.consent) newErrors.consent = 'Необходимо согласие на обработку данных'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const ticketRef = useRef<HTMLDivElement>(null)
  
  const downloadTicket = async () => {
    if (!ticketRef.current) return
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: '#facc15',
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`KIBERone_Ticket_${submitted?.id.slice(0, 5)}.pdf`)
    } catch (err) {
      console.error('PDF Generation Error:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    
    const generateShortId = () => {
      const chars = '0123456789'
      let result = 'KN-'
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Get true count from DB
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .filter('status', 'neq', 'waitlist')

    const ticketCount = count || 0
    const isWaitlist = ticketCount >= 100

    const newReg: Registration = {
      id: generateShortId(),
      ...formData,
      createdAt: new Date().toISOString(),
      status: isWaitlist ? 'waitlist' : 'ticket',
    }

    // Save to Supabase
    const { error: dbError } = await supabase.from('registrations').insert(mapToDB(newReg))
    
    if (dbError) {
      console.error('Database Error:', dbError)
      alert('Ошибка при сохранении. Попробуйте еще раз.')
      setIsSubmitting(false)
      return
    }
    
    // EmailJS Integration with PDF & QR Link - ONLY IF NOT WAITLIST
    if (!isWaitlist) {
      const serviceId = 'service_6p0bvbm'
      const templateId = 'template_2550xos'
      const publicKey = 'MNrC1SQScGVA_zXJ_'

      const qrValue = `https://kaliningrad.kiber-one.com/admin?ticket=${newReg.id}`
      const qrImageLink = `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=250&margin=1`

      emailjs.send(serviceId, templateId, {
        to_name: formData.parentName,
        to_email: formData.email,
        child_name: formData.childName,
        ticket_id: newReg.id,
        qr_link: qrImageLink, // Передаем ссылку на картинку для письма
      }, publicKey)
      .then((res) => {
        console.log('Email sent successfully!', res.status, res.text);
      })
      .catch((err) => {
        console.error('Email failed to send:', err);
      });
    }

    // Also save to local as backup
    const currentLocal: Registration[] = JSON.parse(localStorage.getItem('registrations') || '[]')
    localStorage.setItem('registrations', JSON.stringify([newReg, ...currentLocal]))

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(newReg)
      setFormData({ parentName: '', childName: '', childAge: '', phone: '+7', email: '', consent: false })
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF] overflow-clip">
      
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="KIBERone" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <span className="font-bold text-sm text-gray-900">KIBERone</span>
              <span className="text-xs text-gray-400 block leading-none">Калининград</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm text-gray-600 hover:text-yellow-500 transition-colors font-medium">О мероприятии</a>
            <a href="#speakers" className="text-sm text-gray-600 hover:text-yellow-500 transition-colors font-medium">Спикеры</a>
            <a href="#register" className="text-sm text-gray-600 hover:text-yellow-500 transition-colors font-medium">Регистрация</a>
          </div>
          <a href="#register" className="px-5 py-2 bg-yellow-400 text-black text-sm font-bold rounded-full hover:bg-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-400/25 active:scale-95">
            Записаться
          </a>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <HeroSection />

      {/* ============ ABOUT & WHY ATTEND ============ */}
      <section className="py-12 md:py-28 relative bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-20">
            
            {/* ======= ABOUT ======= */}
            <div id="about" ref={aboutSection.ref} className={`transition-all duration-1000 ${aboutSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-left mb-12">
                <span className="inline-block text-xs font-bold text-black bg-yellow-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-['Geist'] mb-4">О мероприятии</span>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mt-4 mb-6">
                  Мир меняется быстрее,<br /> чем школьные программы
                </h2>
                <p className="text-lg text-gray-500 max-w-xl leading-relaxed font-['Geist']">
                  Сегодня недостаточно просто «хорошо учиться». Появляются новые профессии, исчезают старые, а требования к специалистам растут.
                </p>
              </div>

              {/* Questions Stack */}
              <div className="flex flex-col gap-3 md:gap-5">
                {[
                  { q: 'Какие навыки действительно нужны ребенку?', icon: '01' },
                  { q: 'Достаточно ли школы и подготовки к экзаменам?', icon: '02' },
                  { q: 'Как помочь ребенку выбрать направление?', icon: '03' },
                ].map((item, i) => (
                  <div key={i} className="group relative bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border-2 border-black shadow-[4px_4px_0px_var(--tw-shadow-color)] shadow-yellow-400 hover:translate-y-1 hover:shadow-none transition-all duration-300 flex items-center gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-black rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-yellow-400 font-['Geist'] font-black text-base md:text-lg">{item.icon}</span>
                    </div>
                    <p className="text-black font-bold text-base md:text-lg leading-snug">{item.q}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 md:mt-10 inline-flex items-center gap-3 px-6 py-4 md:px-8 md:py-4 bg-yellow-50 rounded-2xl border-2 border-yellow-400">
                <p className="text-black font-bold text-sm md:text-lg font-['Geist']">Это мероприятие даст вам чёткие ориентиры и ответы</p>
              </div>
            </div>

            {/* ======= WHY ATTEND ======= */}
            <div ref={whySection.ref} className={`transition-all duration-1000 ${whySection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-left mb-8 md:mb-12">
                <span className="inline-block text-xs font-bold text-black bg-yellow-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-['Geist'] mb-4">Зачем приходить</span>
                <h2 className="text-2xl md:text-5xl font-black text-gray-900 mt-2 md:mt-4 mb-4 md:mb-6">
                  Почему важно прийти<br /> родителям
                </h2>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                {[
                  'Вы поймете, какие навыки действительно важны для будущего ребёнка',
                  'Разберетесь, как не потеряться между школой, экзаменами и реальной жизнью',
                  'Узнаете, как помочь ребёнку стать востребованным, а не просто «сдать ЕГЭ»',
                  'Получите практические рекомендации, которые можно применять уже сейчас',
                  'Увидите реальные примеры детей, которые уже начали свой путь в профессии',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 md:gap-4 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border-2 border-black shadow-[4px_4px_0px_#facc15] hover:translate-y-1 hover:shadow-none transition-all duration-300">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-400 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-0.5 border-2 border-black">
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-black font-bold font-['Geist'] text-sm md:text-lg">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-gray-400 font-medium text-sm italic font-['Geist']">Это не теория — это понимание, как действовать уже сегодня</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============ SPEAKERS ============ */}
      <SpeakersHorizontalScroll />

      {/* ============ TOPICS ============ */}
      <section ref={topicsSection.ref} className="py-16 md:py-28 bg-[#FAFBFF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`transition-all duration-1000 ${topicsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-10 md:mb-16">
              <span className="inline-block text-xs font-bold text-black bg-yellow-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-['Geist'] mb-4">Программа</span>
              <h2 className="text-2xl md:text-5xl font-black text-black mt-2 md:mt-4">
                О чём будем говорить
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 max-w-5xl mx-auto">
              {[
                { text: 'Почему школьного образования уже недостаточно', num: '01' },
                { text: 'Какие навыки формируют успешное будущее ребенка', num: '02' },
                { text: 'ЕГЭ и ОГЭ: как снизить тревогу и выстроить систему подготовки', num: '03' },
                { text: 'Как школьнику стать востребованным специалистом еще до выпуска', num: '04' },
                { text: 'Как развивать мышление, а не просто потребление технологий', num: '05' },
              ].map((item, i) => (
                <div key={i} className={`group bg-white rounded-[1.5rem] md:rounded-3xl p-5 md:p-7 border-2 border-black shadow-[4px_4px_0px_#facc15] hover:translate-y-1 hover:shadow-none transition-all duration-300 ${i === 3 ? 'sm:col-span-1 lg:col-span-1' : ''} ${i === 4 ? 'sm:col-span-2 lg:col-span-1 sm:max-w-none lg:max-w-none' : ''}`}>
                  <div className="flex items-center gap-3 mb-2 md:mb-4">
                    <span className="text-xs md:text-sm font-black text-yellow-500 uppercase tracking-widest font-['Geist'] bg-black px-2 py-1 rounded-lg">{item.num}</span>
                  </div>
                  <p className="text-black text-sm md:text-base font-bold leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOR WHOM ============ */}
      <section ref={audienceSection.ref} className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`transition-all duration-1000 ${audienceSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-10 md:mb-16">
              <span className="inline-block text-xs font-bold text-black bg-yellow-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-['Geist'] mb-4">Аудитория</span>
              <h2 className="text-2xl md:text-5xl font-black text-black mt-2 md:mt-4">
                Для кого это мероприятие
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 max-w-3xl mx-auto">
              {[
                { text: 'Родителей школьников 1–8 классов' },
                { text: 'Тех, кто думает о будущем ребёнка уже сейчас' },
                { text: 'Тех, кто хочет понимать, куда движется образование' },
                { text: 'Родителей, которым важно не упустить возможности' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 md:p-6 border-2 border-black shadow-[4px_4px_0px_#000] transition-all duration-300">
                  <span className="text-yellow-500 font-['Geist'] font-black text-xl md:text-2xl bg-black px-2 py-1 rounded-xl">0{i + 1}</span>
                  <p className="text-black font-bold text-sm md:text-base">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Format */}
            <div className="mt-10 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 max-w-3xl mx-auto">
              {[
                { text: 'Живое общение с экспертами' },
                { text: 'Актуальные темы без перегрузки теорией' },
                { text: 'Практические ориентиры и примеры' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col justify-center text-center bg-yellow-50 rounded-2xl p-4 md:p-6 border-2 border-black min-h-[80px] md:min-h-[120px]">
                  <p className="text-black font-bold text-xs md:text-sm font-['Geist']">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ IMPORTANT BANNER ============ */}
      <section className="py-12 md:py-16 bg-[#FAFBFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-black border-4 border-yellow-400 rounded-3xl md:rounded-[2.5rem] p-6 md:p-14 text-center text-white relative overflow-hidden shadow-[8px_8px_0px_#facc15] md:shadow-[16px_16px_0px_#facc15]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <h2 className="text-xl md:text-4xl font-black mb-4">
                Будущее ребёнка формируется уже сегодня
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
                И главный вопрос — не «кем он станет», а насколько он будет готов к изменениям мира.
              </p>
              <a href="#register" className="inline-flex items-center gap-2 mt-6 md:mt-8 px-6 py-3 md:px-8 md:py-4 bg-yellow-400 text-black font-black rounded-xl md:rounded-2xl text-base md:text-lg hover:shadow-[0_0_20px_#facc15] transition-all duration-300 hover:-translate-y-1 active:scale-95">
                Зарегистрироваться
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ REGISTRATION FORM ============ */}
      <section id="register" ref={formSection.ref} className="py-12 md:py-28 bg-white border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`transition-all duration-1000 ${formSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-8 md:mb-12">
              <span className="inline-block text-xs font-bold text-black bg-yellow-400 px-3 py-1.5 rounded-full uppercase tracking-widest font-['Geist'] mb-4">Регистрация</span>
              <h2 className="text-2xl md:text-5xl font-black text-black mt-2 md:mt-4">
                Записаться на мероприятие
              </h2>
              <p className="text-gray-500 mt-2 md:mt-3 text-sm md:text-base font-medium">Вход бесплатный, количество мест ограничено</p>
            </div>

            <div className="max-w-2xl mx-auto">
              {submitted ? (
                <div className="bg-white rounded-3xl p-6 md:p-10 border-2 border-black shadow-[8px_8px_0px_#000] text-center flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  
                  {submitted.status === 'waitlist' ? (
                    <div className="space-y-6">
                      <h3 className="text-2xl md:text-3xl font-black text-black leading-tight">Спасибо за регистрацию!</h3>
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 md:p-8 text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <p className="relative z-10 text-blue-900 font-bold text-lg md:text-xl leading-relaxed">
                          К сожалению, все места уже заняты. Мы добавили вас в список ожидания и обязательно свяжемся, если освободится место.
                        </p>
                      </div>
                      <p className="text-gray-400 font-medium max-w-sm mx-auto">
                        Мы ценим ваш интерес и постараемся найти возможность пригласить вас.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl md:text-2xl font-black text-black mb-2">Вы успешно зарегистрированы!</h3>
                      <p className="text-gray-500 font-medium text-sm md:text-base mb-8">Сделайте скриншот или сохраните этот билет.</p>
                      
                      {/* TICKET UI */}
                      <div ref={ticketRef} className="w-full max-w-sm bg-yellow-400 border-2 border-black rounded-[2rem] p-6 mb-6 relative shadow-[6px_6px_0px_#000]">
                        {/* Ticket perforations */}
                        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-r-2 border-black rounded-full"></div>
                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-l-2 border-black rounded-full"></div>
                        
                        <h4 className="text-2xl font-black text-black font-['Instrument_Serif'] italic mb-1">Родитель Навигатор</h4>
                        <p className="text-black font-bold uppercase text-xs tracking-widest border-b-2 border-black/20 pb-4 mb-4">Входной билет</p>
                        
                        <div className="bg-white p-4 rounded-2xl border-2 border-black flex justify-center mb-4 overflow-hidden">
                          <a 
                            href={`https://kaliningrad.kiber-one.com/admin?ticket=${submitted.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:scale-105 transition-transform"
                          >
                            <QRCodeSVG 
                              value={`https://kaliningrad.kiber-one.com/admin?ticket=${submitted.id}`}
                              size={160} 
                              bgColor={"#ffffff"}
                              fgColor={"#000000"}
                              level={"H"}
                            />
                          </a>
                        </div>
                        
                        <div className="text-left space-y-2">
                          <div>
                            <p className="text-xs font-bold text-black/60 uppercase">Участник</p>
                            <p className="font-bold text-lg leading-none">{submitted.parentName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 border-t-2 border-black/20 pt-2 mt-2">
                            <div>
                              <p className="text-xs font-bold text-black/60 uppercase">Дата</p>
                              <p className="font-bold">15 апреля</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-black/60 uppercase">Время</p>
                              <p className="font-bold">18:00–20:00</p>
                            </div>
                          </div>
                          <div className="border-t-2 border-black/20 pt-2 mt-2">
                            <p className="text-xs font-bold text-black/60 uppercase">Место</p>
                            <p className="font-bold text-sm leading-snug">Конференц-зал БФУ им. И. Канта, Адм. корпус №1, ул. А. Невского, 14</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={downloadTicket} 
                          className="px-6 py-3 bg-black text-yellow-400 text-sm md:text-base font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Скачать PDF
                        </button>
                      </div>
                    </>
                  )}

                  <div className="mt-8">
                    <button onClick={() => setSubmitted(null)} className="px-5 py-2 md:px-6 md:py-3 bg-gray-100 text-gray-500 text-sm md:text-base font-bold rounded-xl hover:bg-gray-200 transition-colors">
                      Записать ещё одного
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-5 md:p-10 border-2 border-black shadow-[6px_6px_0px_#facc15] md:shadow-[12px_12px_0px_#facc15] space-y-4 md:space-y-5">
                  {/* Parent Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ФИО родителя *</label>
                    <input
                      type="text"
                      placeholder="Иванов Иван Иванович"
                      value={formData.parentName}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, parentName: e.target.value }))
                        if (errors.parentName) setErrors(prev => ({ ...prev, parentName: '' }))
                      }}
                      className={`w-full px-4 py-2.5 md:px-5 md:py-3.5 rounded-xl border-2 ${errors.parentName ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-black focus:ring-4 focus:ring-yellow-400/50 outline-none transition-all text-black font-bold text-sm md:text-base placeholder:text-gray-400`}
                    />
                    {errors.parentName && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.parentName}</p>}
                  </div>

                  {/* Child Name & Age */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Имя ребёнка *</label>
                      <input
                        type="text"
                        placeholder="Мария"
                        value={formData.childName}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, childName: e.target.value }))
                          if (errors.childName) setErrors(prev => ({ ...prev, childName: '' }))
                        }}
                        className={`w-full px-4 py-2.5 md:px-5 md:py-3.5 rounded-xl border-2 ${errors.childName ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-black focus:ring-4 focus:ring-yellow-400/50 outline-none transition-all text-black font-bold text-sm md:text-base placeholder:text-gray-400`}
                      />
                      {errors.childName && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.childName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Возраст *</label>
                      <input
                        type="text"
                        placeholder="10"
                        value={formData.childAge}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setFormData(prev => ({ ...prev, childAge: v }))
                          if (errors.childAge) setErrors(prev => ({ ...prev, childAge: '' }))
                        }}
                        className={`w-full px-4 py-2.5 md:px-5 md:py-3.5 rounded-xl border-2 ${errors.childAge ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-black focus:ring-4 focus:ring-yellow-400/50 outline-none transition-all text-black font-bold text-sm md:text-base placeholder:text-gray-400`}
                      />
                      {errors.childAge && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.childAge}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Телефон *</label>
                    <input
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={formData.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      className={`w-full px-4 py-2.5 md:px-5 md:py-3.5 rounded-xl border-2 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-black focus:ring-4 focus:ring-yellow-400/50 outline-none transition-all text-black font-bold text-sm md:text-base placeholder:text-gray-400`}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="parent@email.com"
                      value={formData.email}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, email: e.target.value }))
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                      }}
                      className={`w-full px-4 py-2.5 md:px-5 md:py-3.5 rounded-xl border-2 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:border-black focus:ring-4 focus:ring-yellow-400/50 outline-none transition-all text-black font-bold text-sm md:text-base placeholder:text-gray-400`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.email}</p>}
                  </div>

                  {/* Consent */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, consent: e.target.checked }))
                          if (errors.consent) setErrors(prev => ({ ...prev, consent: '' }))
                        }}
                        className="mt-1 w-5 h-5 rounded-lg border-2 border-black text-black focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer accent-yellow-400"
                      />
                      <span className={`text-sm font-medium leading-relaxed ${errors.consent ? 'text-red-500' : 'text-gray-600'} group-hover:text-black transition-colors`}>
                        Я даю согласие на обработку персональных данных в соответствии с{' '}
                        <a 
                          href="https://kaliningrad.kiber-one.com/privacy-policy/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-black underline cursor-pointer hover:text-yellow-500 font-bold"
                        >
                          Политикой конфиденциальности
                        </a>
                      </span>
                    </label>
                    {errors.consent && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.consent}</p>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 md:py-4 bg-yellow-400 border-2 border-black text-black font-black text-base md:text-lg rounded-xl shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Отправка...
                      </span>
                    ) : 'Записаться бесплатно'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-10 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.jpg" alt="KIBERone" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-gray-900">KIBERone</span>
          </div>
          <p className="text-sm text-gray-400">
            Организатор — Школа цифровых технологий KIBERone
          </p>
          <p className="text-xs text-gray-300 mt-2">
            © 2026 KIBERone Калининград. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  )
}
