import { useEffect, useRef, useState } from 'react'
import { Clock3, Menu, PackageOpen, Thermometer, X } from 'lucide-react'

const bgImage1 = '/bg1.png'
const bgImage2 = '/bg2.png'
const SPOTLIGHT_R = 260

interface RevealLayerProps {
  image: string
  cursorX: number
  cursorY: number
}

function RevealLayer({ image, cursorX, cursorY }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maskUrl, setMaskUrl] = useState<string>('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2)
    ctx.fill()
    setMaskUrl(canvas.toDataURL())
  }, [cursorX, cursorY])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{
          backgroundImage: `url(${image})`,
          maskImage: maskUrl ? `url(${maskUrl})` : undefined,
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : undefined,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      />
    </>
  )
}

const PakGenieLogo = () => (
  <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff">
    <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
  </svg>
)

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Recommend', href: '#recommend' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Database', href: '#database' },
  { label: 'About', href: '#about' },
] as const

function TryDemoButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button className={`try-demo-btn ${className}`} onClick={onClick}>
      <div><div><div>Try Demo</div></div></div>
    </button>
  )
}

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1))
    const observers: IntersectionObserver[] = []
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const smoothScroll = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 sm:px-8 transition-all duration-300 ${scrolled ? 'py-3 bg-gray-950/70 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' : 'py-4 sm:py-5 bg-transparent'}`}>
      <a href="#home" onClick={(e) => { e.preventDefault(); smoothScroll('#home') }} className="flex items-center gap-2.5 group">
        <PakGenieLogo />
        <span className="text-white text-xl font-semibold tracking-tight group-hover:text-emerald-400 transition-colors">PakGenie</span>
      </a>
      <div className="hidden md:flex bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-1.5 py-1.5 items-center gap-0.5">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = activeSection === href.slice(1)
          return (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); smoothScroll(href) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white/20 text-white shadow-inner' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              {label}
            </a>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <TryDemoButton onClick={() => smoothScroll('#recommend')} className="hidden md:block" />
        <button className="md:hidden text-white p-1" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div className={`absolute top-full left-0 right-0 md:hidden bg-gray-950/90 backdrop-blur-xl border-b border-white/10 flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-[400px] py-5 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = activeSection === href.slice(1)
          return (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); smoothScroll(href) }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              {label}
            </a>
          )
        })}
        <TryDemoButton onClick={() => smoothScroll('#recommend')} className="mt-2" />
      </div>
    </nav>
  )
}

/* ── Shared types & data ── */

const FRESH_PRODUCE = [
  'mango', 'banana', 'apple', 'tomato', 'potato', 'spinach', 'lettuce',
  'strawberry', 'grapes', 'broccoli', 'carrot', 'cucumber', 'onion',
  'papaya', 'guava', 'peas', 'okra', 'cabbage', 'cauliflower',
]

const COMMODITY_SUGGESTIONS = [
  'Mango', 'Potato Chips', 'Paneer', 'Milk', 'Banana', 'Apple',
  'Tomato', 'Rice', 'Wheat Flour', 'Cookies', 'Bread', 'Cheese',
  'Yogurt', 'Chicken', 'Fish', 'Juice', 'Jam', 'Pickles',
  'Ghee', 'Butter', 'Spinach', 'Lettuce', 'Frozen Peas',
]

interface FormData {
  commodity: string
  moisture: number
  oilFat: number
  pH: number
  shelfLife: number
  shelfLifeUnit: string
  storageType: string
  storageTemp: number
  humidity: number
  respirationRate: number
  transportation: string
}

interface PredictionResponse {
  food_type: string
  packaging_type: string
  predicted_shelf_life_days: number
}

const DEFAULT_FORM: FormData = {
  commodity: '', moisture: 30, oilFat: 5, pH: 6.5,
  shelfLife: 30, shelfLifeUnit: 'days', storageType: 'Ambient',
  storageTemp: 25, humidity: 60, respirationRate: 20,
  transportation: 'Local/Short-distance',
}

/* ── Mock recommendation engine ── */

interface Recommendation {
  material: string
  reasoning: string
  matchScore: number
  sustainable: string | null
  otr: string
  wvtr: string
  thickness: string
  sealability: string
  gasPermeability: string
  mapSuitable: boolean
  mapComposition: string | null
}

function getMockResults(form: FormData): { primary: Recommendation; alternatives: Recommendation[] } {
  const isFresh = FRESH_PRODUCE.some((p) => form.commodity.toLowerCase().includes(p))
  const isOily = form.oilFat > 15
  const isFrozen = form.storageType === 'Frozen'
  const isChilled = form.storageType === 'Chilled'

  let primary: Recommendation
  if (isFresh) {
    primary = {
      material: 'Micro-Perforated LDPE Film',
      reasoning: `Selected for ${form.commodity}'s high respiration rate and moisture sensitivity — balances breathability with condensation control.`,
      matchScore: 94,
      sustainable: 'Recyclable',
      otr: '6,000 – 8,000 cc/m²/day',
      wvtr: '15 – 22 g/m²/day',
      thickness: '25 – 40 μm',
      sealability: 'High',
      gasPermeability: '4,500 cc/m²/day',
      mapSuitable: true,
      mapComposition: 'N₂: 78%, O₂: 5%, CO₂: 17%',
    }
  } else if (isOily) {
    primary = {
      material: 'Metallized PET / PE Laminate',
      reasoning: `High oil/fat content (${form.oilFat}%) demands superior oxygen and light barrier to prevent rancidity over ${form.shelfLife} ${form.shelfLifeUnit}.`,
      matchScore: 91,
      sustainable: null,
      otr: '0.5 – 1.0 cc/m²/day',
      wvtr: '0.3 – 0.8 g/m²/day',
      thickness: '70 – 100 μm',
      sealability: 'Very High',
      gasPermeability: '0.8 cc/m²/day',
      mapSuitable: true,
      mapComposition: 'N₂: 100%',
    }
  } else if (isFrozen) {
    primary = {
      material: 'Nylon/PE Co-Extruded Film',
      reasoning: `Excellent puncture resistance and flexibility at ${form.storageTemp}°C — prevents freeze-burn while maintaining seal integrity.`,
      matchScore: 89,
      sustainable: null,
      otr: '15 – 25 cc/m²/day',
      wvtr: '2 – 5 g/m²/day',
      thickness: '80 – 120 μm',
      sealability: 'Very High',
      gasPermeability: '12 cc/m²/day',
      mapSuitable: false,
      mapComposition: null,
    }
  } else {
    primary = {
      material: 'BOPP / CPP Laminate',
      reasoning: `Balanced moisture and gas barrier for ${form.commodity} at ambient conditions — cost-effective for ${form.shelfLife} ${form.shelfLifeUnit} shelf life target.`,
      matchScore: 92,
      sustainable: 'Recyclable',
      otr: '800 – 1,200 cc/m²/day',
      wvtr: '4 – 8 g/m²/day',
      thickness: '40 – 60 μm',
      sealability: 'High',
      gasPermeability: '650 cc/m²/day',
      mapSuitable: true,
      mapComposition: 'N₂: 95%, CO₂: 5%',
    }
  }

  const alternatives: Recommendation[] = [
    {
      material: isChilled ? 'PET/AL/PE Foil Pouch' : 'HDPE Woven Sack + PE Liner',
      reasoning: isChilled
        ? 'Premium barrier for extended chilled shelf life — ideal for export.'
        : 'Budget-friendly bulk packaging with adequate moisture protection.',
      matchScore: isChilled ? 85 : 78,
      sustainable: isChilled ? null : 'Recyclable',
      otr: isChilled ? '0.1 cc/m²/day' : '2,500 cc/m²/day',
      wvtr: isChilled ? '0.1 g/m²/day' : '12 g/m²/day',
      thickness: isChilled ? '90 μm' : '150 μm',
      sealability: isChilled ? 'Very High' : 'Medium',
      gasPermeability: isChilled ? '0.05 cc/m²/day' : '1,800 cc/m²/day',
      mapSuitable: isChilled,
      mapComposition: isChilled ? 'N₂: 70%, CO₂: 30%' : null,
    },
    {
      material: isFresh ? 'Compostable PLA Film' : 'Paper/PE/AL Laminate',
      reasoning: isFresh
        ? 'Eco-friendly option with moderate breathability — suitable for short shelf life.'
        : 'Excellent printability and shelf appeal with strong barrier properties.',
      matchScore: isFresh ? 76 : 82,
      sustainable: isFresh ? 'Biodegradable' : 'Partially Recyclable',
      otr: isFresh ? '3,200 cc/m²/day' : '1.5 cc/m²/day',
      wvtr: isFresh ? '180 g/m²/day' : '0.5 g/m²/day',
      thickness: isFresh ? '30 μm' : '85 μm',
      sealability: isFresh ? 'Medium' : 'High',
      gasPermeability: isFresh ? '2,800 cc/m²/day' : '1.2 cc/m²/day',
      mapSuitable: false,
      mapComposition: null,
    },
  ]

  return { primary, alternatives }
}

/* ── How It Works Section ── */

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Enter Product Details',
    desc: 'Tell us about your product — commodity type, moisture, pH, and storage needs.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'AI Analyzes Properties',
    desc: 'Our engine matches your inputs against a packaging material database using barrier and permeability logic.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Get Matched Recommendations',
    desc: 'Receive your best-fit packaging material along with OTR, WVTR, thickness, and sealability specs.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Download & Apply',
    desc: 'Export your recommendation report and apply it directly to your packaging process.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
]

function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-5% 0px -5% 0px', threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative w-full bg-[#06080e] text-white py-24 sm:py-32 px-5 sm:px-8 border-t border-white/[0.08] overflow-hidden"
    >
      {/* Top subtle gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/25 to-transparent" />

      {/* Background subtle ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #2dd4bf 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300 tracking-wide uppercase">
              The Process
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            How It Works
          </h2>

          <p className="text-sm sm:text-base text-white/50 max-w-xl leading-relaxed">
            From product details to packaging recommendation in four simple steps.
          </p>
        </div>

        {/* Steps container */}
        <div className="relative">
          {/* Desktop horizontal connector line */}
          <div className="hidden lg:block absolute top-[31px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-teal-500/15 via-teal-400/35 to-teal-500/15 -z-0 pointer-events-none" />

          {/* Mobile vertical connector line */}
          <div className="lg:hidden absolute left-[31px] top-[31px] bottom-[56px] w-[2px] bg-gradient-to-b from-teal-400/40 via-teal-400/25 to-teal-400/10 -z-0 pointer-events-none" />

          {/* 4 Steps: horizontal on desktop, vertical stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-8 relative z-10">
            {HOW_IT_WORKS_STEPS.map((item, i) => (
              <div
                key={item.step}
                className={`group flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-5 sm:gap-6 lg:gap-4 transition-all duration-500 ${
                  isVisible ? 'step-anim-in' : 'opacity-0'
                }`}
                style={{ animationDelay: `${0.12 + i * 0.15}s` }}
              >
                {/* Icon Container with step badge */}
                <div className="relative shrink-0">
                  <div className="w-[62px] h-[62px] rounded-2xl bg-[#090d16] border border-white/[0.12] flex items-center justify-center text-teal-400 shadow-xl shadow-black/40 transition-all duration-300 group-hover:border-teal-400/50 group-hover:bg-[#0c1322] group-hover:scale-105 group-hover:shadow-teal-500/10">
                    {item.icon}
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#06080e] border border-teal-400/40 text-[10px] font-bold text-teal-300 shadow-sm">
                    {item.step}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 lg:flex-initial">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 group-hover:text-teal-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs lg:mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Recommend Section ── */

function RecommendSection({ form, setForm, onSubmit }: {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSubmit: () => Promise<void>
}) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [submitting, setSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = COMMODITY_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(form.commodity.toLowerCase())
  ).slice(0, 6)

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const canNext = () => {
    if (step === 1) return form.commodity.trim().length > 0
    if (step === 2) return Number.isFinite(form.storageTemp)
    return Number.isFinite(form.humidity)
  }

  const goNext = () => {
    if (!canNext()) return
    if (step === 3) {
      setSubmitting(true)
      onSubmit().then(() => {
        setTimeout(() => {
          const el = document.getElementById('results')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }).finally(() => setSubmitting(false))
      return
    }
    setDirection('next')
    setStep((s) => s + 1)
  }

  const goBack = () => { setDirection('back'); setStep((s) => s - 1) }

  const inputBase = 'w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-emerald-400/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-emerald-400/20'
  const labelBase = 'block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5'

  const renderStep = () => {
    if (step === 1) return (
      <div className="flex flex-col gap-5">
        <div className="relative" ref={suggestRef}>
          <label className={labelBase}>Commodity Type *</label>
          <input type="text" className={inputBase} placeholder="e.g. Mango, Potato Chips, Paneer..."
            value={form.commodity} onChange={(e) => { set('commodity', e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)} />
          {showSuggestions && form.commodity && filteredSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {filteredSuggestions.map((s) => (
                <button key={s} type="button" className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  onClick={() => { set('commodity', s); setShowSuggestions(false) }}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-white/50 leading-relaxed">Enter the food type exactly as it appears in the product database.</p>
        </div>
      </div>
    )
    if (step === 2) return (
      <div className="flex flex-col gap-5">
        <div>
          <label className={labelBase}>Temperature (°C) *</label>
          <input type="number" step={0.1} className={inputBase} placeholder="25" value={form.storageTemp} onChange={(e) => set('storageTemp', +e.target.value)} />
          <span className="text-[10px] text-white/25 mt-1 inline-block">Sent as temperature_c</span>
        </div>
      </div>
    )
    return (
      <div className="flex flex-col gap-5">
        <div>
          <label className={labelBase}>Humidity (%) *</label>
          <input type="number" min={0} max={100} step={0.1} className={inputBase} placeholder="60" value={form.humidity} onChange={(e) => set('humidity', +e.target.value)} />
          <span className="text-[10px] text-white/25 mt-1 inline-block">Range: 0 – 100 · Sent as humidity_pct</span>
        </div>
      </div>
    )
  }

  return (
    <section id="recommend" className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: 'url(/bg3.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-[1]" />
      <div className="relative z-10 flex flex-col items-center px-5 sm:px-8 py-24 sm:py-32">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-3" style={{ letterSpacing: '-0.03em' }}>Tell Us About Your Product</h2>
        <p className="text-sm sm:text-base text-white/50 text-center max-w-md mb-10">Answer a few questions and get instant packaging recommendations.</p>
        <div className="w-full max-w-xl">
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium text-white/50">Step {step} of 3</span>
              <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-5">
              {step === 1 && 'Food Type'}{step === 2 && 'Temperature'}{step === 3 && 'Humidity'}
            </h3>
            <div className="relative overflow-hidden">
              <div key={step} className={`recommend-step-${direction}`}>{renderStep()}</div>
            </div>
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/[0.06]">
              {step > 1 ? (
                <button type="button" onClick={goBack} className="text-sm font-medium text-white/50 hover:text-white border border-white/15 hover:border-white/30 px-5 py-2.5 rounded-full transition-all hover:bg-white/5">← Back</button>
              ) : <div />}
              <button type="button" onClick={goNext} disabled={!canNext() || submitting}
                className={`text-sm font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-95 ${canNext() && !submitting ? 'bg-[#e8702a] hover:bg-[#d2611f] text-white hover:shadow-lg hover:shadow-[#e8702a]/30' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>Analyzing...
                  </span>
                ) : step === 3 ? 'Get Recommendation →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Results Section ── */

const SPEC_ICONS: Record<string, JSX.Element> = {
  OTR: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>,
  WVTR: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-3 4.5-7 7.5-7 12a7 7 0 0014 0c0-4.5-4-7.5-7-12z"/></svg>,
  Thickness: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h18M3 16h18"/><path d="M12 8v-4m0 16v-4"/></svg>,
  Sealability: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>,
  'Gas Perm': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m-3-3v6"/><circle cx="17" cy="14" r="4"/></svg>,
  MAP: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 12h18"/></svg>,
}

function SpecCard({ icon, label, value, delay }: { icon: JSX.Element; label: string; value: string; delay: number }) {
  return (
    <div className="result-card-anim bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-xl p-4 flex items-start gap-3"
      style={{ animationDelay: `${delay}s` }}>
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{label}</div>
        <div className="text-sm text-white/90 font-medium mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function AltCard({ rec, delay }: { rec: Recommendation; delay: number }) {
  return (
    <div className="result-card-anim min-w-[280px] bg-white/[0.05] backdrop-blur-md border border-white/[0.08] rounded-xl p-5 flex flex-col gap-3"
      style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{rec.material}</h4>
        <span className="text-xs font-bold text-emerald-400">{rec.matchScore}%</span>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">{rec.reasoning}</p>
      {rec.sustainable && (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-2.5 py-1 w-fit">
          ♻ {rec.sustainable}
        </span>
      )}
    </div>
  )
}

function ResultsSection({ form, response, onReset }: { form: FormData; response: PredictionResponse; onReset: () => void }) {
  return (
    <section id="results" className="relative w-full overflow-hidden bg-[#080b12] text-white">
      <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{ backgroundImage: 'url(/bg3.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080b12]/70 via-[#080b12]/95 to-[#080b12]" />
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 result-card-anim">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              Prediction Ready
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-3">Your packaging match</h2>
          </div>
          <div className="text-sm text-white/40 sm:text-right">Analysis for<br /><span className="text-white/80">{response.food_type}</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.08] p-7 sm:p-10 result-card-anim" style={{ animationDelay: '0.12s' }}>
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full border border-emerald-300/15" />
            <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full border border-emerald-300/10" />
            <div className="relative">
              <div className="flex items-center gap-3 text-emerald-200/70 text-xs uppercase tracking-[0.16em] font-semibold">
                <PackageOpen size={18} strokeWidth={1.6} /> Recommended packaging
              </div>
              <h3 className="max-w-xl text-3xl sm:text-5xl font-semibold leading-tight text-white mt-8">{response.packaging_type}</h3>
              <div className="flex flex-wrap gap-2 mt-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-2 text-xs text-white/70">
                  <Thermometer size={14} className="text-orange-300" /> {form.storageTemp}°C storage
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-2 text-xs text-white/70">
                  <span className="text-sky-300">RH</span> {form.humidity}% humidity
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-7 sm:p-8 flex flex-col justify-between result-card-anim" style={{ animationDelay: '0.22s' }}>
            <div className="flex items-center gap-3 text-white/50 text-xs uppercase tracking-[0.16em] font-semibold">
              <Clock3 size={18} strokeWidth={1.6} className="text-amber-300" /> Predicted shelf life
            </div>
            <div className="mt-10">
              <span className="text-6xl sm:text-7xl font-semibold tracking-tight text-white">{response.predicted_shelf_life_days}</span>
              <span className="text-lg text-white/50 ml-2">days</span>
            </div>
            <div className="h-px bg-white/10 mt-8 mb-4" />
            <p className="text-xs text-white/40 leading-relaxed">Model estimate based on the submitted food type, temperature, and humidity.</p>
          </div>
        </div>

        <div className="flex justify-end mt-8 result-card-anim" style={{ animationDelay: '0.32s' }}>
          <button onClick={onReset}
            className="text-sm font-medium text-white/60 hover:text-white border border-white/15 hover:border-emerald-300/40 px-6 py-3 rounded-full transition-all duration-200 hover:bg-white/5">
            Try Another Product →
          </button>
        </div>
      </div>
    </section>
  )

  const { primary, alternatives } = getMockResults(form)

  const specs = [
    { icon: SPEC_ICONS.OTR, label: 'Oxygen Transmission Rate', value: primary.otr },
    { icon: SPEC_ICONS.WVTR, label: 'Water Vapor Transmission Rate', value: primary.wvtr },
    { icon: SPEC_ICONS.Thickness, label: 'Film Thickness', value: primary.thickness },
    { icon: SPEC_ICONS.Sealability, label: 'Sealability', value: primary.sealability },
    { icon: SPEC_ICONS['Gas Perm'], label: 'Gas Permeability', value: primary.gasPermeability },
    { icon: SPEC_ICONS.MAP, label: 'MAP Suitability', value: primary.mapSuitable ? `Yes — ${primary.mapComposition}` : 'No' },
  ]

  const handleDownload = () => {
    const lines = [
      'PakGenie — Packaging Recommendation Report',
      '='.repeat(46),
      '',
      `Commodity: ${form.commodity}`,
      `Moisture: ${form.moisture}% | Oil/Fat: ${form.oilFat}% | pH: ${form.pH}`,
      `Shelf Life Target: ${form.shelfLife} ${form.shelfLifeUnit}`,
      `Storage: ${form.storageType} at ${form.storageTemp}°C, ${form.humidity}% RH`,
      `Transport: ${form.transportation}`,
      '',
      '── Primary Recommendation ──',
      `Material: ${primary.material}`,
      `Match Score: ${primary.matchScore}%`,
      `Reasoning: ${primary.reasoning}`,
      '',
      ...specs.map((s) => `${s.label}: ${s.value}`),
      '',
      '── Alternative Options ──',
      ...alternatives.map((a, i) => `${i + 1}. ${a.material} (${a.matchScore}%) — ${a.reasoning}`),
      '',
      'Generated by PakGenie — AI-Powered Packaging Intelligence',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PakGenie_Report_${form.commodity.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    onReset()
    setTimeout(() => {
      const el = document.getElementById('recommend')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <section id="results" className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: 'url(/bg3.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/80 to-black/85" />

      <div className="relative z-10 flex flex-col items-center px-5 sm:px-8 py-20 sm:py-28">
        {/* Header */}
        <div className="result-card-anim inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-5"
          style={{ animationDelay: '0.1s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-300 tracking-wide uppercase">AI Recommendation Ready</span>
        </div>
        <h2 className="result-card-anim text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-3"
          style={{ letterSpacing: '-0.03em', animationDelay: '0.2s' }}>
          Your Recommended Packaging
        </h2>
        <p className="result-card-anim text-sm sm:text-base text-white/50 text-center max-w-lg mb-12"
          style={{ animationDelay: '0.3s' }}>
          Based on <span className="text-white/80 font-medium">{form.commodity}</span>'s properties, here's what we recommend.
        </p>

        {/* Primary card */}
        <div className="result-card-anim w-full max-w-2xl mb-8" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />

            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M8 14h8M10 17h4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{primary.material}</h3>
                  {/* Match score */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">{primary.matchScore}%</span>
                    </div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Match</span>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">{primary.reasoning}</p>
                {primary.sustainable && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-3 py-1">
                    ♻ {primary.sustainable}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spec cards grid */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {specs.map((s, i) => (
            <SpecCard key={s.label} icon={s.icon} label={s.label} value={s.value} delay={0.5 + i * 0.08} />
          ))}
        </div>

        {/* Alternative options */}
        <div className="w-full max-w-2xl mb-12">
          <h4 className="result-card-anim text-xs font-semibold text-white/40 uppercase tracking-wider mb-4"
            style={{ animationDelay: '1s' }}>
            Other Suitable Options
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
            {alternatives.map((alt, i) => (
              <AltCard key={alt.material} rec={alt} delay={1.05 + i * 0.12} />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="result-card-anim flex flex-wrap items-center gap-4" style={{ animationDelay: '1.3s' }}>
          <button onClick={handleDownload}
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30">
            Download Report
          </button>
          <button onClick={handleReset}
            className="text-sm font-medium text-white/50 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3 rounded-full transition-all duration-200 hover:bg-white/5">
            Try Another Product →
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ── */

const GITHUB_REPO_URL = 'https://github.com/srishanbangera-sys/Waste_material_recommendation.git'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function Footer() {
  const smoothScroll = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="relative w-full bg-[#05070d] text-white overflow-hidden border-t border-white/[0.08]">
      {/* Top subtle gradient accent line */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-12">
        {/* Main 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 lg:gap-12 mb-14 text-center sm:text-left">
          {/* Column 1 — Brand */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault()
                smoothScroll('#home')
              }}
              className="flex items-center gap-2.5 group"
            >
              <PakGenieLogo />
              <span className="text-white text-xl font-semibold tracking-tight group-hover:text-emerald-400 transition-colors">
                PakGenie
              </span>
            </a>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-xs">
              AI-powered packaging intelligence for food commodities.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Smart India Hackathon 2026
            </div>
          </div>

          {/* Column 2 — Team Info */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Team</span>
            <div className="space-y-1.5">
              <h4 className="text-base font-semibold text-white">Gradient Descent</h4>
              <p className="text-xs text-white/50">
                SIH Problem Statement ID:{' '}
                <span className="font-mono text-teal-400 font-semibold">SIH26236</span>
              </p>
            </div>
            <p className="text-xs text-white/40 max-w-xs mt-1 leading-relaxed">
              Developing AI-driven packaging material recommendations to extend shelf life and reduce food waste.
            </p>
          </div>

          {/* Column 3 — Links */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Project</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-teal-400 transition-colors group"
            >
              <GithubIcon className="w-4 h-4 transition-colors group-hover:text-teal-400" />
              <span className="group-hover:underline underline-offset-4">GitHub Repository</span>
              <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>

            <div className="mt-3 flex flex-col items-center sm:items-start gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Quick Links</span>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1.5">
                {NAV_LINKS.map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault()
                      smoothScroll(href)
                    }}
                    className="text-xs text-white/60 hover:text-teal-400 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 4 — Contact */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Contact</span>
            <p className="text-xs text-white/50 leading-relaxed max-w-xs">
              Questions or feedback regarding the recommendation engine?
            </p>
            <a
              href="mailto:contact@pakgenie.dev"
              className="text-xs text-white/80 hover:text-teal-400 transition-colors underline underline-offset-4"
            >
              contact@pakgenie.dev
            </a>
            <span className="text-[11px] text-white/30 mt-1">SIH 2026 Working Prototype</span>
          </div>
        </div>

        {/* Bottom bar (full width, below columns) */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-white/40">
            Built for Smart India Hackathon 2026 · Team Gradient Descent
          </p>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-teal-400 border border-white/[0.08] hover:border-teal-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}

/* ── App ── */

export default function App() {
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>()
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM })
  const [showResults, setShowResults] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY }
    window.addEventListener('mousemove', handleMouseMove)
    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', handleMouseMove); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const handleFormSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_type: form.commodity.trim(),
          temperature_c: form.storageTemp,
          humidity_pct: form.humidity,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.detail || 'Prediction request failed.')
      }

      setPrediction(await response.json() as PredictionResponse)
      setShowResults(true)
    } catch (error) {
      setShowResults(false)
      window.alert(error instanceof Error ? error.message : 'Unable to connect to the backend.')
    }
  }
  const handleReset = () => { setShowResults(false); setPrediction(null); setForm({ ...DEFAULT_FORM }) }

  return (
    <div className="min-h-screen bg-black tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Nav />
      <section id="home" className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        <div className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom" style={{ backgroundImage: `url(${bgImage1})` }} />
        <RevealLayer image={bgImage2} cursorX={cursorPos.x} cursorY={cursorPos.y} />
        <div className="absolute top-[14%] left-0 right-[6%] z-50 flex flex-col items-end text-right px-5 pointer-events-none">
          <h1 className="text-white leading-[0.95]">
            <span className="block font-playfair italic font-normal text-3xl sm:text-4xl md:text-5xl hero-anim hero-reveal" style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}>Layers hold</span>
            <span className="block font-normal text-3xl sm:text-4xl md:text-5xl -mt-1 hero-anim hero-reveal" style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}>tales of time</span>
          </h1>
        </div>
        <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade" style={{ animationDelay: '0.7s' }}>
          <p className="text-sm text-white/80 leading-relaxed">AI-powered packaging, matched to your product.</p>
        </div>
        <div className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">Every food commodity has unique barrier and permeability needs. We analyze your product's properties and recommend the exact packaging material and specs to maximize shelf life.</p>
        </div>
      </section>

      <HowItWorksSection />
      <RecommendSection form={form} setForm={setForm} onSubmit={handleFormSubmit} />
      {showResults && prediction && <ResultsSection form={form} response={prediction} onReset={handleReset} />}

      {/* Target anchor elements for nav links if not yet in full sections */}
      <div id="database" />
      <div id="about" />

      <Footer />
    </div>
  )
}

