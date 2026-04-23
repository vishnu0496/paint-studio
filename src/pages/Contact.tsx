/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { CONTACT_INFO } from "../constants";
import { FormEvent } from "react";

export default function Contact() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name');
    const service = formData.get('service');
    const town = formData.get('town');
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'm ${name} from ${town}. I'm interested in ${service}. Can we schedule a site visit?`, '_blank');
  };

  return (
    <div className="pt-32 pb-xl px-container-margin md:px-lg max-w-[1200px] mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-start">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <div className="inline-block bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Expert Consultations</div>
          <h1 className="font-h1 text-h1 text-primary mb-md">Get in Touch</h1>
          <p className="font-body-lg text-on-surface-variant mb-xl leading-relaxed">
            Ready to transform your home? Book a free site visit or chat with our experts in Darsi and Prakasam District today.
          </p>

          <div className="space-y-8">
            <div className="group flex items-start gap-md">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">location_on</span>
               </div>
               <div>
                  <h4 className="font-black text-primary mb-xs uppercase text-xs tracking-wider">Showroom Address</h4>
                  <p className="font-body-md text-on-surface-variant text-sm pr-12">Main Road, Darsi, Prakasam District, Andhra Pradesh 523247</p>
               </div>
            </div>

            <div className="group flex items-start gap-md">
               <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 group-hover:bg-secondary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">call</span>
               </div>
               <div>
                  <h4 className="font-black text-primary mb-xs uppercase text-xs tracking-wider">Call Us</h4>
                  <p className="font-body-md text-on-surface-variant font-black">{CONTACT_INFO.phone}</p>
               </div>
            </div>

            <div className="group flex items-start gap-md">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">mail</span>
               </div>
               <div>
                  <h4 className="font-black text-primary mb-xs uppercase text-xs tracking-wider">Email</h4>
                  <p className="font-body-md text-on-surface-variant text-sm font-bold opacity-80">{CONTACT_INFO.email}</p>
               </div>
            </div>
          </div>

          <div className="mt-16 p-8 bg-primary text-white rounded-[32px] shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-4">Quick WhatsApp Chat?</h4>
                <button 
                  onClick={() => window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I have a quick question.`, '_blank')}
                  className="bg-white text-primary px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                   Chat on WhatsApp
                   <span className="material-symbols-outlined text-sm">chat</span>
                </button>
             </div>
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-100 p-10 rounded-[32px] shadow-2xl"
        >
          <h2 className="text-2xl font-black text-primary mb-8 uppercase tracking-tighter">Schedule a Site Visit</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="name">Full Name</label>
                  <input 
                    required
                    name="name"
                    id="name"
                    type="text" 
                    placeholder="Enter your name"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="phone">Phone Number</label>
                  <input 
                    required
                    name="phone"
                    id="phone"
                    type="tel" 
                    placeholder="+91 00000 00000"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  />
               </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="town">Town / Area</label>
                  <select 
                    required
                    name="town"
                    id="town"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                  >
                     <option value="Darsi">Darsi</option>
                     <option value="Markapur">Markapur</option>
                     <option value="Giddalur">Giddalur</option>
                     <option value="Kandukur">Kandukur</option>
                     <option value="Ongole">Ongole</option>
                     <option value="Chirala">Chirala</option>
                     <option value="Narasaraopet">Narasaraopet</option>
                     <option value="Vinukonda">Vinukonda</option>
                     <option value="Nellore">Nellore</option>
                     <option value="Kurnool">Kurnool</option>
                     <option value="Guntur">Guntur</option>
                     <option value="Prakasam District">Prakasam District</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="service">Service Interested In</label>
                  <select 
                    required
                    name="service"
                    id="service"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                  >
                   <option value="Interior Painting">Interior Painting</option>
                   <option value="Exterior Painting">Exterior Painting</option>
                   <option value="Waterproofing">Waterproofing</option>
                   <option value="Texture Work">Texture Work</option>
                   <option value="Modular Kitchen">Modular Kitchen</option>
                   <option value="Wardrobes and Cupboards">Wardrobes and Cupboards</option>
                   <option value="TV Unit">TV Unit</option>
                   <option value="Complete Home Interiors">Complete Home Interiors</option>
                   <option value="Full Home Package">Full Home Package</option>
                   <option value="Not Sure - Need Consultation">Not Sure - Need Consultation</option>
                </select>
              </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest" htmlFor="message">Message (Optional)</label>
                <textarea 
                  name="message"
                  id="message"
                  rows={4}
                  placeholder="Tell us about your home transformation..."
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                ></textarea>
             </div>
             <button 
               type="submit"
               className="w-full bg-secondary text-on-secondary py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-6 flex items-center justify-center gap-3"
             >
                Request Free Site Assessment
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
             </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
