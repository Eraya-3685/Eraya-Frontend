import React, { useEffect } from 'react';
import { Globe, Share2, Mail, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSettingsStore from '../store/useSettingsStore';

const Footer = () => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-20 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-card rounded-t-[3rem] rounded-b-none p-12 md:p-16 border-b-0">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-display">ERAYA</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
                Redefining the digital shopping experience through precision, clarity, and curated excellence for the modern minimalist.
              </p>
              <div className="flex gap-4">
                {[Globe, Share2, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-11 h-11 glass-card-light flex items-center justify-center hover:bg-indigo-600 transition-all duration-500 hover:-translate-y-1">
                    <Icon className="w-5 h-5 text-slate-300" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="section-label">Collections</h4>
              <ul className="space-y-4 text-slate-400 text-xs font-bold">
                <li><Link to="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Best Sellers</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Exclusive Deals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="section-label">Company</h4>
              <ul className="space-y-4 text-slate-400 text-xs font-bold">
                <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
                <li><Link to="/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="section-label">Support</h4>
              <ul className="space-y-4 text-slate-400 text-xs font-bold">
                <li><Link to="/faq" className="hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">Returns</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <button 
                onClick={scrollToTop}
                className="w-14 h-14 glass-card-light flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-xl"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">© 2026 Eraya Digital Flagship. All rights reserved.</p>
            <div className="flex gap-8 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
