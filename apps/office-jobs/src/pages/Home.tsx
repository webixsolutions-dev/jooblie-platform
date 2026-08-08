import Navbar from '../components/common/Navbar'
import Hero from '../components/home/Hero'
import WhyChoose from '../components/home/WhyChooseUs'
import HowItWorks from '../components/home/HowItsWorks'
import CareerSupport from '../components/home/CareerSupport'
import HomeCTA from '../components/home/HomeCTA'


export default function Home() {
  return (
    <>
    <Navbar/>
      <Hero />
       <WhyChoose />
       <HowItWorks />
    <CareerSupport /> 
     <HomeCTA />  
    </>
  )
}