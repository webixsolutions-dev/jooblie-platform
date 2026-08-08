import React from "react";
import { useNavigate } from "react-router-dom";

export default function EmployerCTA() {
  const navigate = useNavigate();

  const handlePostJob = () => {
    navigate("/post-a-job");
  };

  const handleContactSales = () => {
    navigate("/contact-us");
  };

  return (
    <section className="w-full bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="relative bg-slate-900 rounded-xl overflow-hidden px-6 sm:px-10 py-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-400 flex items-center justify-center shrink-0">
              {/* Building icon (was FaBuilding) */}
              <svg
                className="w-6 h-6 text-yellow-400"
                viewBox="0 0 384 512"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M336 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h96v-80c0-26.5 21.5-48 48-48s48 21.5 48 48v80h96c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zM112 288H80c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm0-128H80c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm96 128h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm0-128h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm96 128h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16zm0-128h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white text-2xl sm:text-3xl font-extrabold mb-2">
                Ready to Hire Office Talent Across Canada?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base">
                Post your job and connect with qualified office professionals
                from coast to coast.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 z-10 w-full lg:w-auto">
            <button
              onClick={handlePostJob}
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-6 py-3 rounded-md transition"
            >
              {/* Briefcase icon (was FaBriefcase) */}
              <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M184 48h144c4.4 0 8 3.6 8 8v40H176V56c0-4.4 3.6-8 8-8zm-56 8v40H64c-35.3 0-64 28.7-64 64v96h512v-96c0-35.3-28.7-64-64-64h-64V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56zM512 288H0v128c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V288z" />
              </svg>
              Post a Job
            </button>
            <button
              onClick={handleContactSales}
              className="flex items-center justify-center gap-2 border border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-md transition"
            >
              {/* Phone icon (was FaPhoneAlt) */}
              <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-35.6 76.7-97.9 140.5-176 178l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C4.9 366.5-1 378.1 1.6 389.4l24 104C28.1 504.2 38.2 512 49.6 512 296.8 512 512 302.8 512 49.6c0-11.3-7.8-21.4-18.6-25z" />
              </svg>
              Contact Sales
            </button>
          </div>

          {/* skyline decoration */}
          <svg
            className="hidden lg:block absolute right-0 bottom-0 h-full w-64 text-slate-800 opacity-60"
            viewBox="0 0 200 200"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="10" y="80" width="20" height="120" />
            <rect x="35" y="60" width="20" height="140" />
            <rect x="60" y="100" width="20" height="100" />
            <rect x="85" y="40" width="15" height="160" />
            <rect x="105" y="70" width="20" height="130" />
            <rect x="130" y="20" width="10" height="180" />
            <rect x="145" y="90" width="20" height="110" />
            <rect x="170" y="50" width="20" height="150" />
          </svg>
        </div>
      </div>
    </section>
  );
}