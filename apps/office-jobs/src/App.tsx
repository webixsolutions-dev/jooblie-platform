import { useLocation } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
// import ScrollToTop from './components/common/ScrollToTop'
import AppRoutes from './routes/Approutes'

// Auth pages list (keep in sync with AppRoutes)
const AUTH_PAGES: string[] = ['/signin', '/signup', '/register']

function App() {
  const location = useLocation()
  const isAuthPage = AUTH_PAGES.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fb]">
      {!isAuthPage && <Navbar />}
      {/* <ScrollToTop /> */}
      <main className="flex-1">
        <AppRoutes />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}

export default App