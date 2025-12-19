import { useState } from 'react'
import { Search, Book, HelpCircle, Keyboard, FileText, Video, MessageSquare, ChevronRight } from 'lucide-react'

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    questions: [
      {
        q: 'How do I access the admin dashboard?',
        a: 'Navigate to /admin/login and use your admin credentials. If you don\'t have an account, contact your system administrator.',
      },
      {
        q: 'What is the default admin password?',
        a: 'There is no default password. Admin accounts must be created by a super admin. Contact your system administrator for access.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click on "Forgot Password" on the login page, or contact your system administrator to reset your password.',
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    icon: HelpCircle,
    questions: [
      {
        q: 'How do I add a new user?',
        a: 'Go to Users > All Users and click "Add User". Fill in the required information and save.',
      },
      {
        q: 'Can I bulk import users?',
        a: 'Yes, you can export the user template CSV, fill it in, and import it back through the "Import CSV" button.',
      },
      {
        q: 'How do I deactivate a user?',
        a: 'Go to the user\'s detail page and toggle the status to "Inactive", or use bulk actions in the All Users page.',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content Management',
    icon: FileText,
    questions: [
      {
        q: 'How do I create a new program?',
        a: 'Go to Content > Programs and click "Create Program". Fill in the program details, then add program days and steps.',
      },
      {
        q: 'Can I duplicate a program?',
        a: 'Yes, click the duplicate icon on any program card to create a copy that you can then modify.',
      },
      {
        q: 'How do I upload media files?',
        a: 'Go to Content > Media Library and click "Upload". You can drag and drop files or select them from your computer.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: MessageSquare,
    questions: [
      {
        q: 'How do I export user data?',
        a: 'Go to Users > All Users, select the users you want to export, and click "Export CSV".',
      },
      {
        q: 'Can I create custom reports?',
        a: 'Yes, go to Analytics > Custom Reports and use the report builder to create custom reports with your desired metrics.',
      },
      {
        q: 'What metrics are available?',
        a: 'You can view user analytics, engagement metrics, program performance, retention reports, and create custom reports.',
      },
    ],
  },
]

const keyboardShortcuts = [
  { keys: ['⌘', 'K'], description: 'Open global search' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['⌘', 'N'], description: 'Create new item (context-dependent)' },
  { keys: ['⌘', 'S'], description: 'Save current form' },
  { keys: ['⌘', 'E'], description: 'Export current view' },
  { keys: ['⌘', 'F'], description: 'Focus search/filter' },
  { keys: ['Esc'], description: 'Close modal/dialog' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
]

const documentationSections = [
  {
    title: 'User Guide',
    description: 'Complete guide to managing users, programs, and content',
    icon: Book,
    link: '#',
  },
  {
    title: 'API Documentation',
    description: 'REST API reference and integration guides',
    icon: FileText,
    link: '#',
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for common tasks',
    icon: Video,
    link: '#',
  },
  {
    title: 'Release Notes',
    description: 'Latest updates and feature announcements',
    icon: MessageSquare,
    link: '#',
  },
]

export const Help = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0 || !searchQuery)

  return (
    <div className="space-y-6">
      <div>
      <h1 className="text-3xl font-bold text-neutral-dark">Help & Resources</h1>
        <p className="text-neutral-500 mt-1">Find answers, documentation, and support resources</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search help articles, FAQs, and documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {documentationSections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={section.title}
              className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">{section.title}</h3>
              <p className="text-sm text-neutral-500 mb-4">{section.description}</p>
              <button className="text-primary text-sm font-medium flex items-center gap-1">
                View <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-dark">Frequently Asked Questions</h2>
        {filteredCategories.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategory === category.id
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-card overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-neutral-dark">{category.title}</h3>
                    <p className="text-sm text-neutral-500">{category.questions.length} questions</p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-neutral-200">
                  {category.questions.map((faq, idx) => {
                    const isQExpanded = expandedQuestion === `${category.id}-${idx}`
                    return (
                      <div key={idx} className="border-b border-neutral-100 last:border-b-0">
                        <button
                          onClick={() => setExpandedQuestion(isQExpanded ? null : `${category.id}-${idx}`)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                        >
                          <span className="font-medium text-neutral-dark">{faq.q}</span>
                          <ChevronRight
                            className={`w-4 h-4 text-neutral-400 transition-transform ${isQExpanded ? 'transform rotate-90' : ''}`}
                          />
                        </button>
                        {isQExpanded && (
                          <div className="p-4 pt-0 text-sm text-neutral-600 bg-neutral-50">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-dark">Keyboard Shortcuts</h2>
            <p className="text-sm text-neutral-500">Speed up your workflow with these shortcuts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyboardShortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
              <span className="text-sm text-neutral-600">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <span key={keyIdx}>
                    {keyIdx > 0 && <span className="text-neutral-400 mx-1">+</span>}
                    <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-mono">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-primary rounded-lg shadow-card p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
        <p className="mb-4 opacity-90">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex items-center gap-4">
          <button className="bg-white text-primary px-4 py-2 rounded-lg font-medium hover:bg-neutral-100 transition-colors">
            Contact Support
          </button>
          <button className="border border-white/30 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  )
}
