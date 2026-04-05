import { motion } from 'motion/react';


export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex justify-center overflow-hidden bg-white">
      {/* ===== Background Video ===== */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover [transform:scaleY(-1)] z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
      />

      {/* ===== White Gradient Overlay ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-[rgba(255,255,255,0)] to-[66.943%] to-white z-[1]" />

      {/* ===== Content Container ===== */}
      <div
        className="relative z-10 w-full flex flex-col items-center text-center px-5"
        style={{ paddingTop: '290px', maxWidth: '1200px', gap: '32px', paddingBottom: '80px' }}
      >
        {/* ---- Badge ---- */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-black/5 backdrop-blur-sm border border-black/10 rounded-full">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-gray-800 font-['Geist']">15 апреля | 18:00 - 20:00</span>
          </div>
          <div className="text-center bg-white/70 backdrop-blur-md px-5 py-2 rounded-2xl border border-black/5 max-w-lg">
            <span className="text-sm font-medium text-gray-800 font-['Geist']">
              Конференц-зал БФУ им. И. Канта, Административный корпус, корпус №1, (ул. А. Невского, 14)
            </span>
          </div>
        </motion.div>

        {/* ---- Heading ---- */}
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex flex-col items-center px-2"
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 500,
            letterSpacing: '-0.04em',
            fontSize: 'clamp(28px, 4.5vw, 60px)',
            lineHeight: 1.05,
            color: '#000',
            margin: 0,
          }}
        >
          Городское родительское собрание: <br />
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(44px, 7.5vw, 110px)',
              lineHeight: 0.9,
              color: '#eab308',
              marginTop: '4px'
            }}
          >
            «Родитель навигатор»
          </span>
        </motion.h1>

        {/* ---- Description ---- */}
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{
            fontFamily: "'Geist', sans-serif",
            fontSize: '20px',
            lineHeight: 1.6,
            color: '#373a46',
            opacity: 0.8,
            maxWidth: '600px',
            margin: 0,
          }}
        >
          Узнайте, как помочь ребёнку адаптироваться к быстро меняющемуся миру и подготовить его к профессиям будущего.
        </motion.p>

        {/* ---- CTA Button ---- */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-4"
        >
          <a href="#register" style={{ textDecoration: 'none' }}>
            <button
              style={{
                whiteSpace: 'nowrap',
                padding: '16px 40px',
                borderRadius: '34px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Geist', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: '#000',
                background: '#facc15', // yellow-400
                boxShadow: 'inset -4px -6px 25px 0px rgba(255,255,255,0.4), inset 4px 4px 10px 0px rgba(0,0,0,0.1), 0 10px 30px -10px rgba(234, 179, 8, 0.5)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = 'inset -4px -6px 25px 0px rgba(255,255,255,0.5), inset 4px 4px 10px 0px rgba(0,0,0,0.15), 0 15px 35px -10px rgba(234, 179, 8, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'inset -4px -6px 25px 0px rgba(255,255,255,0.4), inset 4px 4px 10px 0px rgba(0,0,0,0.1), 0 10px 30px -10px rgba(234, 179, 8, 0.5)';
              }}
            >
              Зарегистрироваться бесплатно
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
