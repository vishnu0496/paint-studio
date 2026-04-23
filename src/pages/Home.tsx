/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { CONTACT_INFO, PACKAGES, TESTIMONIALS } from "../constants";
import { Link } from "react-router-dom";

export default function Home() {
  const handleQuote = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'd like to get a quote for a complete home interior project.`, '_blank');
  };

  const handlePackageInquiry = (packageTitle: string) => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'm interested in the ${packageTitle}. Can you provide more details?`, '_blank');
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            alt="Modern home interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/45 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-container-margin md:px-lg text-white">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-on-secondary font-label-md mb-6 uppercase tracking-widest text-xs">
              Quality Guaranteed Since 2016
            </span>
            <h1 className="font-h1 text-h1 md:text-6xl mb-6 leading-tight">
              Darsi's Most Trusted <span className="text-secondary-container">Interior Experts</span>
            </h1>
            <p className="font-body-lg text-lg md:text-xl mb-10 opacity-90 leading-relaxed">
              From walls to woodwork — JSW Paints, Modular Kitchens, Wardrobes, TV Units, Mirror Work and complete home interiors. Serving Darsi and surrounding areas since 2016.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/visualizer"
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-label-md text-center hover:scale-105 active:scale-95 transition-all shadow-lg font-bold"
              >
                Try Paint Visualizer
              </Link>
              <button 
                onClick={handleQuote}
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-label-md text-center hover:bg-white/20 transition-all font-bold"
              >
                Get a Free Quote
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-container-margin md:px-lg text-center">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="mb-12"
          >
            <h2 className="font-h2 text-h2 text-primary mb-4">India's Smartest Choice</h2>
            <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
              We exclusively use JSW Paints — India's smartest and safest paint solutions.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-70">
             <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary font-bold">eco</span>
                <span className="font-label-md text-xs uppercase tracking-wider font-bold">Eco-Friendly</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary font-bold">clean_hands</span>
                <span className="font-label-md text-xs uppercase tracking-wider font-bold">Odorless</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary font-bold">verified</span>
                <span className="font-label-md text-xs uppercase tracking-wider font-bold">Best Finish</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary font-bold">shield_check</span>
                <span className="font-label-md text-xs uppercase tracking-wider font-bold">Max Durability</span>
             </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-container-margin md:px-lg">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              {
                icon: "verified",
                title: "Only JSW Paints",
                desc: "We exclusively use premium JSW Paints for superior quality and durability."
              },
              {
                icon: "home_repair_service",
                title: "Complete Interior Solution",
                desc: "From painting to modular kitchen to wardrobes — one team for your entire home."
              },
              {
                icon: "assignment_turned_in",
                title: "Free Home Visit",
                desc: "Our expert visits your home and gives you a detailed quote at zero cost."
              }
            ].map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl text-secondary">{point.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-primary mb-4">{point.title}</h3>
                <p className="text-gray-600 leading-relaxed">{point.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-container-margin md:px-lg">
          <div className="text-center mb-16">
            <h2 className="font-h2 text-h2 text-primary mb-4">Choose Your Package</h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-4"></div>
            <p className="text-gray-600">Premium home solutions tailored to your needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all h-full"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl text-primary">{pkg.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">{pkg.title}</h3>
                <p className="text-gray-600 mb-8 flex-grow">{pkg.description}</p>
                <div className="mb-8 pt-6 border-t border-gray-100 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase tracking-widest mb-1 font-bold">Starts From</span>
                  <span className="text-4xl font-black text-secondary">{pkg.price}</span>
                </div>
                <button
                  onClick={() => handlePackageInquiry(pkg.title)}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  Book via WhatsApp
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-12 italic tracking-tighter">
            * All prices vary based on home size and requirements. Contact us for a free quote.
          </p>
        </div>
      </section>

      {/* Visualizer CTA */}
      <section className="py-xl bg-primary text-white overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto px-container-margin md:px-lg grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-h2 text-h2 mb-6">See the Color on your Walls Before You Paint</h2>
            <p className="font-body-lg mb-8 opacity-80 leading-relaxed">
              Why guess when you can visualize? Upload a photo of your room and experiment with 150+ real JSW Paints shades in real-time. Our advanced visualizer captures textures and shadows for a realistic preview.
            </p>
            <Link 
              to="/visualizer"
              className="inline-flex items-center gap-4 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-label-md hover:scale-105 transition-all shadow-lg font-bold"
            >
              Start Visualizing Now
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white/10">
               <img 
                 src="https://images.unsplash.com/photo-1544450542-c5a77a444ff9?auto=format&fit=crop&q=80&w=1000" 
                 alt="Visualizer Demo" 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-secondary/30 mix-blend-multiply"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-container-margin md:px-lg">
          <div className="text-center mb-16">
            <h2 className="font-h2 text-h2 text-primary mb-4">What Our Customers Say</h2>
            <div className="w-20 h-1 bg-secondary mx-auto mb-4"></div>
            <p className="text-gray-600">Rated homeowners across Darsi and Prakasam District</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 p-8 rounded-3xl border border-primary/5 shadow-sm relative overflow-hidden group"
              >
                <div className="flex gap-1 text-secondary mb-4">
                   {Array.from({ length: testimonial.rating }).map((_, j) => (
                     <span key={j} className="material-symbols-outlined text-sm filled">star</span>
                   ))}
                </div>
                <p className="text-gray-700 italic mb-8 leading-relaxed relative z-10">"{testimonial.quote}"</p>
                <div className="relative z-10">
                  <h4 className="font-bold text-primary">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{testimonial.area}</p>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-primary/5 select-none transform rotate-12 transition-transform group-hover:rotate-0">format_quote</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
