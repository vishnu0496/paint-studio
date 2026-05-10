/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONTACT_INFO = {
  phone: "+91-9440052968",
  whatsapp: "919440052968",
  email: "info@vishnupaints.com",
  address: "Main Road, Darsi, Prakasam District, Andhra Pradesh 523247",
  shopName: "Vishnu Paints",
  tagline: "JSW Paints Authorized Dealer",
  location: "Darsi, Andhra Pradesh"
};

export const COLOR_DISCLAIMER = "Digital colours are indicative. Please confirm final shade with physical JSW shade card at Vishnu Paints.";

// Shade data has been moved to src/data/jswShades.ts

export const SERVICES = [
  {
    title: "Interior Painting",
    description: "Premium finish for your living spaces with JSW Halo and JSW Pixa ranges.",
    icon: "home",
    category: "painting"
  },
  {
    title: "Exterior Protection",
    description: "Multi-layered weather protection with JSW Aurus and JSW Aquaglo.",
    icon: "bungalow",
    category: "painting"
  },
  {
    title: "Waterproofing",
    description: "Complete leak-proof solutions for terraces and walls with JSW i-Waterproof.",
    icon: "water_drop",
    category: "painting"
  },
  {
    title: "Wood & Metal Finishes",
    description: "High-gloss and matte finishes for your furniture and railings.",
    icon: "format_paint",
    category: "painting"
  },
  {
    title: "Modular Kitchen",
    description: "Complete design and installation from scratch including cabinets, shutters, countertop, hardware and laminates.",
    icon: "countertops",
    category: "interior"
  },
  {
    title: "Wardrobes and Cupboards",
    description: "Custom built wardrobes and bedroom storage with premium laminate finishes and soft close hardware.",
    icon: "door_sliding",
    category: "interior"
  },
  {
    title: "TV Units and Entertainment",
    description: "Designer TV units, wall panels and entertainment setups with wood and laminate combinations.",
    icon: "tv",
    category: "interior"
  },
  {
    title: "Bedroom Interiors",
    description: "Complete bedroom woodwork including beds with storage, side tables, dressing units and mirror work.",
    icon: "bed",
    category: "interior"
  },
  {
    title: "Drawers and Storage",
    description: "Custom drawer units, shoe racks, pooja units and all home storage solutions.",
    icon: "inventory_2",
    category: "interior"
  },
  {
    title: "Mirror Work",
    description: "Decorative mirror work for bedrooms, living rooms and bathrooms.",
    icon: "mirror",
    category: "interior"
  },
  {
    title: "False Ceiling",
    description: "POP and gypsum false ceiling with lighting cutouts.",
    icon: "layers",
    category: "interior"
  }
];

export const PACKAGES = [
  {
    id: "paint",
    title: "Paint Package",
    description: "Interior and exterior painting with JSW Paints, texture finish, waterproofing.",
    price: "₹15,000",
    icon: "format_paint"
  },
  {
    id: "interiors",
    title: "Interiors Package",
    description: "Complete woodwork including TV unit, wardrobes, kitchen or any custom furniture with premium laminates.",
    price: "₹50,000",
    icon: "weekend"
  },
  {
    id: "complete",
    title: "Complete Home Package",
    description: "Full home transformation — painting plus complete woodwork plus modular kitchen.",
    price: "₹1,50,000",
    icon: "auto_awesome"
  }
];

export const TESTIMONIALS = [
  {
    name: "Rajesh Kumar",
    area: "Darsi Town, Prakasam",
    rating: 5,
    quote: "Excellent work by Vishnu Paints team! They finished my 3BHK painting and modular kitchen in record time. The JSW finish is very smooth."
  },
  {
    name: "Anitha Reddy",
    area: "Markapur, Prakasam",
    rating: 5,
    quote: "The designer TV unit and wardrobes look amazing. Professional service and very transparent pricing. Best interior team in Darsi."
  },
  {
    name: "Sandeep Rao",
    area: "Ongole, Prakasam",
    rating: 5,
    quote: "Very happy with the false ceiling and painting work. The team is very polite and cleaned up everything after work. Highly recommended for full home packages!"
  }
];

export const PORTFOLIO_PROJECTS = {
  painting: [
    {
      title: "Luxury 3BHK Painting",
      location: "Darsi Town",
      description: "Full interior painting using JSW Halo Luxury Emulsion.",
      imageBefore: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
      imageAfter: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Villa Exterior Coat",
      location: "Markapur Rural",
      description: "Exterior weather protection with JSW Aurus.",
      imageBefore: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a30?auto=format&fit=crop&q=80&w=800",
      imageAfter: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800"
    }
  ],
  interior: [
    {
      title: "Modern Modular Kitchen",
      location: "Darsi",
      type: "Kitchen",
      materials: "Marine Plywood, High Gloss Laminates",
      image: "https://images.unsplash.com/photo-1556911220-e75b7733676a?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Master Bedroom Wardrobes",
      location: "Ongole",
      type: "Bedroom",
      materials: "HDMR, Matte Soft-touch Laminates",
      image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Sleek TV Unit Design",
      location: "Kandukur",
      type: "Living Room",
      materials: "MDF, Charcoal Panels, LED strips",
      image: "https://images.unsplash.com/photo-1593060974448-ed212338bc76?auto=format&fit=crop&q=80&w=800"
    }
  ]
};
