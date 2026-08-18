"use strict";

/* =========================================================
   SEN PARTY RENTALS — MASTER INVENTORY
   This is the only inventory list used by:
   - index.html
   - inventory.html
   - booking.html
   - category pages
   - rental detail pages
========================================================= */

window.SEN_RENTALS = [
  {
    id: "modular-moonbounce",
    name: "Modular Moon Bounce",
    category: "bounce-house",
    categoryLabel: "Bounce House",
    price: 250,
    featured: true,
    mainImage: "./castleh1.PNG",
    images: ["./castleh1.PNG"],
    detailPage: "./modular-moonbounce-rental.html",
    description:
      "A classic modular bounce house for birthdays, family celebrations and younger children.",
    quick: ["13 × 13 ft", "Dry", "1 outlet"],
    specs: {
      Dimensions: "13 × 13 × 15 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Setup: "Grass or approved hard surface",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "sponge-bop-moonbounce",
    name: "Sponge Bop Moon Bounce",
    category: "bounce-house",
    categoryLabel: "Bounce House",
    price: 250,
    featured: true,
    mainImage: "./spongebob1.PNG",
    images: ["./spongebob1.PNG"],
    detailPage: "./sponge-bop-moonbounce-rental.html",
    description:
      "A colorful themed moon bounce for birthday parties and family events.",
    quick: ["15 × 15 ft", "Dry", "Kids favorite"],
    specs: {
      Dimensions: "15 × 15 × 15 ft",
      Capacity: "Up to 8 children",
      Ages: "3+",
      Setup: "Grass preferred",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "castle-fun-house",
    name: "Castle Fun House",
    category: "bounce-house",
    categoryLabel: "Bounce House",
    price: 250,
    featured: false,
    mainImage: "./CastleFunHouse.PNG",
    images: ["./CastleFunHouse.PNG"],
    detailPage: "./castle-fun-house-rental.html",
    description:
      "A spacious castle-style bounce house for birthday parties and community events.",
    quick: ["15 × 15 ft", "Castle theme", "1 outlet"],
    specs: {
      Dimensions: "15 × 15 × 16 ft",
      Capacity: "Up to 8 children",
      Ages: "3+",
      Setup: "Grass preferred",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "magic-castle-hoop",
    name: "Magic Castle with Basketball Hoop",
    category: "bounce-house",
    categoryLabel: "Bounce House",
    price: 250,
    featured: false,
    mainImage: "./castleh1.PNG",
    images: ["./castleh1.PNG"],
    detailPage: "./magic-castle-hoop-rental.html",
    description:
      "A castle bounce house with a built-in basketball hoop for extra active fun.",
    quick: ["13 × 13 ft", "Basketball hoop", "Dry"],
    specs: {
      Dimensions: "13 × 13 × 15 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Feature: "Basketball hoop",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "princess-castle",
    name: "Princess Castle Moon Bounce",
    category: "bounce-house",
    categoryLabel: "Bounce House",
    price: 250,
    featured: false,
    mainImage: "./IMG_0565.PNG",
    images: ["./IMG_0565.PNG"],
    detailPage: "./princess-castle-moonbounce-rental.html",
    description:
      "A princess-themed castle moon bounce for birthdays, school events and themed celebrations.",
    quick: ["13 × 13 ft", "Princess theme", "Dry"],
    specs: {
      Dimensions: "13 × 13 × 16 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Theme: "Princess castle",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "giant-flip-flop",
    name: "Giant Flip-Flop Splash Slide",
    category: "water-slide",
    categoryLabel: "Water Slide",
    price: 450,
    featured: true,
    mainImage: "./Giant Flip-Flop Slide.PNG",
    images: ["./Giant Flip-Flop Slide.PNG"],
    detailPage: "./giant-flip-flop-water-slide-rental.html",
    description:
      "A large summer water slide with a fast lane and splash landing for backyard parties.",
    quick: ["18 ft tall", "Wet", "1 outlet"],
    specs: {
      Dimensions: "28 × 13 × 18 ft",
      Capacity: "One rider at a time",
      Ages: "5+",
      Water: "Garden hose required",
      Power: "1 standard outlet",
      Use: "Wet"
    }
  },

  {
    id: "castle-splash-combo",
    name: "Castle Splash Combo",
    category: "water-slide",
    categoryLabel: "Water Slide Combo",
    price: 350,
    featured: false,
    mainImage: "./7BD6EB13-C585-4DA8-9EA4-68F2B8FF0669.PNG",
    images: [
      "./7BD6EB13-C585-4DA8-9EA4-68F2B8FF0669.PNG"
    ],
    detailPage: "./castle-splash-combo-rental.html",
    description:
      "A castle-themed inflatable with a bounce area and slide. Wet or dry setup is available.",
    quick: ["Bounce + slide", "Wet or dry", "30 ft long"],
    specs: {
      Dimensions: "30 × 13 × 15 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Water: "Garden hose for wet setup",
      Power: "1 standard outlet",
      Use: "Wet or dry"
    }
  },

  {
    id: "dino-splash",
    name: "Dino Splash Adventure",
    category: "water-slide",
    categoryLabel: "Water Slide",
    price: 350,
    featured: false,
    mainImage: "./dino1.jpeg",
    images: ["./dino1.jpeg"],
    detailPage: "./dino-splash-water-slide-rental.html",
    description:
      "A dinosaur-themed water slide and splash zone for exciting summer fun.",
    quick: ["16 ft tall", "Dinosaur theme", "Wet"],
    specs: {
      Dimensions: "25 × 10 × 16 ft",
      Capacity: "One rider at a time",
      Ages: "4+",
      Water: "Garden hose required",
      Power: "1 standard outlet",
      Use: "Wet"
    }
  },

  {
    id: "wild-rapid",
    name: "Wild Rapid",
    category: "water-slide",
    categoryLabel: "Dual-Lane Water Slide",
    price: 500,
    featured: false,
    mainImage: "./whilerapid1.PNG",
    images: ["./whilerapid1.PNG"],
    detailPage: "./wild-rapid-water-slide-rental.html",
    description:
      "A two-lane racing water slide for backyard competitions, larger parties and special events.",
    quick: ["Two lanes", "18 ft tall", "Wet"],
    specs: {
      Dimensions: "32 × 16 × 18 ft",
      Capacity: "Two riders",
      Ages: "5+",
      Feature: "Dual racing lanes",
      Power: "2 standard outlets",
      Use: "Wet"
    }
  },

  {
    id: "big-wave",
    name: "Big Wave Water Slide",
    category: "water-slide",
    categoryLabel: "Water Slide",
    price: 450,
    featured: false,
    mainImage: "./big wave1.PNG",
    images: ["./big wave1.PNG"],
    detailPage: "./big-wave-water-slide-rental.html",
    description:
      "A tall water slide with a dramatic wave design and splash landing.",
    quick: ["18 ft tall", "Wave theme", "Wet"],
    specs: {
      Dimensions: "30 × 13 × 18 ft",
      Capacity: "One rider at a time",
      Ages: "5+",
      Water: "Garden hose required",
      Power: "1 standard outlet",
      Use: "Wet"
    }
  },

  {
    id: "tropical-thunder",
    name: "Tropical Thunder",
    category: "water-slide",
    categoryLabel: "Wet or Dry Slide",
    price: 450,
    featured: false,
    mainImage: "./tropica1.jpeg",
    images: ["./tropica1.jpeg"],
    detailPage: "./tropical-thunder-water-slide-rental.html",
    description:
      "A tropical-themed inflatable slide that can be used wet or dry.",
    quick: ["Wet or dry", "16 ft tall", "Tropical theme"],
    specs: {
      Dimensions: "28 × 13 × 18 ft",
      Capacity: "One rider at a time",
      Ages: "4+",
      Water: "Optional",
      Power: "1 standard outlet",
      Use: "Wet or dry"
    }
  },

  {
    id: "dunk-tank",
    name: "Dunk Tank",
    category: "dunk-tank",
    categoryLabel: "Dunk Tank",
    price: 400,
    featured: false,
    mainImage: "./dunktank.PNG",
    images: ["./dunktank.PNG"],
    detailPage: "./dunk-tank-rental.html",
    description:
      "A classic dunk tank for school fundraisers, church events, company picnics and community celebrations.",
    quick: ["Fundraisers", "No electricity", "Outdoor"],
    specs: {
      Dimensions: "Approximately 8 × 8 × 8 ft",
      Capacity: "One seated participant",
      Ages: "Adult supervision required",
      Water: "Customer water source required",
      Power: "No outlet required",
      Use: "Outdoor"
    }
  },

  {
    id: "castle-combo",
    name: "Castle Combo",
    category: "combo",
    categoryLabel: "Bounce and Slide Combo",
    price: 350,
    featured: true,
    mainImage: "./BAB0FD26-8E6F-4086-AFBF-A89119699969.PNG",
    images: [
      "./BAB0FD26-8E6F-4086-AFBF-A89119699969.PNG"
    ],
    detailPage: "./castle-combo-bounce-house-rental.html",
    description:
      "A castle inflatable combining a bounce area and slide.",
    quick: ["Bounce + slide", "Wet", "30 ft long"],
    specs: {
      Dimensions: "30 × 13 × 15 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Feature: "Bounce area and slide",
      Power: "1 standard outlet",
      Use: "Wet"
    }
  },

  {
    id: "high-sky-combo",
    name: "High Sky Combo",
    category: "combo",
    categoryLabel: "Bounce and Slide Combo",
    price: 350,
    featured: false,
    mainImage: "./41C07D7F-A725-4D33-95BC-63564DF13899.PNG",
    images: [
      "./41C07D7F-A725-4D33-95BC-63564DF13899.PNG"
    ],
    detailPage: "./high-sky-combo-rental.html",
    description:
      "A tall slide and roomy bounce area for birthdays and larger family gatherings.",
    quick: ["32 ft long", "Bounce + slide", "Dry"],
    specs: {
      Dimensions: "28 × 13 × 16 ft",
      Capacity: "Up to 6 children",
      Ages: "4+",
      Feature: "Tall slide and bounce area",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "jurassic-combo",
    name: "Jurassic Combo",
    category: "combo",
    categoryLabel: "Bounce and Slide Combo",
    price: 300,
    featured: false,
    mainImage: "./jerrasic1.PNG",
    images: ["./jerrasic1.PNG"],
    detailPage: "./jurassic-combo-rental.html",
    description:
      "A dinosaur-themed combo with a bounce section, play area and slide.",
    quick: ["Dinosaur theme", "Bounce + slide", "Dry"],
    specs: {
      Dimensions: "28 × 18 × 16 ft",
      Capacity: "Up to 6 children",
      Ages: "3+",
      Theme: "Dinosaur",
      Power: "1 standard outlet",
      Use: "Dry"
    }
  },

  {
    id: "toxic-revenge",
    name: "Toxic Revenge Obstacle Course",
    category: "obstacle-course",
    categoryLabel: "Obstacle Course",
    price: 600,
    featured: false,
    mainImage: "./Toxic Revenge Obstacle Course1.PNG",
    images: [
      "./Toxic Revenge Obstacle Course1.PNG",
      "./obstaclecours1.PNG",
      "./IMG_6489 Small.jpeg",
      "./IMG_6490 Small.jpeg",
      "./IMG_6491 Small.jpeg"
    ],
    detailPage: "./toxic-revenge-obstacle-course-rental.html",
    description:
      "An extreme obstacle challenge with tunnels, climbing sections and slides.",
    quick: ["5 photos", "Teens and adults", "Dry"],
    specs: {
      Dimensions: "Confirm setup dimensions",
      Capacity: "Multiple participants",
      Ages: "Older children, teens and adults",
      Feature: "Tunnels, climbs and slides",
      Power: "Confirm outlet requirements",
      Use: "Dry"
    }
  },

  {
    id: "black-ops",
    name: "Black Ops 60-Foot Obstacle Course",
    category: "obstacle-course",
    categoryLabel: "Obstacle Course",
    price: 750,
    featured: false,
    mainImage: "./blkops1.PNG",
    images: ["./blkops1.PNG"],
    detailPage:
      "./black-ops-60ft-obstacle-course-rental.html",
    description:
      "A 60-foot military-style obstacle course for teens, adults, festivals and large events.",
    quick: ["60 ft long", "Military theme", "Large events"],
    specs: {
      Dimensions: "60 ft long",
      Capacity: "Multiple participants",
      Ages: "Older children, teens and adults",
      Feature: "Military obstacle theme",
      Power: "3 standard outlets",
      Use: "Dry"
    }
  },

  {
    id: "backyard-extreme",
    name: "60ft Backyard Extreme",
    category: "obstacle-course",
    categoryLabel: "Obstacle Course",
    price: 500,
    featured: false,
    mainImage: "./obstaclecou1.PNG",
    images: ["./obstaclecou1.PNG"],
    detailPage:
      "./60ft-backyard-extreme-obstacle-course-rental.html",
    description:
      "A large 60-foot backyard obstacle course for races, festivals, school events and big celebrations.",
    quick: ["60 ft long", "Racing course", "Dry"],
    specs: {
      Dimensions: "60 × 13 × 16 ft",
      Capacity: "Multiple participants",
      Ages: "3+",
      Feature: "Long racing course",
      Power: "2 standard outlets",
      Use: "Dry"
    }
  },

  {
    id: "generator",
    name: "Generator",
    category: "add-on",
    categoryLabel: "Add-On",
    price: 100,
    featured: false,
    mainImage: "./generator.PNG",
    images: ["./generator.PNG"],
    detailPage: "./generator-rental.html",
    description:
      "A portable generator for locations without a suitable electrical outlet near the setup area.",
    quick: ["Portable", "Outdoor", "Power add-on"],
    specs: {
      Type: "Portable generator",
      Fuel: "Confirm fuel inclusion",
      Capacity: "Depends on rental units",
      Placement: "Outdoor use only",
      Power: "Generator output",
      Use: "Add-on"
    }
  },

  {
    id: "table",
    name: "6ft Banquet Table",
    category: "add-on",
    categoryLabel: "Table",
    price: 12,
    featured: false,
    mainImage: "./table.PNG",
    images: ["./table.PNG"],
    detailPage: "./6ft-banquet-table-rental.html",
    description:
      "A sturdy six-foot banquet table for food service, gifts, registration and guest seating.",
    quick: ["6 ft", "Folding", "6–8 guests"],
    specs: {
      Length: "6 ft",
      Type: "Folding banquet table",
      Capacity: "Approximately 6–8 guests",
      Setup: "Indoor or outdoor",
      Power: "Not required",
      Use: "Add-on"
    }
  },

  {
    id: "chair",
    name: "Banquet Chair",
    category: "add-on",
    categoryLabel: "Chair",
    price: 2,
    featured: false,
    mainImage: "./chair1.PNG",
    images: ["./chair1.PNG"],
    detailPage: "./banquet-chair-rental.html",
    description:
      "A durable folding chair for birthdays, family events, ceremonies and community gatherings.",
    quick: ["Folding", "Indoor or outdoor", "$2 each"],
    specs: {
      Type: "Folding chair",
      Capacity: "One guest",
      Setup: "Indoor or outdoor",
      Quantity: "Select during booking",
      Power: "Not required",
      Use: "Add-on"
    }
  },

  {
    id: "sand-bags",
    name: "Sand Bags",
    category: "add-on",
    categoryLabel: "Safety Add-On",
    price: 5,
    featured: false,
    mainImage: "./sandbags.PNG",
    images: ["./sandbags.PNG"],
    detailPage: "./sand-bags-rental.html",
    description:
      "Weighted sand bags used when an inflatable must be secured on an approved hard surface.",
    quick: ["Hard surfaces", "Safety equipment", "Quantity varies"],
    specs: {
      Type: "Weighted safety bag",
      Use: "Hard-surface anchoring",
      Quantity: "Based on inflatable",
      Setup: "Installed by rental staff",
      Power: "Not required",
      Availability: "With qualifying rentals"
    }
  },

  {
    id: "popcorn",
    name: "Popcorn Machine",
    category: "concession",
    categoryLabel: "Concession",
    price: 75,
    featured: false,
    mainImage: "./popcorn.PNG",
    images: ["./popcorn.PNG"],
    detailPage: "./popcorn-machine-rental.html",
    description:
      "A countertop popcorn machine for serving fresh popcorn at parties and special events.",
    quick: ["1 outlet", "Countertop", "Party favorite"],
    specs: {
      Type: "Countertop concession machine",
      Supplies: "Confirm supplies separately",
      Operator: "Adult operation recommended",
      Setup: "Covered area preferred",
      Power: "1 standard outlet",
      Use: "Concession"
    }
  },

  {
    id: "snow-cone",
    name: "Snow Cone Machine",
    category: "concession",
    categoryLabel: "Concession",
    price: 75,
    featured: false,
    mainImage: "./snowcon.PNG",
    images: ["./snowcon.PNG"],
    detailPage: "./snow-cone-machine-rental.html",
    description:
      "A snow cone machine for refreshing frozen treats during warm-weather parties and events.",
    quick: ["1 outlet", "Ice required", "Summer events"],
    specs: {
      Type: "Countertop concession machine",
      Supplies: "Ice and syrup required",
      Operator: "Adult operation recommended",
      Setup: "Covered area preferred",
      Power: "1 standard outlet",
      Use: "Concession"
    }
  }
];