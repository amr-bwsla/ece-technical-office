import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { NotFound } from './components/ui'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Projects = lazy(() => import('./pages/Projects'))
const NewProject = lazy(() => import('./pages/NewProject'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Inquiries = lazy(() => import('./pages/Inquiries'))
const NewInquiry = lazy(() => import('./pages/NewInquiry'))
const InquiryDetail = lazy(() => import('./pages/InquiryDetail'))
const Submittals = lazy(() => import('./pages/Submittals'))
const NewSubmittal = lazy(() => import('./pages/NewSubmittal'))
const SubmittalDetail = lazy(() => import('./pages/SubmittalDetail'))
const Contracts = lazy(() => import('./pages/Contracts'))
const NewContract = lazy(() => import('./pages/NewContract'))
const ContractDetail = lazy(() => import('./pages/ContractDetail'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Workflows = lazy(() => import('./pages/Workflows'))
const Reports = lazy(() => import('./pages/Reports'))

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<NewProject />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/new" element={<NewInquiry />} />
          <Route path="inquiries/:id" element={<InquiryDetail />} />
          <Route path="submittals" element={<Submittals />} />
          <Route path="submittals/new" element={<NewSubmittal />} />
          <Route path="submittals/:id" element={<SubmittalDetail />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/new" element={<NewContract />} />
          <Route path="contracts/:id" element={<ContractDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
