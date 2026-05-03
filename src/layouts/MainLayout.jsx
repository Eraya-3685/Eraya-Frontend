import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col relative bg-[#020617]">
      {/* Dynamic Background Elements */}
      <div className="orb-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      
      {/* Realism Texture Overlay */}
      <div className="noise-overlay" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {!isAuthPage && <Navbar />}
        
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-grow ${!isAuthPage ? 'pt-20' : ''}`}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {!isAuthPage && <Footer />}
        {!isAuthPage && <ChatWidget />}
      </div>
    </div>
  );
};

export default MainLayout;
