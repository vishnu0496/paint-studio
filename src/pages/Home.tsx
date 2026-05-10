import React from "react";
import { CONTACT_INFO, COLOR_DISCLAIMER } from "../constants";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  MousePointer2, 
  Palette, 
  MessageSquare, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  ChevronRight,
  Home as HomeIcon,
  Droplets,
  ShieldCheck,
  Hammer,
  Clock,
  Navigation
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'd like to inquire about JSW Paint services.`, '_blank');
  };

  const handleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-primary/10 overflow-x-hidden">
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-lg shadow-sm">VP</div>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-lg font-bold text-primary leading-tight">Vishnu Paints</h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">JSW Paints retailer · Darsi</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button onClick={() => navigate('/visualizer')} className="hover:text-primary transition-colors">Visualizer</button>
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>

          <button 
            onClick={handleWhatsApp}
            className="btn-success !px-4 !py-2 !rounded-md"
          >
            <MessageSquare size={16} />
            <span className="text-[11px] uppercase tracking-wider">WHATSAPP</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-32 md:pb-40 lg:pt-48 lg:pb-60">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mb-8 leading-[1.1] tracking-tight">
                Preview JSW Paint Colours On Your Home
              </h2>
              
              <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Upload a room or house photo, try JSW shades, estimate paint quantity, and send your selection to Vishnu Paints on WhatsApp.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/visualizer')}
                  className="btn-primary"
                >
                  <Palette size={20} />
                  <span>Open Visualizer</span>
                </button>
                <button 
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary"
                >
                  Contact Vishnu Paints
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] justify-center lg:justify-start">
                <CheckCircle2 className="text-success" size={14} />
                <span>Authorized JSW Paints retailer in Darsi</span>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-2xl shadow-blue-900/5 bg-slate-50 relative group">
                <img 
                  src="/assets/hero-v2.png" 
                  alt="JSW Paint Visualizer Demo" 
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Stitch-style swatch bar overlay */}
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 hidden sm:flex flex-col gap-2 z-10 scale-90">
                  <div className="w-8 h-8 rounded-lg bg-[#E31E24] shadow-inner"></div>
                  <div className="w-8 h-8 rounded-lg bg-[#00256B] shadow-inner"></div>
                  <div className="w-8 h-8 rounded-lg bg-[#128C4A] shadow-inner"></div>
                  <div className="w-8 h-8 rounded-lg bg-[#334155] shadow-inner"></div>
                  <div className="w-8 h-8 rounded-lg bg-[#D5E3FD] shadow-inner border border-slate-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 bg-soft-blue border-y border-slate-100">
        <div className="container-custom">
          <div className="mb-20 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 tracking-tight">How it works</h3>
            <p className="text-slate-500 text-lg">Four simple steps to your new room colour</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Upload />, title: "Upload Photo", desc: "Take a picture of your room or house exterior." },
              { icon: <MousePointer2 />, title: "Select Wall", desc: "Tap to identify the areas you want to paint." },
              { icon: <Palette />, title: "Choose Shade", desc: "Explore the JSW Paints colour catalog." },
              { icon: <MessageSquare />, title: "Send Quote", desc: "Share details on WhatsApp for an estimate." }
            ].map((step, i) => (
              <div key={i} className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-8 shrink-0">
                  {React.cloneElement(step.icon as React.ReactElement, { size: 28 })}
                </div>
                <h4 className="text-lg font-bold text-primary mb-4">{i + 1}. {step.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 md:py-32">
        <div className="container-custom">
          <div className="mb-20 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 tracking-tight">Painting services</h3>
              <p className="text-slate-500 text-lg font-medium">Professional application for every part of your home</p>
            </div>
            <button 
              onClick={handleWhatsApp}
              className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
            >
              <span>View full catalog</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: "Interior Painting", 
                desc: "Premium finishes for your living spaces with JSW Halo.",
                image: "/assets/interior.png"
              },
              { 
                title: "Exterior Painting", 
                desc: "Durable weather protection with JSW Aurus.",
                image: "/assets/exterior.png"
              },
              { 
                icon: <Droplets />, 
                title: "Waterproofing", 
                desc: "Advanced leakage solutions and damp proofing." 
              },
              { 
                icon: <Hammer />, 
                title: "Wood & Metal Paints", 
                desc: "Enamels and PU coatings for furniture and grills." 
              }
            ].map((service, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-full transition-all hover:border-primary/20 hover:shadow-lg">
                {service.image ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-blue-50 flex items-center justify-center text-primary">
                    {React.cloneElement(service.icon as React.ReactElement, { size: 48, strokeWidth: 1.5 })}
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <h4 className="text-xl font-bold text-primary mb-4">{service.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">{service.desc}</p>
                  <button 
                    onClick={handleWhatsApp}
                    className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    <span>Inquire</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Trust */}
      <section id="contact" className="py-24 md:py-32 bg-soft-blue border-y border-slate-100">
        <div className="container-custom">
          <div className="mb-20 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary mb-4 tracking-tight">Visit Vishnu Paints</h3>
            <p className="text-slate-500 text-lg">Darsi's trusted JSW Paints retail partner</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-16 shadow-sm relative overflow-hidden">
            <div className="grid md:grid-cols-3 gap-12 items-start relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-6">
                  <MapPin size={24} />
                </div>
                <p className="font-bold text-primary text-xs mb-3 uppercase tracking-widest">Shop Address</p>
                <p className="text-slate-600 text-sm leading-relaxed max-w-[200px]">{CONTACT_INFO.address}</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-6">
                  <Phone size={24} />
                </div>
                <p className="font-bold text-primary text-xs mb-3 uppercase tracking-widest">Phone / WhatsApp</p>
                <p className="text-slate-600 text-lg font-bold">{CONTACT_INFO.phone}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-6">
                  <Clock size={24} />
                </div>
                <p className="font-bold text-primary text-xs mb-3 uppercase tracking-widest">Store Hours</p>
                <p className="text-slate-600 text-sm font-bold uppercase tracking-wide">Mon - Sat</p>
                <p className="text-slate-600 text-sm">9:00 AM - 8:00 PM</p>
              </div>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button 
                onClick={handleMaps}
                className="btn-primary !bg-primary"
              >
                <Navigation size={20} />
                <span>Visit Shop on Maps</span>
              </button>
              <button 
                onClick={handleWhatsApp}
                className="btn-primary !bg-success"
              >
                <MessageSquare size={20} />
                <span>Talk on WhatsApp</span>
              </button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          </div>

          <div className="mt-16 max-w-2xl mx-auto text-center">
            <div className="bg-warning-cream border border-amber-100 p-6 rounded-2xl">
              <p className="text-xs text-amber-900/80 leading-relaxed font-medium italic">
                {COLOR_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-base shadow-sm">VP</div>
                <h2 className="text-lg font-bold text-primary tracking-tight">Vishnu Paints</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your trusted partner for JSW Paints in Darsi. Delivering quality and precision since 2024.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-16">
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2">Platform</p>
                <button onClick={() => navigate('/visualizer')} className="text-sm text-slate-500 hover:text-primary text-left transition-colors">Visualizer</button>
                <a href="#services" className="text-sm text-slate-500 hover:text-primary transition-colors">Interior Painting</a>
                <a href="#services" className="text-sm text-slate-500 hover:text-primary transition-colors">Exterior Painting</a>
                <a href="#services" className="text-sm text-slate-500 hover:text-primary transition-colors">Waterproofing</a>
              </div>
              
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2">Legal</p>
                <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-medium text-slate-400">© 2024 Vishnu Paints. JSW Paints retailer, Darsi. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
