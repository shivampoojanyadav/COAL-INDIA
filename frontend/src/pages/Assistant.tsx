/* ============================================================================
   AI ASSISTANT, mirrors `assistant.html` and `api_query`.

   The panel is deliberately honest about what it is: every answer is
   accompanied by the figures it was computed from, so a reviewer can check the
   arithmetic rather than take it on trust. In production these come from
   `mines/ai_engine.py` and the ML service; here they are derived from the
   register.
   ========================================================================== */

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, type AssistantAnswer } from '@/lib/api'
import { cn } from '@/lib/cn'
import { PillButton, PillLink } from '@/components/primitives/Pill'
import { DisplayTitle, Eyebrow } from '@/components/primitives/Section'
import { Dot, PipRow } from '@/components/primitives/Sticker'
import { SendGlyph, SparkGlyph } from '@/components/primitives/icons'

interface Turn {
  id: number
  prompt: string
  answer: AssistantAnswer | null
  pending: boolean
}

const SUGGESTIONS = [
  'How many critical violations are open?',
  'Which mines are rated critical?',
  'Summarise compliance across the network',
  'Tell me about Jharia Colliery',
  'How many contractor documents have expired?',
]

export function Assistant() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns])

  async function ask(prompt: string) {
    const trimmed = prompt.trim()
    if (!trimmed || busy) return

    const id = nextId.current++
    setTurns((t) => [...t, { id, prompt: trimmed, answer: null, pending: true }])
    setInput('')
    setBusy(true)

    try {
      const answer = await api.assistantQuery(trimmed)
      setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, answer, pending: false } : turn)))
    } catch {
      setTurns((t) =>
        t.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                answer: { text: 'The assistant could not answer that. Please retry.', citations: [] },
                pending: false,
              }
            : turn,
        ),
      )
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(input)
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col">
      {/* ------------------------------------------------------- header */}
      <header className="pb-8">
        <div aria-hidden="true" className="hidden lg:block">
          <PipRow count={5} />
        </div>
        <div className="mt-8">
          <Eyebrow>Assistant · natural language</Eyebrow>
          <DisplayTitle lines={['Ask the register', 'anything.']} size="d3" className="mt-5" />
        </div>
      </header>

      {/* ---------------------------------------------------- conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1">
        {turns.length === 0 ? (
          <div className="py-8">
            <p className="max-w-prose text-lead ink-70">
              Ask a question about the mine network and get an answer computed from the register,
              every figure comes with its source counts.
            </p>

            <ul className="mt-10">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void ask(s)}
                    className="group flex w-full items-center gap-4 border-b border-line py-4 text-left transition-colors duration-300 ease-primary hover:bg-card"
                  >
                    <Dot className="shrink-0" />
                    <span className="min-w-0 flex-1 text-[16px]">{s}</span>
                    <span className="eyebrow ink-40 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      Ask
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-10 py-4">
            {turns.map((turn) => (
              <li key={turn.id}>
                <div className="flex items-start gap-4">
                  <span className="mt-1 shrink-0">
                    <Dot />
                  </span>
                  <p className="text-d5 tighten-md font-normal">{turn.prompt}</p>
                </div>

                <div className="mt-6 flex items-start gap-4 pl-0 lg:pl-10">
                  <span
                    className={cn(
                      'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      turn.pending ? 'bg-card' : 'bg-ink text-white',
                    )}
                  >
                    <SparkGlyph size={15} />
                  </span>

                  <div className="min-w-0 flex-1">
                    {turn.pending ? (
                      <div className="space-y-2.5" aria-busy="true" aria-label="Thinking">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-4 w-1/2" />
                      </div>
                    ) : (
                      <>
                        <p className="max-w-prose text-lead">{turn.answer?.text}</p>

                        {turn.answer && turn.answer.citations.length > 0 && (
                          <>
                            <p className="eyebrow ink-40 mt-7">Computed from</p>
                            <ul className="mt-4 flex flex-wrap gap-3">
                              {turn.answer.citations.map((c) => (
                                <li
                                  key={c.label}
                                  className="rounded-full bg-card px-4 py-2 text-[13px]"
                                >
                                  <span className="ink-50">{c.label}</span>{' '}
                                  <span className="font-medium tabular">{c.value}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        <div className="mt-7 flex flex-wrap gap-3">
                          <PillLink to="/risk" size="sm" variant="outline">
                            Risk board
                          </PillLink>
                          <PillLink to="/compliance" size="sm" variant="outline">
                            Compliance
                          </PillLink>
                          <PillLink to="/contractors" size="sm" variant="outline">
                            Contractors
                          </PillLink>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ------------------------------------------------------- composer */}
      <div className="sticky bottom-0 mt-10 border-t border-line bg-white py-6">
        <form onSubmit={onSubmit} className="flex items-end gap-4">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Ask a question</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about compliance, risk, violations or any mine…"
              className="field h-14 w-full"
              disabled={busy}
            />
          </label>
          <PillButton type="submit" variant="filled" disabled={busy || !input.trim()}>
            <span className="inline-flex items-center gap-2">
              <SendGlyph size={16} />
              {busy ? 'Thinking' : 'Send'}
            </span>
          </PillButton>
        </form>
      </div>
    </div>
  )
}