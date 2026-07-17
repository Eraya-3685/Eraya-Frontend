import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';
import AIChatBot from '../components/AIChatBot';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaQuery from '../hooks/useMediaQuery';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { isMobile } = useMediaQuery();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ flexGrow: 1, paddingTop: isMobile ? '4rem' : '4.5rem' }}
        >
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: isMobile ? '1rem 0.85rem 4rem' : '1.5rem 1.5rem 5rem',
          }}>
            {children}
          </div>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <AIChatBot />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
