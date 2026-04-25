import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Recycle, Globe, Shield } from 'lucide-react';

const Sustainability = () => {
  return (
    <div className="pb-24">
      <section className="relative h-[400px] overflow-hidden bg-slate-900 flex items-center justify-center text-center px-6">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1280&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Sustainability"
        />
        <div className="relative z-10 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white font-display mb-6"
          >
            Conscious Excellence
          </motion.h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Our commitment to the planet is as strong as our commitment to quality. Discover how Eraya is redefining luxury through responsibility.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-4 block">Our Philosophy</span>
            <h2 className="text-4xl font-bold text-primary-container mb-6 font-display">Minimalism with Meaning</h2>
            <p className="text-slate-500 leading-loose mb-8">
              At Eraya, we believe that true luxury shouldn't come at the cost of our environment. Every product in our collection is selected based on its lifecycle, material source, and the ethics of its production.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">Eco-Materials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <Recycle className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">Circular Flow</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            <img src="https://images.unsplash.com/photo-1558449028-b53a39d100fc?q=80&w=800&auto=format&fit=crop" alt="Eco production" />
          </motion.div>
        </div>

        <section className="bg-slate-50 rounded-[40px] p-16 text-center">
          <h2 className="text-3xl font-bold mb-16">Our Global Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">94%</div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Recycled Packaging</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Carbon Neutral Shipping</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50k+</div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Trees Planted Globally</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sustainability;
