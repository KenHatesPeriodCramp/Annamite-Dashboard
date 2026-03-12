import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import * as portfolioData from '../data/mockData'
import { Panel, PanelHeader, KpiCard, Badge } from '../components/UI'

const CHAT_COMPLETIONS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const MAX_COMPLETION_TOKENS = 1200
const MAX_AUTO_CONTINUATIONS = 2

const STORAGE_KEYS = {
  apiKey: 'annamite.cerebras.apiKey',
  model: 'annamite.cerebras.model',
}

const MODELS = [
  { value: 'gpt-oss-120b', label: 'GPT OSS 120B' },
  { value: 'llama3.1-8b', label: 'Llama 3.1 8B' },
]

const STARTER_PROMPTS = [
  'Summarize current fund performance and top risks.',
  'Which strategies contribute most to return and why?',
  'Explain the current allocation mix in plain English.',
  'What does the retail participation data imply for alpha?',
  'Explain the monthly return decomposition in a markdown table.',
  'Show the Sharpe ratio as $SR = \\frac{R_p - R_f}{\\sigma_p}$ and explain it simply.',
]

function normalizeRenderedMarkdown(content) {
  return content
    .replace(/\r\n?/g, '\n')
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression) => `$$\n${expression.trim()}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression) => `$${expression.trim()}$`)
    .replace(/(^|\n)\[\s*\n([\s\S]*?)\n\s*\](?=\n|$)/g, (_, lead, expression) => `${lead}$$\n${expression.trim()}\n$$`)
}

function longestSuffixPrefixOverlap(left, right, maxLength = 240) {
  const maxOverlap = Math.min(left.length, right.length, maxLength)

  for (let size = maxOverlap; size > 0; size -= 1) {
    if (left.slice(-size) === right.slice(0, size)) {
      return size
    }
  }

  return 0
}

function lastMeaningfulLine(text) {
  return text.trimEnd().split('\n').at(-1) || ''
}

function firstMeaningfulLine(text) {
  return text.trimStart().split('\n')[0] || ''
}

function shouldJoinDirectly(left, right) {
  const trimmedRight = right.trimStart()
  const previousLine = lastMeaningfulLine(left)
  const nextLine = firstMeaningfulLine(trimmedRight)

  if (!trimmedRight) return true
  if (previousLine.includes('|') || nextLine.includes('|') || trimmedRight.startsWith('|')) return true
  if (/\.\s*$/.test(left) && /^\d/.test(trimmedRight)) return true
  if (/[\w$]$/.test(left.trimEnd()) && /^[\w$]/.test(trimmedRight)) return true
  if (/[\-–—/]$/.test(left.trimEnd())) return true
  if (/[$\\({[]$/.test(left.trimEnd())) return true
  if (/^[,.;:!?%)}\]]/.test(trimmedRight)) return true

  return false
}

function stitchSegments(segments) {
  return segments.reduce((combined, segment) => {
    const next = segment.trim()

    if (!combined) return next
    if (!next) return combined

    const overlap = longestSuffixPrefixOverlap(combined, next)
    const remainder = next.slice(overlap)

    if (!remainder) return combined
    if (/^[,.;:!?)}\]]/.test(remainder) || /[\s\n]$/.test(combined)) {
      return `${combined}${remainder}`
    }
    if (/^[\s\n]/.test(remainder)) {
      return `${combined}${remainder}`
    }
    if (shouldJoinDirectly(combined, remainder)) {
      return `${combined}${remainder}`
    }

    if (/[.!?]$/.test(combined.trimEnd())) {
      return `${combined}\n\n${remainder}`
    }

    return `${combined} ${remainder}`
  }, '')
}

function buildContinuationPrompt(partialResponse) {
  const normalized = partialResponse.trim()
  const tail = normalized.slice(-400)

  return [
    'Continue the previous answer from the exact next characters with no repetition.',
    'Do not repeat headings, bullets, table rows, formulas, or sentences already written.',
    'Keep the same Markdown structure and use only `$...$` or `$$...$$` for math.',
    'If you resume mid-list or mid-table, continue it cleanly without restarting.',
    'If the prior answer ended mid-row, mid-number, or mid-formula, resume on that same line.',
    `Last visible excerpt:\n\n${tail}`,
  ].join('\n\n')
}

const markdownComponents = {
  h1: ({ node, ...props }) => <h1 className="text-[15px] font-semibold text-[#0f172a]" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-[14px] font-semibold text-[#0f172a]" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-[13px] font-semibold text-[#0f172a]" {...props} />,
  p: ({ node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 list-disc pl-5 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-3 border-l-2 border-[#cbd5e1] pl-3 text-[#475569] italic" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a
      className="text-[#2563eb] underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-[#e2e8f0]">
      <table className="min-w-full border-collapse text-[11px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-[#f8fafc]" {...props} />,
  th: ({ node, ...props }) => (
    <th className="border-b border-[#e2e8f0] px-3 py-2 text-left font-semibold text-[#475569]" {...props} />
  ),
  td: ({ node, ...props }) => <td className="border-t border-[#eef2f7] px-3 py-2 align-top" {...props} />,
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="rounded bg-[#eff6ff] px-1.5 py-0.5 font-mono text-[11px] text-[#1d4ed8]"
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <code className="block overflow-x-auto rounded-md bg-[#0f172a] px-3 py-2 font-mono text-[11px] text-[#e2e8f0]" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ node, ...props }) => <pre className="my-3 whitespace-pre-wrap" {...props} />,
  hr: ({ node, ...props }) => <hr className="my-4 border-0 border-t border-[#e2e8f0]" {...props} />,
}

function MessageContent({ content }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={[rehypeKatex]}
      components={markdownComponents}
    >
      {normalizeRenderedMarkdown(content)}
    </Markdown>
  )
}

function tail(items, count) {
  return items.slice(Math.max(0, items.length - count))
}

function buildPortfolioContext() {
  const latestNav = portfolioData.navSeries.at(-1)
  const latestRetail = portfolioData.retailData.at(-1)

  return JSON.stringify({
    fundKPIs: portfolioData.fundKPIs,
    latestFundSnapshot: latestNav,
    recentFundNav: tail(portfolioData.navSeries, 8).map(row => ({
      date: row.date,
      nav: row.nav,
      dailyRet: row.dailyRet,
      rollSharpe: row.rollSharpe,
      rollVol: row.rollVol,
    })),
    strategies: portfolioData.strategyData.map(strategy => ({
      name: strategy.name,
      allocation: strategy.allocation,
      ytdReturn: strategy.ytdReturn,
      sharpe: strategy.sharpe,
      sortino: strategy.sortino,
      volatility: strategy.vol,
      maxDD: strategy.maxDD,
      beta: strategy.beta,
      infoRatio: strategy.ir,
      aum: strategy.aum,
      dailyPnL: strategy.dailyPnL,
      mtdPnL: strategy.mtdPnL,
    })),
    correlations: portfolioData.STRATEGIES.map((strategy, index) => ({
      strategy,
      correlations: Object.fromEntries(
        portfolioData.STRATEGIES.map((other, innerIndex) => [other, portfolioData.correlationMatrix[index][innerIndex]])
      ),
    })),
    factorExposures: portfolioData.cryptoFactors,
    barraExposures: portfolioData.barraExposures,
    macro: {
      current: portfolioData.currentMacro,
      recent: tail(portfolioData.macroData, 6),
      sensitivities: portfolioData.macroSensitivity,
    },
    regimes: {
      recent: tail(portfolioData.regimeSeries, 10),
      performance: portfolioData.regimePerf,
    },
    returns: {
      decomposition: portfolioData.returnDecomp,
      monthly: portfolioData.monthlyReturns,
    },
    market: portfolioData.cryptoMarket,
    retail: {
      latest: latestRetail,
      recent: tail(portfolioData.retailData, 8),
      alphaImpact: portfolioData.retailAlphaImpact.map(row => ({
        strategy: row.strategy,
        sensitivity: row.sensitivity,
        description: row.description,
      })),
      quartiles: portfolioData.retailQuartileImpact,
      correlations: portfolioData.retailCorrelations,
    },
  }, null, 2)
}

const SYSTEM_PROMPT = `You are the Annamite Portfolio Copilot.
You answer questions only from the provided portfolio context and clearly say when something is not present in the data.
Prioritize concise, analytical answers about performance, allocation, risk, macro, regime, and retail participation.
When useful, cite the exact metric names and values from the provided data.
If the user asks for recommendations, frame them as scenario analysis instead of financial advice.
Format responses in clean GitHub-flavored Markdown.
For math, use only inline $...$ or block $$...$$ delimiters.
Do not use \\(...\\), \\[...\\], or bare [ ... ] math blocks.
When presenting formulas, follow them with a plain-English explanation.
If the answer may be long, prefer complete sections and avoid ending mid-sentence.`

export default function Chatbot() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.apiKey) || '')
  const [model, setModel] = useState(() => {
    const storedModel = localStorage.getItem(STORAGE_KEYS.model)
    return MODELS.some(option => option.value === storedModel) ? storedModel : MODELS[0].value
  })
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi — I can answer questions about the mock Annamite portfolio data once you provide your own Cerebras API key.',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showContext, setShowContext] = useState(false)

  const portfolioContext = useMemo(() => buildPortfolioContext(), [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.model, model)
  }, [model])

  async function requestCompletion(conversationMessages) {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        top_p: 1,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nPortfolio context:\n${portfolioContext}`,
          },
          ...conversationMessages,
        ],
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result?.message || result?.error?.message || `Request failed with status ${response.status}`)
    }

    const choice = result?.choices?.[0]
    const content = choice?.message?.content?.trim()
    if (!content) {
      throw new Error('The model returned an empty response.')
    }

    return {
      content,
      finishReason: choice?.finish_reason || 'stop',
    }
  }

  async function sendMessage(promptText) {
    const trimmedPrompt = promptText.trim()
    if (!trimmedPrompt || isLoading) return
    if (!apiKey.trim()) {
      setError('Enter your Cerebras API key first.')
      return
    }

    const nextMessages = [...messages, { role: 'user', content: trimmedPrompt }]
    setMessages(nextMessages)
    setDraft('')
    setError('')
    setIsLoading(true)

    try {
      const segments = []
      let conversationMessages = nextMessages
      let finishReason = 'stop'

      for (let attempt = 0; attempt <= MAX_AUTO_CONTINUATIONS; attempt += 1) {
        const result = await requestCompletion(conversationMessages)
        segments.push(result.content)
        finishReason = result.finishReason

        if (finishReason !== 'length') {
          break
        }

        const combinedSoFar = stitchSegments(segments)
        conversationMessages = [
          ...nextMessages,
          { role: 'assistant', content: combinedSoFar },
          { role: 'user', content: buildContinuationPrompt(combinedSoFar) },
        ]
      }

      const finalContent = stitchSegments(segments)
      const needsManualContinue = finishReason === 'length'

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: needsManualContinue
            ? `${finalContent}\n\n_The response was long and may still be truncated. Ask me to continue if you want the next section._`
            : finalContent,
        },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chat request failed.')
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: 'I could not reach Cerebras with the provided key. Please check the key, model, or browser network access and try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Portfolio Copilot</h1>
          <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">
            BYOK Cerebras chat · Portfolio-aware answers from dashboard mock data
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="#2563eb">Cerebras BYOK</Badge>
          <Badge color="#059669">Data context loaded</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard label="Strategies" value={portfolioData.strategyData.length} color="#2563eb" sub="Loaded into context" />
        <KpiCard label="Fund NAV" value={portfolioData.fundKPIs.nav} color="#059669" sub="Latest mock snapshot" />
        <KpiCard label="AUM" value={`$${portfolioData.fundKPIs.aum}M`} color="#7c3aed" sub="Current fund size" />
        <KpiCard label="Data Domains" value="6" color="#ea580c" sub="Perf · Risk · Macro · Regime · Retail · Market" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Panel>
          <PanelHeader title="Connection" subtitle="Your key stays in your browser" accent="#2563eb" />
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-[0.08em] mb-1.5">Cerebras API Key</div>
              <input
                type="password"
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder="Paste your Cerebras API key"
                className="w-full rounded-md border border-[#dbe3ef] bg-white px-3 py-2 text-[12px] text-[#334155] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-[0.08em] mb-1.5">Model</div>
              <select
                value={model}
                onChange={event => setModel(event.target.value)}
                className="w-full rounded-md border border-[#dbe3ef] bg-white px-3 py-2 text-[12px] text-[#334155] outline-none focus:border-[#2563eb]"
              >
                {MODELS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] text-[#64748b] leading-relaxed">
              The page sends your prompt and the mock portfolio context directly to Cerebras from your browser using your own key.
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Coverage" subtitle="What the assistant can read" accent="#7c3aed" />
          <div className="p-4 flex flex-wrap gap-2">
            {['Fund KPIs', 'Allocations', 'Strategy stats', 'Factor exposures', 'Correlation matrix', 'Macro data', 'Regime data', 'Return decomposition', 'Market snapshot', 'Retail metrics'].map(label => (
              <Badge key={label} color="#7c3aed">{label}</Badge>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Starter Prompts" subtitle="Quick questions to try" accent="#059669" />
          <div className="p-4 space-y-2">
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDraft(prompt)}
                className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-left text-[11px] text-[#334155] transition-colors hover:bg-[#f8fafc]"
              >
                <MessageContent content={prompt} />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Portfolio Chat"
          subtitle="Ask about performance, allocations, risk, macro, or retail participation"
          right={isLoading ? 'Thinking…' : `${messages.length} messages`}
          accent="#2563eb"
        />
        <div className="p-4 space-y-4">
          {error && (
            <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
              {error}
            </div>
          )}

          <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              return (
                <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-md px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap border"
                    style={{
                      background: isUser ? 'rgba(37,99,235,0.08)' : '#ffffff',
                      borderColor: isUser ? 'rgba(37,99,235,0.2)' : '#e2e8f0',
                      color: '#334155',
                    }}
                  >
                    {isUser ? message.content : <MessageContent content={message.content} />}
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="Ask about fund performance, allocations, correlations, macro exposure, retail conditions, or strategy behavior..."
              className="w-full min-h-[110px] rounded-md border border-[#dbe3ef] bg-white px-3 py-2 text-[12px] text-[#334155] outline-none focus:border-[#2563eb]"
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowContext(current => !current)}
                className="text-[11px] text-[#64748b] underline underline-offset-2"
              >
                {showContext ? 'Hide context preview' : 'Show context preview'}
              </button>
              <button
                type="submit"
                disabled={isLoading || !draft.trim()}
                className="px-4 py-2 rounded-md bg-[#2563eb] text-white text-[11px] font-semibold shadow-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending…' : 'Send to Cerebras'}
              </button>
            </div>
          </form>

          {showContext && (
            <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8] font-semibold mb-2">Context Preview</div>
              <pre className="text-[10px] text-[#334155] whitespace-pre-wrap overflow-auto max-h-[320px] font-mono">{portfolioContext}</pre>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
