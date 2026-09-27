import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { API_BASE_URL } from '../config'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  source?: 'cache' | 'llm'
  provider?: string
  isError?: boolean
}

const LOADING_MESSAGES = [
  'Checking if we already know this...',
  'Searching packaging knowledge base...',
  'Consulting AI model...',
  'Still working on it...',
  'Almost there...',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0])
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadingIntervalRef = useRef<number>()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (loading) {
      let i = 0
      loadingIntervalRef.current = window.setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length
        setLoadingText(LOADING_MESSAGES[i])
      }, 3500)
    } else {
      setLoadingText(LOADING_MESSAGES[0])
      if (loadingIntervalRef.current) window.clearInterval(loadingIntervalRef.current)
    }
    return () => {
      if (loadingIntervalRef.current) window.clearInterval(loadingIntervalRef.current)
    }
  }, [loading])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.detail || 'Something went wrong answering that.')
      }

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          source: data.source,
          provider: data.provider,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Unable to connect to the assistant right now.',
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-emerald-500/50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[99] w-[92vw] max-w-sm h-[70vh] max-h-[560px] flex flex-col bg-[#0a0e17]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.03]">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">PakGenie Assistant</h3>
              <p className="text-[11px] text-white/40">Ask about packaging & shelf life</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-3">
                  <MessageCircle size={20} className="text-emerald-400/70" />
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Ask a question like "What packaging is best for strawberries?"
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-br-sm'
                      : msg.isError
                      ? 'bg-red-500/10 border border-red-400/20 text-red-200 rounded-bl-sm'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white/90 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.1] px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                  </div>
                  <span className="text-xs text-white/50 transition-all duration-300">
                    {loadingText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Ask a question..."
                className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-emerald-400/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-emerald-400/20 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
                  loading || !input.trim()
                    ? 'bg-white/[0.06] text-white/20 cursor-not-allowed'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white hover:scale-105 active:scale-95'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}