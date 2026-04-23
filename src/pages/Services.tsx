/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { SERVICES, CONTACT_INFO } from "../constants";

export default function Services() {
  const handleConsultation = (service: string) => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'm interested in your ${service} service.`, '_blank');
  };

  const paintingServices = SERVICES.filter(s => s.category === 'painting');
  const interiorServices = SERVICES.filter(s => s.category === 'interior');

  return (
    <div className="pt-32 pb-xl px-container-margin md:px-lg max-w-[1200px] mx-auto">
      <header className="mb-24 text-center">
        <h1 className="font-h1 text-h1 text-primary mb-6">Our Expert Solutions</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
          From premium JSW painting to custom woodwork — we provide complete home interior transformations across Darsi and surrounding areas.
        </p>
      </header>

      {/* Painting Services */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Painting Services</h2>
          <div className="flex-grow h-[2px] bg-secondary/20"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paintingServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-100 p-8 rounded-3xl hover:shadow-xl transition-all group shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">{service.icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">{service.title}</h3>
              <p className="font-body text-gray-600 mb-8 leading-relaxed italic border-l-4 border-secondary/30 pl-4">{service.description}</p>
              <button 
                onClick={() => handleConsultation(service.title)}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all text-sm"
              >
                Get Expert Advice
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interior Services */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Woodwork & Interiors</h2>
          <div className="flex-grow h-[2px] bg-secondary/20"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {interiorServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-100 p-8 rounded-3xl hover:shadow-xl transition-all group shadow-sm flex flex-col"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">{service.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{service.title}</h3>
              <p className="font-body text-gray-600 mb-8 leading-relaxed text-sm flex-grow">{service.description}</p>
              <button 
                onClick={() => handleConsultation(service.title)}
                className="w-full border border-primary text-primary px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all text-sm mt-auto"
              >
                Inquire Now
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="p-12 rounded-[40px] bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="relative z-10">
           <h3 className="text-3xl font-bold mb-2">Need a custom plan?</h3>
           <p className="opacity-80">Our experts will visit your site for a free assessment and shade selection.</p>
        </div>
        <button 
          onClick={() => handleConsultation('Full Site Assessment')}
          className="relative z-10 bg-secondary-container text-on-secondary-container px-10 py-5 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all text-lg shadow-xl"
        >
          Book Free Site Visit
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </section>
    </div>
  );
}
