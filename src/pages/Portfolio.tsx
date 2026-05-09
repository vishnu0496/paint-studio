/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CONTACT_INFO, PORTFOLIO_PROJECTS } from "../constants";

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<'painting' | 'interior'>('painting');

  const handleQuery = (project: string) => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I saw your ${project} project in your portfolio and I'm interested in something similar.`, '_blank');
  };

  return (
    <div className="pt-32 pb-xl px-container-margin md:px-lg max-w-[1200px] mx-auto min-h-screen">
      <header className="mb-20 text-center">
        <h1 className="font-h1 text-h1 text-primary mb-6">Project Gallery</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Service examples for painting and interiors. Replace these sample photos with real site photos as your project collection grows.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mx-auto mb-16 shadow-inner">
        <button
          onClick={() => setActiveTab('painting')}
          className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
            activeTab === 'painting' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-500 hover:text-primary'
          }`}
        >
          Painting Projects
        </button>
        <button
          onClick={() => setActiveTab('interior')}
          className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
            activeTab === 'interior' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-500 hover:text-primary'
          }`}
        >
          Interior Projects
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'painting' ? (
          <motion.div
            key="painting"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {PORTFOLIO_PROJECTS.painting.map((project, i) => (
              <div key={project.title} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 group">
                <div className="grid grid-cols-2 h-72 md:h-96 relative">
                  <div className="relative group/before">
                    <img src={project.imageBefore} className="w-full h-full object-cover" alt="Before" />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Before</div>
                  </div>
                  <div className="relative group/after">
                    <img src={project.imageAfter} className="w-full h-full object-cover" alt="After" />
                    <div className="absolute top-4 right-4 bg-secondary text-on-secondary text-[10px] font-black uppercase px-3 py-1 rounded-full">After</div>
                  </div>
                </div>
                <div className="p-10">
                  <div className="flex items-center gap-3 text-secondary mb-4">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span className="text-xs font-black uppercase tracking-widest">{project.location}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-4">{project.title}</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed italic border-l-2 border-primary/20 pl-6">{project.description}</p>
                  <button 
                    onClick={() => handleQuery(project.title)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-3"
                  >
                    Ask for Similar Work
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="interior"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {PORTFOLIO_PROJECTS.interior.map((project, i) => (
              <div key={project.title} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 flex flex-col group h-full">
                <div className="aspect-[4/3] overflow-hidden relative">
                   <img 
                     src={project.image} 
                     alt={project.title} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm">
                     {project.type}
                   </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                   <div className="flex items-center gap-2 text-gray-400 mb-2">
                     <span className="material-symbols-outlined text-sm">location_on</span>
                     <span className="text-[10px] font-bold uppercase tracking-wider">{project.location}</span>
                   </div>
                   <h3 className="text-xl font-bold text-primary mb-4">{project.title}</h3>
                   <div className="bg-gray-50 p-4 rounded-xl mb-8 flex-grow">
                     <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Materials Used</span>
                     <p className="text-xs text-gray-700 leading-relaxed font-bold">{project.materials}</p>
                   </div>
                   <button 
                    onClick={() => handleQuery(project.title)}
                    className="w-full border-2 border-primary/20 text-primary py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2"
                   >
                     Ask for Similar Work
                     <span className="material-symbols-outlined text-sm">visibility</span>
                   </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
