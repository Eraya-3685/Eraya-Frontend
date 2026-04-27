import React, { useEffect } from 'react';
import { Globe, Share2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSettingsStore from '../store/useSettingsStore';

const Footer = () => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-10">
          <div className="md:col-span-2">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter mb-4 font-display">Eraya</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6 font-body">
              Redefining the digital shopping experience through precision, clarity, and curated excellence for the modern minimalist.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Globe className="w-4 h-4 text-slate-400" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Share2 className="w-4 h-4 text-slate-400" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Mail className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Collections</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li><Link to="/products" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Deals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Company</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Support</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li><Link to="/faq" className="hover:text-primary transition-colors">Shipping</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold">
              <li>{settings?.store_email || 'support@eraya.com'}</li>
              <li>{settings?.store_phone || '+880 1700-000000'}</li>
              <li>{settings?.store_address || 'Dhaka, BD'}</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 Eraya Digital flagship. All rights reserved.</p>
          <div className="flex gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
