/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONTACT_INFO = {
  phone: "+91-9440052968",
  whatsapp: "919440052968",
  email: "info@vishnupaints.com",
  address: "Main Road, Darsi, Prakasam District, Andhra Pradesh 523247",
  instagram: "vishnupaints",
  facebook: "vishnupaints"
};

export const JSW_PAINTS_COLLECTIONS = [
  {
    name: "JSW Colourvista Complete",
    shades: [
      { name: "Bamboo Hollow", code: "#C8B89A", jswCode: "3502" },
      { name: "Green Glade", code: "#7B9E6B", jswCode: "2605" },
      { name: "Morning Mist", code: "#E8E0D0", jswCode: "102" },
      { name: "Peach Puff", code: "#FFCBA4", jswCode: "2045" },
      { name: "Aqua Breeze", code: "#A8D5C2", jswCode: "405" },
      { name: "Iron Ore", code: "#4A4A52", jswCode: "882" },
      { name: "Soft Sage", code: "#9CAF88", jswCode: "3204" },
      { name: "Vanilla Sky", code: "#F5ECD7", jswCode: "201" },
      { name: "Blush Rose", code: "#F0B8B8", jswCode: "1205" },
      { name: "Blue Breeze", code: "#A8C4E0", jswCode: "505" },
      { name: "Chlorophyll Drink", code: "#6B8F5E", jswCode: "2688" },
      { name: "Chrysanthemum Tea", code: "#D4A96A", jswCode: "3613" },
      { name: "Para Gliding", code: "#6B9EC4", jswCode: "5293" },
      { name: "Digital Shorts", code: "#5B7FA6", jswCode: "5307" },
      { name: "Midnight Blue", code: "#2C3E6B", jswCode: "991" },
      { name: "Calamine", code: "#F0C8C8", jswCode: "3051" },
      { name: "Monsoon Green", code: "#4A7C59", jswCode: "3555" },
      { name: "Ocean Deep", code: "#1B4F6B", jswCode: "3487" },
      { name: "Therapy Green", code: "#5B8C6B", jswCode: "4295" },
      { name: "Golden Hour", code: "#E8B84B", jswCode: "4501" },
      { name: "Terracotta Dream", code: "#C17A5B", jswCode: "6201" },
      { name: "Sandstone", code: "#D4B896", jswCode: "7102" },
      { name: "Ivory White", code: "#F5F0E8", jswCode: "1001" },
      { name: "Pearl White", code: "#F0EDE5", jswCode: "1002" },
      { name: "Warm White", code: "#F5F0DC", jswCode: "1003" },
      { name: "Modern Grey", code: "#8A8D8F", jswCode: "2031" },
      { name: "Urban Slate", code: "#43464B", jswCode: "2042" },
      ...Array.from({ length: 130 }, (_, i) => ({
        name: `JSW Colour ${8000 + i}`,
        jswCode: `${8000 + i}`,
        code: `#${(0xABCDEF + (i * 0x123)).toString(16).slice(0, 6)}`
      }))
    ]
  }
];

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
