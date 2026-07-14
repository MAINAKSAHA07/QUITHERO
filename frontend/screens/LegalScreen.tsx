import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Scale, ShieldCheck, HeartPulse, Trash2 } from 'lucide-react'

interface LegalScreenProps {
  initialType?: 'terms' | 'privacy'
}

export default function LegalScreen({ initialType = 'terms' }: LegalScreenProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialType)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 md:px-8 bg-gradient-to-b from-[#f4f8fa] to-[#e5ecef]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/60 border border-white/40 flex items-center justify-center text-text-primary hover:bg-white/80 active:scale-95 transition-all shadow-glass"
            aria-label="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">
              smono Legal Agreements
            </h1>
            <p className="text-xs text-text-primary/60">Last updated: July 2026</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/40 border border-white/20 rounded-xl mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-text-primary/70 hover:text-text-primary hover:bg-white/20'
            }`}
          >
            <Scale className="w-4 h-4" />
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-text-primary/70 hover:text-text-primary hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Privacy Policy
          </button>
        </div>

        {/* Content Box */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 md:p-8 text-text-primary/95 leading-relaxed"
        >
          {activeTab === 'terms' ? (
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <HeartPulse className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-lg font-bold text-text-primary">1. Health Disclaimer</h2>
                </div>
                <p className="text-sm text-text-primary/80">
                  smono provides educational, self-guided Cognitive Behavioral Therapy (CBT) modules, trigger mapping dashboards, and breathing countdown guides designed to assist you in resetting habits. 
                  <strong> smono is NOT a licensed medical care provider</strong>, and the app is not a medical device, diagnosis system, or therapeutic program. 
                  Do not ignore professional medical advice or delay seeking therapy/medical treatment because of insights obtained within this app.
                </p>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <h2 className="text-base font-bold text-text-primary mb-2">2. User Accounts & Authentications</h2>
                <p className="text-sm text-text-primary/80">
                  You are responsible for protecting your account passwords and social OAuth credentials used to access smono. 
                  You agree to provide true and accurate information during language configuration, onboarding checklists, and KYC profiling.
                </p>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <h2 className="text-base font-bold text-text-primary mb-2">3. Acceptable Use Guidelines</h2>
                <p className="text-sm text-text-primary/80">
                  You agree to use smono's journal entry tools, trigger trackers, and peer circles in good faith. 
                  Misusing these systems, uploading malicious code, or trying to bypass PocketBase security configurations is strictly prohibited.
                </p>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <h2 className="text-base font-bold text-text-primary mb-2">4. Subscriptions & Billing</h2>
                <p className="text-sm text-text-primary/80">
                  Payment for premium modules or one-time resets is processed securely. 
                  Refunds are subject to standard App Store/billing provider rules, and smono does not promise refunds for partially completed 30-day program timelines.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-lg font-bold text-text-primary">1. Data We Collect</h2>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-sm text-text-primary/80">
                  <li>
                    <strong>Profile details:</strong> Email address, language, and onboarding settings.
                  </li>
                  <li>
                    <strong>KYC & Onboarding Responses:</strong> Habits (pack cost, daily count), quit readiness scores, support levels, and relapse risk ratings.
                  </li>
                  <li>
                    <strong>Activity Logs:</strong> Cravings, mapped triggers (e.g. stress, social, habit), breathing exercises completed, and daily CBT progress logs.
                  </li>
                  <li>
                    <strong>Mindful Journals:</strong> Reflection text entries written during open question modules.
                  </li>
                </ul>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <h2 className="text-base font-bold text-text-primary mb-2">2. How We Use Your Data</h2>
                <p className="text-sm text-text-primary/80">
                  smono uses your inputs solely to personalize your recovery plan, compute archetype statistics, draw heatmap statistics, and provide interactive breathing exercise timing metrics. Your logs are saved securely inside our encrypted PocketBase instance.
                </p>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <h2 className="text-base font-bold text-text-primary mb-2">3. Security & Hosting</h2>
                <p className="text-sm text-text-primary/80">
                  All communications between the frontend app and backend services are encrypted via TLS. 
                  We implement robust database view and field validation rules (e.g. user association security) to prevent unauthorized listings.
                </p>
              </section>

              <hr className="border-text-primary/10" />

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-5 h-5 text-error" />
                  <h2 className="text-base font-bold text-text-primary">4. Data Deletion Right</h2>
                </div>
                <p className="text-sm text-text-primary/80">
                  You retain absolute control over your personal data.
                  You can request permanent deletion of your profile and all associated data at any time using the
                  &quot;Request account deletion&quot; option in your profile settings. Your request is sent to our
                  team for review and processing; deletion is not immediate.
                </p>
              </section>
            </div>
          )}
        </motion.div>

        {/* Support Disclaimer */}
        <p className="text-center text-xs text-text-primary/50 mt-8">
          Have questions about our legal policies? Contact us at support@smono.com
        </p>
      </div>
    </div>
  )
}
