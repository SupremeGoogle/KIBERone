import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

const speakers = [
  {
    name: 'Екатерина Пономарева',
    role: 'Учредитель компаний KIBERone и «Этажи» в Калининграде и области',
    topic: 'Почему школьного образования уже недостаточно: какие навыки нужны детям в мире быстрых изменений',
    photo: '/speakers/ekaterina.jpg',
    gradient: 'from-yellow-100 to-yellow-50',
    color: 'text-yellow-600',
    imageStyle: 'object-contain', // Keep whole person inside
  },
  {
    name: 'Владимир Лемешевский',
    role: 'Сооснователь и руководитель образовательного центра «Эдукариум»',
    topic: 'ЕГЭ и ОГЭ: система подготовки и снижение тревоги',
    photo: '/speakers/vladimir.jpg',
    gradient: 'from-yellow-100 to-yellow-50',
    color: 'text-yellow-600',
    imageStyle: 'object-cover',
  },
  {
    name: 'Юлия Скабицкая',
    role: 'Директор АНО «Цифровое развитие»',
    topic: 'Как школьнику стать востребованным в ИТ: портфолио, опыт и реальные истории успеха',
    photo: '/speakers/yuliya.jpg',
    gradient: 'from-yellow-100 to-yellow-50',
    color: 'text-yellow-600',
    imageStyle: 'object-cover object-[35%_center]',
  },
  {
    name: 'Павел Погребняков',
    role: 'Основатель компании «Ампертекс», советник ректора БФУ',
    topic: 'Дети и алгоритмы: как воспитать не пользователя, а создателя',
    photo: '/speakers/pavel.jpg',
    gradient: 'from-yellow-100 to-yellow-50',
    color: 'text-yellow-600',
    imageStyle: 'object-cover',
  },
]

export function SpeakersHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  })
  
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "-300vw"])

  return (
    <section id="speakers" ref={targetRef} className="relative h-[400vh] bg-white">
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden border-t-2 border-black">
        
        {/* Title (Stays fixed) */}
        <div className="absolute top-20 sm:top-24 md:top-32 lg:top-36 left-0 w-full z-20 pointer-events-none px-6 md:px-20">
          <span className="text-[10px] md:text-xs font-bold text-yellow-500 uppercase tracking-[0.2em] mb-1 font-['Geist'] block">
            Эксперты
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-black font-['Geist'] tracking-tight leading-[1] md:leading-tight">
            Те, кто создают <br className="hidden md:block" />
            <span className="font-['Instrument_Serif'] italic font-normal text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-yellow-500">будущее образования</span>
          </h2>
        </div>

        {/* Fullscreen Track */}
        <motion.div style={{ x }} className="flex w-[400vw] h-full items-center">
          {speakers.map((speaker, i) => (
            <div 
              key={i} 
              className="w-screen h-full flex flex-col items-center justify-center px-4 md:px-8 xl:px-20 pt-56 sm:pt-60 md:pt-64 lg:pt-80 xl:pt-80 pb-4"
            >
              {/* Speaker Card Container */}
              <div className="w-full h-auto max-h-[80vh] md:max-h-none md:h-auto max-w-[1300px] flex flex-col md:flex-row items-center gap-4 lg:gap-12 xl:gap-20 bg-white border-2 border-black rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 xl:p-12 shadow-[8px_8px_0px_#facc15] md:shadow-[16px_16px_0px_#facc15] transition-all duration-700 overflow-hidden">
                
                {/* Speaker Image */}
                <div className="relative w-full md:w-[36%] lg:w-[33%] h-[36vh] sm:h-[38vh] md:h-[45vh] lg:h-[55vh] shrink-0 flex items-center justify-center border-2 border-black rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white p-2 md:p-0">
                  <img 
                    src={speaker.photo} 
                    alt={speaker.name}
                    className={`w-full h-full ${speaker.imageStyle} transition-all duration-1000 ease-out`}
                    style={{ 
                      imageRendering: 'auto', 
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)',
                      WebkitFontSmoothing: 'antialiased'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=random&size=800&font-size=0.33`;
                    }}
                  />
                </div>

                {/* Speaker Details (Right on Desktop, Bottom on Mobile) */}
                <div className="flex flex-col justify-center w-full md:w-[64%] lg:w-[67%] shrink-1 overflow-y-auto hide-scrollbar">
                  <h3 className="font-['Geist'] font-black text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-7xl text-black tracking-[-0.03em] mb-1 md:mb-4 lg:mb-6 leading-[1.1] md:leading-tight">
                    {speaker.name}
                  </h3>
                  <p className="text-gray-800 font-['Geist'] font-medium text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed mb-4 md:mb-8 lg:mb-12 border-l-4 border-yellow-400 pl-4 md:pl-6">
                    {speaker.role}
                  </p>
                  
                  {/* Topic container */}
                  <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-10 border-2 border-black shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                      <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400 animate-pulse outline outline-[2px] md:outline-4 outline-black"></span>
                      <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase tracking-[0.15em] font-['Geist']">Тема выступления</p>
                    </div>
                    <p className="text-black font-['Geist'] font-bold text-base sm:text-lg md:text-2xl lg:text-3xl leading-snug">
                      «{speaker.topic}»
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </section>
  )
}
