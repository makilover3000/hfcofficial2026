import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Eye, AlertTriangle, Shield, CheckCircle, Building2, Users, FileDown, ChevronRight } from 'lucide-react';

const PAGES = [
  {
    title: 'The Problem',
    subtitle: 'Why This Matters',
    content: [
      {
        icon: Building2,
        color: 'text-cyan-400',
        heading: 'HDB Construction Sites Running Simultaneously',
        text: 'Singapore has hundreds of active construction sites near residential blocks. Each generates noise (up to 94dB) and dust (PM2.5) that directly impacts residents.',
      },
      {
        icon: Users,
        color: 'text-amber-400',
        heading: '27,600 Noise Complaints in 2022 Alone',
        text: 'That\'s 5x pre-COVID levels. Currently, no system coordinates across sites — each operates independently, creating compounded environmental impact on the same residents.',
      },
      {
        icon: AlertTriangle,
        color: 'text-red-400',
        heading: 'No District-Level Coordination Exists',
        text: 'When 3 sites near the same HDB block all pile-drive at once, residents suffer cumulative noise far beyond what any single site produces. Town Councils have zero visibility into this.',
      },
    ],
  },
  {
    title: 'My Solution',
    subtitle: 'How Agentic AI Solves This',
    content: [
      {
        icon: Eye,
        color: 'text-blue-400',
        heading: '1. Perception Agent — Detects Violations',
        text: 'Monitors all sites every 5 seconds. When noise exceeds 85dB or dust exceeds 50 \u00b5g/m\u00b3, it flags the site instantly. Uses real-time data from NEA sensors.',
      },
      {
        icon: AlertTriangle,
        color: 'text-green-400',
        heading: '2. Risk Agent — Assesses Cumulative Impact',
        text: 'Calculates how many HDB residents are affected by combining noise/dust from all nearby sites. Factors in wind direction, adjacent site schedules, and population density.',
      },
      {
        icon: Shield,
        color: 'text-orange-400',
        heading: '3. Control Agent — Acts Autonomously',
        text: 'Issues directives WITHOUT human intervention: staggers piling schedules, reduces equipment intensity, activates dust suppression. Example: reduces piling from 92dB to 62dB.',
      },
      {
        icon: CheckCircle,
        color: 'text-emerald-400',
        heading: '4. Verification Agent — Confirms It Worked',
        text: 'Measures actual reduction achieved (e.g., 29% noise drop) and logs the outcome. If the intervention didn\'t work, it escalates to the Town Council.',
      },
    ],
  },
  {
    title: 'The Platform',
    subtitle: 'What You Can Do Here',
    content: [
      {
        icon: Zap,
        color: 'text-cyan-400',
        heading: 'Map Tab — Live Site Monitoring',
        text: 'See all real HDB construction sites with severity-coded glow auras (green/yellow/red). Click any site to zoom in, view details, and manually adjust equipment levels.',
      },
      {
        icon: Eye,
        color: 'text-blue-400',
        heading: 'Orchestration Tab — Watch AI Coordinate',
        text: 'Press "Start Demo" to watch the full autonomous cycle: a site spikes \u2192 AI detects \u2192 coordinates across 3 sites \u2192 mitigates \u2192 verifies. Zero human clicks needed.',
      },
      {
        icon: Shield,
        color: 'text-amber-400',
        heading: 'Town Council Tab — Human Oversight',
        text: 'AI acts first to protect residents, then Town Council can approve or override decisions. Downloadable CSV reports for compliance auditing.',
      },
      {
        icon: FileDown,
        color: 'text-emerald-400',
        heading: 'Analytics Tab — District Metrics',
        text: 'Cluster-level analytics, severity distribution, and real-time environmental data from data.gov.sg (PM2.5, wind, rainfall).',
      },
    ],
  },
];

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);
  const [page, setPage] = useState(0);

  if (!visible) return null;

  const currentPage = PAGES[page];
  const isLastPage = page === PAGES.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-[720px] max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {/* Header */}
            <div className="shrink-0 px-8 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-cyan-400">UrbanPulse</span> AI
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  HFC 2026
                </span>
              </div>
              <p className="text-sm text-slate-400">
                How can Agentic AI improve urban liveability and environmental outcomes at a district level?
              </p>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0">

            {/* Page indicator */}
            <div className="px-8 pb-4 flex items-center gap-4">
              {PAGES.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    i === page
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === page ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {i + 1}
                  </span>
                  {p.title}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="px-8 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                    {currentPage.subtitle}
                  </p>

                  <div className="space-y-4">
                    {currentPage.content.map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                      >
                        <div className={`mt-0.5 ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white mb-1">{item.heading}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-8 py-4 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {page + 1} of {PAGES.length}
              </p>
              <div className="flex items-center gap-3">
                {page > 0 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    Back
                  </button>
                )}
                {isLastPage ? (
                  <button
                    onClick={() => setVisible(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
                  >
                    Enter Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
