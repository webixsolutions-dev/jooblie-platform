import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home'
// import Browse from '../pages/Browse'
import Employers from '../pages/Employers'
// import PostJob from '../pages/PostJob'
import AboutUs from '../pages/AboutUs'
// import ContactUs from '../pages/ContactUs'
// import SignIn from '../pages/auth/SignIn'
// import SignUp from '../pages/auth/SignUp'
// import Pricing from '../components/employers/Pricing'


const AUTH_PAGES: string[] = ['/signin', '/signup', '/register']

function AppRoutes() {
    const location = useLocation()
    const isAuthPage = AUTH_PAGES.includes(location.pathname)

    return (
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            {/* <Route path="/browse" element={<Browse />} /> */}
            <Route path="/employers" element={<Employers />} />
            {/* <Route path="/post-a-job" element={<PostJob />} />*/}
            <Route path="/about-us" element={<AboutUs />} />
            {/*   <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pricing" element={<Pricing />} /> */}
        </Routes>
    )
}

export default AppRoutes