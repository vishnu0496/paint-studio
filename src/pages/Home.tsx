import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { CONTACT_INFO } from "../constants";
import { Link, useNavigate } from "react-router-dom";
import { Maximize, Palette, Box, Star, ChevronRight, ArrowRight, ShieldCheck, Zap, Heart, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  const handleQuote = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'd like to get a quote for a complete home interior project.`, '_blank');
  };

  return (
    <div className="bg-primary min-h-screen text-white selection:bg-accent selection:text-white pb-0 font-sans cursor-none">
      
      {/* Senior Detail: Custom Cursor */}
      <motion.div 
        className="custom-cursor hidden lg:block"
        animate={{ x: cursorPos.x - 10, y: cursorPos.y - 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.5 }}
      />

      {/* Senior Detail: Scroll Progress */}
      <motion.div id="scroll-progress" style={{ scaleX }} />

      {/* Floating Header - Fixed with better contrast and blur */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-5xl">
        <nav className="glass-card px-10 py-5 rounded-full flex justify-between items-center border-white/10 bg-slate-950/40 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl rotate-12 flex items-center justify-center text-xs font-bold shadow-lg shadow-accent/20">JSW</div>
            <span className="font-bold tracking-tighter text-2xl uppercase">Studio</span>
          </div>
          <div className="hidden md:flex gap-12 text-sm font-bold uppercase tracking-widest text-slate-300">
            <a href="#" className="hover:text-accent transition-colors">Visualizer</a>
            <a href="#" className="hover:text-accent transition-colors">Collections</a>
            <a href="#" className="hover:text-accent transition-colors">Showcase</a>
          </div>
          <button 
            onClick={() => navigate('/visualizer')}
            className="bg-accent text-white px-6 py-2 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all"
          >
            Launch
          </button>
        </nav>
      </header>

      {/* Hero Section: Asymmetric & Cinematic */}
      <section className="relative min-h-screen flex items-center pt-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-7 relative z-10"
          >
            <span className="text-accent font-mono text-sm tracking-[0.4em] uppercase mb-8 block font-bold">Premium Architectural Suite</span>
            <h1 className="text-luxury text-7xl md:text-8xl lg:text-9xl font-bold leading-[1] mb-10 text-gradient-silver">
              Paint <br /> 
              <span className="italic font-normal text-white/40">Beyond</span> <br />
              Reality.
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-xl mb-12 font-light leading-relaxed">
              Step into a highly realistic 3D space where JSW colors meet architectural precision. No guesswork. Just perfection.
            </p>
            <div className="flex flex-wrap gap-6">
              <button 
                onClick={() => navigate('/visualizer')}
                className="pill-luxury btn-primary-luxury flex items-center gap-3"
              >
                Start Visualizing <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleQuote}
                className="pill-luxury btn-secondary-luxury"
              >
                Consult an Expert
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[3/4] rounded-luxury overflow-hidden glass-card p-2">
              <img 
                src="/assets/hero.png" 
                alt="Architecture" 
                className="w-full h-full object-cover rounded-[2rem] hover:scale-110 transition-transform duration-[10s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            </div>
            {/* Senior Detail: Floating Accuracy Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 glass-card p-6 rounded-3xl z-20 border-accent/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40">
                  <Maximize className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Precision</p>
                  <p className="text-xl font-bold">100% Accuracy</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features: The "Senior" Grid */}
      <section className="py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-luxury text-5xl md:text-7xl font-bold mb-6">Designed for <br/> Confident Decisions.</h2>
              <p className="text-xl text-slate-400 font-light">We've eliminated the gap between your screen and your walls.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white transition-all cursor-pointer">
                <ChevronRight className="w-6 h-6 rotate-180" />
              </div>
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white transition-all cursor-pointer">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 glass-card p-12 rounded-luxury relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[120px] -mr-48 -mt-48 group-hover:bg-accent/20 transition-all" />
              <Palette className="w-16 h-16 text-accent mb-12" />
              <h3 className="text-4xl font-bold mb-6">Semantic Color Intelligence</h3>
              <p className="text-xl text-slate-400 max-w-lg font-light leading-relaxed">
                Our AI doesn't just apply color. It understands subsurface scattering, specular highlights, and ambient occlusion to render paint as it truly appears.
              </p>
              <div className="mt-12 flex gap-4">
                {['#0F172A', '#B87333', '#3B82F6', '#60A5FA'].map((c) => (
                  <div key={c} className="w-10 h-10 rounded-full border-2 border-white/10 hover:border-white transition-all cursor-pointer" style={{ backgroundColor: c }} />
                ))}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 glass-card p-12 rounded-luxury flex flex-col justify-between"
            >
              <Box className="w-12 h-12 text-accent" />
              <div>
                <h3 className="text-2xl font-bold mb-4">3D Volumetric Lighting</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  Real-time light paths that adapt to your room's orientation.
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 glass-card p-12 rounded-luxury flex flex-col justify-between"
            >
              <Maximize className="w-12 h-12 text-accent" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Edge Precision</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  Architectural snapping for sharp corners and perfect trim protection.
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 glass-card p-12 rounded-luxury flex items-center justify-between group overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Interactive Canvas</h3>
                <p className="text-slate-400 max-w-sm font-light">
                  Upload, mask, and paint in under 60 seconds with our zero-learning-curve UI.
                </p>
              </div>
              <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-125 transition-transform">
                <ArrowRight className="w-12 h-12 text-accent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem-Agitate: The Cinematic Narrative */}
      <section className="relative py-60 px-6 bg-slate-950">
        <div className="absolute inset-0">
          <img 
            src="/assets/features.png" 
            className="w-full h-full object-cover opacity-10"
            alt="Narrative"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-transparent to-primary" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-luxury text-6xl md:text-8xl font-bold mb-12 text-gradient-silver">
              Stop Guessing. <br /> Start Visualizing.
            </h2>
            <p className="text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-20">
              The cost of a mistake isn't just the paint. It's the time, the labor, and the regret of living in a space that doesn't feel like you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left max-w-5xl mx-auto">
              {[
                { t: "Wasted Money", d: "Save ₹10,000+ on incorrect samples." },
                { t: "Perfect Shade", d: "Color-correct rendering for any light." },
                { t: "Zero Stress", d: "Approve designs with total confidence." }
              ].map((item, i) => (
                <div key={i} className="border-l border-accent/30 pl-8">
                  <h4 className="text-xl font-bold mb-2">{item.t}</h4>
                  <p className="text-slate-500 font-light">{item.d}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Stack: The "Elite" Offer */}
      <section className="py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-1 rounded-luxury bg-gradient-to-br from-accent/40 via-white/5 to-transparent">
            <div className="bg-primary rounded-[2.4rem] p-16 md:p-24 relative overflow-hidden">
              <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-copper font-mono text-xs tracking-[0.4em] uppercase mb-8 block font-bold">Limited Engagement</span>
                  <h2 className="text-luxury text-5xl md:text-7xl font-bold mb-10 leading-tight">Free Studio <br /> Consultation.</h2>
                  <p className="text-xl text-slate-400 font-light leading-relaxed mb-12">
                    Get an architect's eye on your project. Our experts use the 3D Visualizer to craft your perfect palette.
                  </p>
                  <div className="flex flex-col items-start gap-4 mb-12">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 line-through text-2xl font-light tracking-tighter">₹15,000</span>
                      <span className="text-copper font-bold text-3xl px-6 py-2 bg-copper/10 rounded-2xl border border-copper/20">
                        COMPLIMENTARY
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleQuote}
                    className="pill-luxury bg-white text-primary hover:bg-slate-200"
                  >
                    Apply for Session
                  </button>
                </div>
                <div className="relative aspect-square rounded-[2rem] overflow-hidden">
                  <img src="/assets/cta.png" alt="Consultation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-accent/20 mix-blend-overlay" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof: The Scroll Ticker */}
      <section className="py-40 bg-slate-950 overflow-hidden">
        <div className="text-center mb-24">
          <h2 className="text-luxury text-5xl font-bold mb-4">Architect Approved.</h2>
          <p className="text-slate-500 font-light tracking-widest uppercase text-sm">Join the Elite Homeowners Circle</p>
        </div>
        
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[
            { n: "Vikram Mehta", r: "Senior Architect", t: "The most accurate tool I've used in 20 years. Simply flawless." },
            { n: "Sarah Jenkins", r: "Interior Designer", t: "Finally, a way to show clients exactly what they're paying for." },
            { n: "Arun Kumar", r: "Homeowner", t: "Saved me ₹20,000 in bad samples. It's a game-changer for renovation." },
            { n: "Elena Rossi", r: "Studio Lead", t: "The subsurface scattering rendering is better than my desktop software." },
            { n: "David Chen", r: "Contractor", t: "No more disputes over color names. The 3D render is the final word." },
            { n: "Priya Shah", r: "Art Director", t: "The cinematic depth makes it a joy to use. Truly professional grade." }
          ].map((item, i) => (
            <div key={i} className="inline-block glass-card p-10 rounded-3xl min-w-[450px]">
              <div className="flex text-accent mb-8 gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-xl text-slate-300 italic mb-10 font-light whitespace-normal leading-relaxed">
                "{item.t}"
              </p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/5" />
                <div>
                  <span className="text-white font-bold text-lg block">{item.n}</span>
                  <span className="text-slate-500 text-xs uppercase tracking-widest">{item.r}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer: Minimal & Elite */}
      <footer className="bg-primary pt-40 pb-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-40">
            <div className="md:col-span-6">
              <h2 className="text-luxury text-4xl font-bold mb-8">JSW PAINT STUDIO</h2>
              <p className="text-xl text-slate-500 max-w-sm font-light leading-relaxed">
                Redefining the relationship between light, space, and color.
              </p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-8 text-xs uppercase tracking-[0.2em] text-slate-500">Explorer</h4>
              <ul className="space-y-4 text-slate-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Visualizer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Collections</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-8 text-xs uppercase tracking-[0.2em] text-slate-500">Legal</h4>
              <ul className="space-y-4 text-slate-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold mb-8 text-xs uppercase tracking-[0.2em] text-slate-500">Social</h4>
              <div className="flex gap-6 text-slate-400">
                <Instagram className="w-5 h-5 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 hover:text-white cursor-pointer" />
                <Linkedin className="w-5 h-5 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:row justify-between items-center pt-20 border-t border-white/5 gap-8">
            <p className="text-slate-600 text-sm font-light">© 2024 JSW Paint Studio. Elite Member of JSW Group.</p>
            <div className="flex gap-12 text-xs font-bold tracking-widest text-slate-500">
              <a href="#" className="hover:text-white transition-all">FB</a>
              <a href="#" className="hover:text-white transition-all">TW</a>
              <a href="#" className="hover:text-white transition-all">IN</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Marquee Keyframes (Embedded for simplicity in this overhaul) */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
