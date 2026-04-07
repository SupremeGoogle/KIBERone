import { motion, useScroll, useTransform } from 'motion/react'
import { useRef, useState, useEffect } from 'react'

const speakers = [
  {
    name: 'Екатерина Пономарева',
    role: 'Учредитель компаний KIBERone и «Этажи» в Калининграде и области',
    topic: 'Почему школьного образования уже недостаточно: какие навыки нужны детям в мире быстрых изменений',
    photo: '/speakers/ekaterina.jpg',
    imageStyle: 'object-cover object-top',
  },
  {
    name: 'Владимир Лемешевский',
    role: 'Сооснователь и руководитель образовательного центра «Эдукариум»',
    topic: 'ЕГЭ и ОГЭ: система подготовки vs тревога',
    photo: '/speakers/vladimir.jpg',
    imageStyle: 'object-cover',
  },
  {
    name: 'Юлия Скабицкая',
    role: 'Директор АНО «Цифровое развитие»',
    topic: 'Как школьнику стать востребованным в ИТ: портфолио, опыт и реальные истории успеха',
    photo: '/speakers/yuliya.jpg',
    imageStyle: 'object-cover object-[35%_center]',
  },
  {
    name: 'Павел Погребняков',
    role: 'Основатель компании «Ампертекс», советник ректора БФУ им. И. Канта',
    topic: 'Дети vs Алгоритмы: Как воспитать не “пользователя”, а “архитектора” реальности',
    photo: '/speakers/pavel.jpg',
    imageStyle: 'object-cover',
  },
]

export function SpeakersHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile/tablet for different scroll logic
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  })
  
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "-300vw"])

  // Mobile Native Scroll Version
  if (isMobile) {
    return (
      <section id="speakers" className="bg-white py-12 md:py-20 border-t-2 border-black overflow-hidden">
        <div className="px-6 mb-10">
          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2 block">Эксперты</span>
          <h2 className="text-3xl font-black text-black leading-tight">
            Те, кто создают <br />
            <span className="font-['Instrument_Serif'] italic font-normal text-4xl text-yellow-500">будущее образования</span>
          </h2>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-5 px-6 pb-10">
          {speakers.map((speaker, i) => (
            <div key={i} className="flex-none w-[85vw] sm:w-[400px] snap-center">
              <div className="bg-white border-2 border-black rounded-[2.5rem] p-5 shadow-[8px_8px_0px_#facc15] h-full flex flex-col">
                <div className="relative w-full h-[35vh] border-2 border-black rounded-[1.5rem] overflow-hidden bg-white mb-6">
                  <img 
                    src={speaker.photo} 
                    alt={speaker.name}
                    className={`w-full h-full ${speaker.imageStyle} transition-transform duration-700`}
                    style={{ transform: 'translateZ(0)', WebkitFontSmoothing: 'antialiased' }}
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-black text-2xl text-black mb-2 leading-tight">{speaker.name}</h3>
                  <p className="text-sm text-gray-600 font-bold border-l-4 border-yellow-400 pl-3 mb-6 line-clamp-3">{speaker.role}</p>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 border border-black/10">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Тема выступления</p>
                    <p className="text-black font-bold text-sm leading-relaxed">«{speaker.topic}»</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
      </section>
    )
  }

  // Desktop Motion Version
  return (
    <section id="speakers" ref={targetRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 h-[100dvh] flex flex-col border-t-2 border-black overflow-hidden">
        
        {/* Title Area - Fixed at top of sticky container */}
        <div className="w-full pt-8 lg:pt-12 px-6 lg:px-20 shrink-0">
          <span className="text-[10px] lg:text-xs font-bold text-yellow-500 uppercase tracking-[0.2em] mb-1 block">Эксперты</span>
          <h2 className="text-3xl lg:text-5xl font-black text-black leading-tight">
            Те, кто создают <br />
            <span className="font-['Instrument_Serif'] italic font-normal text-4xl lg:text-6xl text-yellow-500">будущее образования</span>
          </h2>
        </div>

        {/* Cards Area - Centered in remaining space */}
        <div className="flex-grow flex items-center overflow-hidden relative">
          <motion.div style={{ x }} className="flex w-[400vw] h-full items-center">
            {speakers.map((speaker, i) => (
              <div key={i} className="w-screen flex items-center justify-center px-4 lg:px-20 h-fit">
                <div className="w-full max-w-[1240px] flex items-center gap-6 xl:gap-16 bg-white border-2 border-black rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-12 shadow-[12px_12px_0px_#facc15]">
                  <div className="relative w-[34%] h-[42vh] lg:h-[50vh] max-h-[320px] lg:max-h-[500px] shrink-0 border-2 border-black rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden bg-white">
                    <img src={speaker.photo} alt={speaker.name} className={`w-full h-full ${speaker.imageStyle}`} style={{ transform: 'translateZ(0)' }} />
                  </div>
                  <div className="flex flex-col justify-center w-[66%]">
                    <h3 className="font-black text-2xl lg:text-6xl text-black tracking-tighter mb-2 lg:mb-6">{speaker.name}</h3>
                    <p className="text-gray-800 font-medium text-sm lg:text-xl leading-relaxed mb-4 lg:mb-10 border-l-4 border-yellow-400 pl-4 lg:pl-8">{speaker.role}</p>
                    <div className="bg-white rounded-[1.2rem] lg:rounded-[2rem] p-5 lg:p-8 border-2 border-black shadow-[6px_6px_0px_#000]">
                      <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 lg:mb-3">Тема выступления</p>
                      <p className="text-black font-bold text-sm lg:text-2xl leading-snug">«{speaker.topic}»</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
