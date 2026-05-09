import React from "react";
import { motion } from "framer-motion";
import { CONTACT_INFO, SERVICES, COLOR_DISCLAIMER } from "../constants";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  MousePointer2, 
  Palette, 
  MessageSquare, 
  Calculator, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  ChevronRight,
  Home as HomeIcon,
  Droplets,
  ShieldCheck,
  Hammer
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'd like to inquire about JSW Paint services.`, '_blank');
  };

  return (
    <div className="bg-background min-h-screen">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight">{CONTACT_INFO.shopName}</h1>
            <span className="text-xs font-medium text-text-secondary">{CONTACT_INFO.tagline} · {CONTACT_INFO.location}</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-text-primary">
            <button onClick={() => navigate('/visualizer')} className="hover:text-primary transition-colors">Visualizer</button>
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>

          <button 
            onClick={handleWhatsApp}
            className="btn-whatsapp px-4 py-2 text-sm hidden sm:flex"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="container-custom grid lg:grid-cols-2 gap-12 items-center">
          <div className="fade-in">
            <span className="tag bg-soft-blue text-primary mb-6 inline-block">Authorized JSW Dealer</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.15]">
              Try JSW Paint Colours <br className="hidden md:block"/> On Your Own Wall
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-lg leading-relaxed">
              Upload a room or house photo, preview JSW shades, estimate paint quantity, and send your selection to Vishnu Paints on WhatsApp.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/visualizer')}
                className="btn btn-primary"
              >
                <span>Open Visualizer</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-outline"
              >
                <span>View Services</span>
              </button>
            </div>
            
            <div className="mt-10 flex items-center gap-4 text-sm font-medium text-text-secondary">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>For customers in Darsi, Prakasam district</span>
            </div>
          </div>

          <div className="relative fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card p-2 bg-slate-100 shadow-xl overflow-hidden rounded-2xl rotate-2 relative">
              <img 
                src="/assets/hero.png" 
                alt="Vishnu Paints Visualizer Preview" 
                className="w-full h-auto rounded-xl"
              />
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded tracking-widest uppercase font-bold backdrop-blur-sm">
                  Preview Only · Digital Simulation
                </span>
              </div>
            </div>
            {/* Visualizer UI Mockup Overlay */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-2xl border border-border hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-jsw-red rounded-lg flex items-center justify-center text-white font-bold">JSW</div>
                <div>
                  <p className="text-xs text-text-secondary font-bold uppercase">Room Photo Active</p>
                  <p className="font-bold">Select JSW Shade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24 border-y border-border">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-text-secondary">Simple steps to visualize your dream home colours</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Upload className="w-8 h-8" />, title: "Upload Photo", desc: "Upload a photo of your room or house elevation." },
              { icon: <MousePointer2 className="w-8 h-8" />, title: "Select Wall", desc: "Tap on the walls you want to paint." },
              { icon: <Palette className="w-8 h-8" />, title: "Choose Shade", desc: "Select from hundreds of JSW paint colours." },
              { icon: <MessageSquare className="w-8 h-8" />, title: "Send Quote", desc: "Send your selection to us on WhatsApp for a quote." }
            ].map((step, i) => (
              <div key={i} className="text-center flex flex-col items-center group">
                <div className="w-16 h-16 bg-soft-blue rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section-padding">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Painting Services</h2>
              <p className="text-text-secondary">Professional application services for every part of your home in Darsi.</p>
            </div>
            <button 
              onClick={handleWhatsApp}
              className="btn btn-outline"
            >
              <span>View All Services</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <HomeIcon className="w-6 h-6" />, title: "Interior Painting", desc: "JSW Halo & Pixa ranges for smooth interior finishes." },
              { icon: <Droplets className="w-6 h-6" />, title: "Waterproofing", desc: "I-Waterproof solutions for leakage-free homes." },
              { icon: <ShieldCheck className="w-6 h-6" />, title: "Exterior Coating", desc: "JSW Aurus protection against sun and rain." },
              { icon: <Hammer className="w-6 h-6" />, title: "Wood & Metal", desc: "Premium finishes for furniture and gates." }
            ].map((service, i) => (
              <div key={i} className="card p-8 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="text-jsw-red mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-sm text-text-secondary mb-6">{service.desc}</p>
                <button 
                  onClick={handleWhatsApp}
                  className="text-primary font-bold text-xs flex items-center gap-1 group"
                >
                  <span>INQUIRE NOW</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Trust & Disclaimer */}
      <section id="contact" className="bg-soft-blue/50 py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="card p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8">Visit Our Shop</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <p className="font-bold">Address</p>
                    <p className="text-text-secondary">{CONTACT_INFO.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <p className="font-bold">Phone / WhatsApp</p>
                    <p className="text-text-secondary">{CONTACT_INFO.phone}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                  <div>
                    <p className="font-bold">Open Hours</p>
                    <p className="text-text-secondary">Mon - Sat: 9:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <div className="bg-warning-cream border border-orange-200 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  <span>Colour Accuracy Notice</span>
                </h3>
                <p className="text-orange-900/80 leading-relaxed mb-6">
                  {COLOR_DISCLAIMER}
                </p>
                <p className="text-sm text-orange-900/60 font-medium italic">
                  * Note: Screen colours vary based on brightness and display quality.
                </p>
              </div>
              
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">Ready to Start?</h3>
                <p className="text-text-secondary mb-8">
                  Darsi's most trusted JSW Paint shop is here to help you choose the right colour for your home.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => navigate('/visualizer')}
                    className="btn btn-jsw"
                  >
                    Start Colour Preview
                  </button>
                  <button 
                    onClick={handleWhatsApp}
                    className="btn btn-whatsapp"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Contact via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">{CONTACT_INFO.shopName}</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto font-light">
            Providing professional painting solutions and JSW products in Darsi since 2010.
          </p>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/40 italic">© 2024 Vishnu Paints. All rights reserved.</p>
            <div className="flex gap-8 text-xs font-bold tracking-widest text-white/60 uppercase">
              <button onClick={() => navigate('/visualizer')} className="hover:text-white transition-colors">Visualizer</button>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
