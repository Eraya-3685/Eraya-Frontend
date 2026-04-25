import React from 'react';
import { Globe, Share2, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-primary-container uppercase tracking-tighter mb-6 font-display">Eraya</h3>
            <p className="text-slate-500 leading-relaxed max-w-sm mb-6 font-body">
              Redefining the digital shopping experience through precision, clarity, and curated excellence for the modern minimalist.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Globe className="w-5 h-5 text-slate-400" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Share2 className="w-5 h-5 text-slate-400" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                <Mail className="w-5 h-5 text-slate-400" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-primary mb-6">Collections</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Women's Wear</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Men's Wear</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Home Tech</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Limited Drop</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sustainability</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Journal</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-6">Support</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Shipping</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-6">Contact</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li>concierge@eraya.com</li>
              <li>+1 (800) 245-1990</li>
              <li>NYC Showroom</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">© 2024 Eraya Digital Flagship. All rights reserved.</p>
          <div className="flex gap-8 text-slate-500 text-sm">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
