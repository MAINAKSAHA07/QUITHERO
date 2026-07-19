import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './LandingPage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { LegalPage } from './pages/LegalPage'
import { AboutPage } from './pages/AboutPage'
import { MARKETING_ROUTES } from './pages/marketing'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        {MARKETING_ROUTES.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
      </Routes>
    </BrowserRouter>
  )
}
