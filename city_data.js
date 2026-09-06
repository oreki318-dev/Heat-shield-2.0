/**
 * National Multi-City Heat Vulnerability, Wards GIS, Demographics & Cooling Shelters Database
 * Supports Pan-India Biometeorology & Urban Heat Action Plan (HAP) Generalized Architecture
 */

export const NATIONAL_CITIES = {
  delhi: {
    id: "delhi",
    name: "Delhi NCR",
    state: "National Capital Territory",
    country: "India",
    lat: 28.6139,
    lon: 77.2090,
    zoom: 11,
    authority: "Delhi Disaster Management Authority (DDMA)",
    municipal_body: "Municipal Corporation of Delhi (MCD)",
    water_utility: "Delhi Jal Board (DJB)",
    power_discom: "BSES & Tata Power-DDL",
    total_population: 32940000,
    demographics: {
      'General Public': 21400000,
      'Outdoor Workers': 3840000,
      'Elderly Residents (65+)': 2470000,
      'Slum & Informal Settlements': 4120000,
      'Healthcare Workers': 185000,
      'School Authorities': 28400,
      'City Administration': 14200,
      'DISCOM Engineers': 4600
    },
    wards: [
      {
        id: "delhi-w1",
        name: "Connaught Place & Central Corridor",
        district: "Central Delhi",
        population: 380000,
        uhi_offset: 1.8,
        base_hvi: 0.74,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 420,
        baseline_bed_occ: 78,
        cooling_center_count: 5,
        power_substation_stress: "Severe (89% Load)",
        centroid: [77.2197, 28.6328],
        coordinates: [[[77.20, 28.62], [77.24, 28.62], [77.24, 28.65], [77.20, 28.65], [77.20, 28.62]]],
        cohorts: { 'General Public': 247000, 'Outdoor Workers': 68400, 'Elderly Residents (65+)': 31200, 'Slum & Informal Settlements': 42800, 'Healthcare Workers': 12400, 'School Authorities': 3200, 'City Administration': 4100, 'DISCOM Engineers': 820 },
        cooling_centers: [
          { name: "Rajiv Chowk Metro Sanctuary", capacity: 250, address: "Block A, Connaught Place" },
          { name: "Palika Underground Cooling Hall", capacity: 180, address: "Connaught Circus" }
        ]
      },
      {
        id: "delhi-w2",
        name: "Shahdara North & Seelampur",
        district: "East Delhi",
        population: 620000,
        uhi_offset: 2.7,
        base_hvi: 0.89,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 310,
        baseline_bed_occ: 88,
        cooling_center_count: 3,
        power_substation_stress: "Critical (97% Load)",
        centroid: [77.2750, 28.6710],
        coordinates: [[[77.25, 28.65], [77.30, 28.65], [77.30, 28.70], [77.25, 28.70], [77.25, 28.65]]],
        cohorts: { 'General Public': 403000, 'Outdoor Workers': 148800, 'Elderly Residents (65+)': 48600, 'Slum & Informal Settlements': 136400, 'Healthcare Workers': 6200, 'School Authorities': 4100, 'City Administration': 1800, 'DISCOM Engineers': 650 },
        cooling_centers: [
          { name: "Shahdara Civic Center", capacity: 200, address: "GT Road Shahdara" }
        ]
      },
      {
        id: "delhi-w3",
        name: "Rohini Sector 15 & 16",
        district: "North West Delhi",
        population: 510000,
        uhi_offset: 1.2,
        base_hvi: 0.65,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 480,
        baseline_bed_occ: 68,
        cooling_center_count: 6,
        power_substation_stress: "Moderate (74% Load)",
        centroid: [77.1250, 28.7350],
        coordinates: [[[77.10, 28.71], [77.15, 28.71], [77.15, 28.76], [77.10, 28.76], [77.10, 28.71]]],
        cohorts: { 'General Public': 331500, 'Outdoor Workers': 91800, 'Elderly Residents (65+)': 56100, 'Slum & Informal Settlements': 71400, 'Healthcare Workers': 8400, 'School Authorities': 5200, 'City Administration': 1600, 'DISCOM Engineers': 780 },
        cooling_centers: [
          { name: "Rohini Sports Complex Cooling Hub", capacity: 300, address: "Sector 15, Rohini" }
        ]
      },
      {
        id: "delhi-w4",
        name: "Dwarka Sector 10 & 12",
        district: "South West Delhi",
        population: 440000,
        uhi_offset: 0.6,
        base_hvi: 0.58,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 520,
        baseline_bed_occ: 62,
        cooling_center_count: 7,
        power_substation_stress: "Normal (62% Load)",
        centroid: [77.0550, 28.5850],
        coordinates: [[[77.02, 28.56], [77.08, 28.56], [77.08, 28.61], [77.02, 28.61], [77.02, 28.56]]],
        cohorts: { 'General Public': 286000, 'Outdoor Workers': 61600, 'Elderly Residents (65+)': 52800, 'Slum & Informal Settlements': 39600, 'Healthcare Workers': 9100, 'School Authorities': 6100, 'City Administration': 2100, 'DISCOM Engineers': 920 },
        cooling_centers: [
          { name: "Dwarka DDA Air-Conditioned Hall", capacity: 250, address: "Sector 10, Dwarka" }
        ]
      },
      {
        id: "delhi-w5",
        name: "Okhla Industrial Phase III",
        district: "South Delhi",
        population: 580000,
        uhi_offset: 2.3,
        base_hvi: 0.83,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 350,
        baseline_bed_occ: 85,
        cooling_center_count: 4,
        power_substation_stress: "Severe (92% Load)",
        centroid: [77.2710, 28.5350],
        coordinates: [[[77.24, 28.51], [77.30, 28.51], [77.30, 28.56], [77.24, 28.56], [77.24, 28.51]]],
        cohorts: { 'General Public': 377000, 'Outdoor Workers': 162400, 'Elderly Residents (65+)': 34800, 'Slum & Informal Settlements': 145000, 'Healthcare Workers': 5400, 'School Authorities': 2900, 'City Administration': 1400, 'DISCOM Engineers': 1150 },
        cooling_centers: [
          { name: "Okhla Worker Relief Station", capacity: 220, address: "Phase III, Okhla" }
        ]
      },
      {
        id: "delhi-w6",
        name: "Chandni Chowk & Old Delhi Walled City",
        district: "North Delhi",
        population: 490000,
        uhi_offset: 2.5,
        base_hvi: 0.86,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 410,
        baseline_bed_occ: 89,
        cooling_center_count: 4,
        power_substation_stress: "Critical (94% Load)",
        centroid: [77.2300, 28.6560],
        coordinates: [[[77.21, 28.64], [77.25, 28.64], [77.25, 28.68], [77.21, 28.68], [77.21, 28.64]]],
        cohorts: { 'General Public': 318500, 'Outdoor Workers': 117600, 'Elderly Residents (65+)': 58800, 'Slum & Informal Settlements': 98000, 'Healthcare Workers': 7800, 'School Authorities': 3100, 'City Administration': 2400, 'DISCOM Engineers': 710 },
        cooling_centers: [
          { name: "Town Hall Air-Conditioned Public Lounge", capacity: 200, address: "Chandni Chowk Road" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "delhi-s1",
        name: "Rajiv Chowk Metro Air-Conditioned Sanctuary",
        category: "Public Transit Hub",
        address: "Connaught Place Block A, New Delhi",
        operating_hours: "24/7 Continuous Operation",
        lat: 28.6328,
        lon: 77.2197,
        capacity_total: 250,
        current_occupancy: 142,
        ac_type: "HVAC Industrial Chiller",
        ors_stock_packets: 1850,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-11-23340011"
      },
      {
        id: "delhi-s2",
        name: "AIIMS Emergency Heat & ORS Station",
        category: "Medical Facility",
        address: "Sri Aurobindo Marg, Ansari Nagar",
        operating_hours: "24/7 Emergency Care",
        lat: 28.5672,
        lon: 77.2100,
        capacity_total: 200,
        current_occupancy: 185,
        ac_type: "Medical Grade HVAC",
        ors_stock_packets: 3200,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-11-26588500"
      },
      {
        id: "delhi-s3",
        name: "Shahdara Civic Center & AC Library",
        category: "Municipal Building",
        address: "GT Road, Near Shahdara Metro Station",
        operating_hours: "08:00 AM – 10:00 PM",
        lat: 28.6710,
        lon: 77.2750,
        capacity_total: 200,
        current_occupancy: 156,
        ac_type: "Split AC Multi-Zone",
        ors_stock_packets: 950,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-11-22321100"
      },
      {
        id: "delhi-s4",
        name: "Rohini Sector 15 Sports Complex Hub",
        category: "Community Sports Complex",
        address: "Sector 15, Rohini, New Delhi",
        operating_hours: "06:00 AM – 11:00 PM",
        lat: 28.7350,
        lon: 77.1250,
        capacity_total: 350,
        current_occupancy: 110,
        ac_type: "Ducted Air Washer & AC",
        ors_stock_packets: 1400,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-11-27554433"
      }
    ]
  },

  ahmedabad: {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    lat: 23.0225,
    lon: 72.5714,
    zoom: 12,
    authority: "Ahmedabad Municipal Corporation (AMC) Disaster Cell",
    municipal_body: "Ahmedabad Municipal Corporation (AMC)",
    water_utility: "AMC Water Supply Department",
    power_discom: "Torrent Power & UGVCL",
    total_population: 8650000,
    demographics: {
      'General Public': 5600000,
      'Outdoor Workers': 1250000,
      'Elderly Residents (65+)': 680000,
      'Slum & Informal Settlements': 1180000,
      'Healthcare Workers': 92000,
      'School Authorities': 18500,
      'City Administration': 8900,
      'DISCOM Engineers': 2400
    },
    wards: [
      {
        id: "amd-w1",
        name: "Gomtipur & Industrial Mills Corridor",
        district: "East Zone",
        population: 480000,
        uhi_offset: 2.4,
        base_hvi: 0.88,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 380,
        baseline_bed_occ: 89,
        cooling_center_count: 5,
        power_substation_stress: "Critical (95% Load)",
        centroid: [72.6150, 23.0180],
        coordinates: [[[72.59, 23.00], [72.64, 23.00], [72.64, 23.04], [72.59, 23.04], [72.59, 23.00]]],
        cohorts: { 'General Public': 290000, 'Outdoor Workers': 135000, 'Elderly Residents (65+)': 36000, 'Slum & Informal Settlements': 142000, 'Healthcare Workers': 4800, 'School Authorities': 2200, 'City Administration': 1100, 'DISCOM Engineers': 420 },
        cooling_centers: [
          { name: "Gomtipur AMC Urban Health Center", capacity: 200, address: "Near Gomtipur Railway Crossing" },
          { name: "Sarangpur Mills Labor Relief Hall", capacity: 250, address: "Amraiwadi Road" }
        ]
      },
      {
        id: "amd-w2",
        name: "Danilimda & Chandola Lake Informal Belt",
        district: "South Zone",
        population: 520000,
        uhi_offset: 2.6,
        base_hvi: 0.91,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 290,
        baseline_bed_occ: 93,
        cooling_center_count: 4,
        power_substation_stress: "Critical (98% Load)",
        centroid: [72.5850, 22.9850],
        coordinates: [[[72.56, 22.96], [72.61, 22.96], [72.61, 23.00], [72.56, 23.00], [72.56, 22.96]]],
        cohorts: { 'General Public': 310000, 'Outdoor Workers': 158000, 'Elderly Residents (65+)': 39000, 'Slum & Informal Settlements': 168000, 'Healthcare Workers': 4100, 'School Authorities': 1800, 'City Administration': 950, 'DISCOM Engineers': 380 },
        cooling_centers: [
          { name: "Chandola Lake Community Sanctuary", capacity: 180, address: "Danilimda Main Road" }
        ]
      },
      {
        id: "amd-w3",
        name: "Navrangpura & Ashram Road",
        district: "West Zone",
        population: 390000,
        uhi_offset: 1.1,
        base_hvi: 0.62,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 620,
        baseline_bed_occ: 64,
        cooling_center_count: 7,
        power_substation_stress: "Normal (65% Load)",
        centroid: [72.5550, 23.0350],
        coordinates: [[[72.53, 23.01], [72.58, 23.01], [72.58, 23.06], [72.53, 23.06], [72.53, 23.01]]],
        cohorts: { 'General Public': 275000, 'Outdoor Workers': 52000, 'Elderly Residents (65+)': 54000, 'Slum & Informal Settlements': 28000, 'Healthcare Workers': 12500, 'School Authorities': 4800, 'City Administration': 2800, 'DISCOM Engineers': 750 },
        cooling_centers: [
          { name: "AMC Sardar Patel Bhavan Sanctuary", capacity: 300, address: "Ashram Road, Navrangpura" },
          { name: "Gujarat University Convention Hall", capacity: 400, address: "Navrangpura" }
        ]
      },
      {
        id: "amd-w4",
        name: "Kalupur & Historic Walled City",
        district: "Central Zone",
        population: 440000,
        uhi_offset: 2.1,
        base_hvi: 0.82,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 450,
        baseline_bed_occ: 84,
        cooling_center_count: 6,
        power_substation_stress: "Severe (90% Load)",
        centroid: [72.5980, 23.0280],
        coordinates: [[[72.58, 23.01], [72.62, 23.01], [72.62, 23.05], [72.58, 23.05], [72.58, 23.01]]],
        cohorts: { 'General Public': 295000, 'Outdoor Workers': 98000, 'Elderly Residents (65+)': 49000, 'Slum & Informal Settlements': 72000, 'Healthcare Workers': 7200, 'School Authorities': 2900, 'City Administration': 1900, 'DISCOM Engineers': 590 },
        cooling_centers: [
          { name: "Kalupur Railway Station AC Pavilion", capacity: 350, address: "Kalupur Railway Station" }
        ]
      },
      {
        id: "amd-w5",
        name: "Maninagar & Kankaria Basin",
        district: "South East Zone",
        population: 410000,
        uhi_offset: 1.4,
        base_hvi: 0.69,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 490,
        baseline_bed_occ: 71,
        cooling_center_count: 6,
        power_substation_stress: "Moderate (73% Load)",
        centroid: [72.6020, 22.9980],
        coordinates: [[[72.58, 22.97], [72.63, 22.97], [72.63, 23.01], [72.58, 23.01], [72.58, 22.97]]],
        cohorts: { 'General Public': 280000, 'Outdoor Workers': 68000, 'Elderly Residents (65+)': 46000, 'Slum & Informal Settlements': 52000, 'Healthcare Workers': 8100, 'School Authorities': 3400, 'City Administration': 1600, 'DISCOM Engineers': 610 },
        cooling_centers: [
          { name: "Kankaria Lake AC Public Pavilion", capacity: 250, address: "Gate 3, Kankaria" }
        ]
      },
      {
        id: "amd-w6",
        name: "Bopal & South West Suburban Core",
        district: "New West Zone",
        population: 360000,
        uhi_offset: 0.7,
        base_hvi: 0.52,
        hvi_tier: "Low",
        hvi_color: "#10b981",
        hospital_beds: 350,
        baseline_bed_occ: 55,
        cooling_center_count: 5,
        power_substation_stress: "Normal (58% Load)",
        centroid: [72.4650, 23.0320],
        coordinates: [[[72.44, 23.01], [72.49, 23.01], [72.49, 23.06], [72.44, 23.06], [72.44, 23.01]]],
        cohorts: { 'General Public': 260000, 'Outdoor Workers': 39000, 'Elderly Residents (65+)': 42000, 'Slum & Informal Settlements': 21000, 'Healthcare Workers': 6900, 'School Authorities': 3800, 'City Administration': 1400, 'DISCOM Engineers': 490 },
        cooling_centers: [
          { name: "Bopal Civic Center", capacity: 180, address: "Bopal Main Road" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "amd-s1",
        name: "AMC Sardar Patel Bhavan Cooling Sanctuary",
        category: "Municipal Headquarters",
        address: "Ashram Road, Usmanpura, Ahmedabad",
        operating_hours: "24/7 Heatwave Emergency Response",
        lat: 23.0410,
        lon: 72.5690,
        capacity_total: 300,
        current_occupancy: 165,
        ac_type: "Central Chilled Water HVAC",
        ors_stock_packets: 4500,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-79-27550000"
      },
      {
        id: "amd-s2",
        name: "Gomtipur Urban Health Center & ORS Hub",
        category: "Primary Healthcare Facility",
        address: "Opp. Sarangpur Gate, Gomtipur",
        operating_hours: "07:00 AM – 10:00 PM",
        lat: 23.0180,
        lon: 72.6150,
        capacity_total: 200,
        current_occupancy: 172,
        ac_type: "Medical Grade Split AC",
        ors_stock_packets: 2800,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-79-22741122"
      },
      {
        id: "amd-s3",
        name: "Kalupur Railway Station AC Waiting Lounge",
        category: "Transit Hub Sanctuary",
        address: "Ahmedabad Central Junction, Kalupur",
        operating_hours: "24/7 Continuous Operation",
        lat: 23.0280,
        lon: 72.5980,
        capacity_total: 350,
        current_occupancy: 210,
        ac_type: "Ducted Air System",
        ors_stock_packets: 3100,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-79-22144400"
      },
      {
        id: "amd-s4",
        name: "Chandola Lake Community Cooling Unit",
        category: "Informal Settlement Shelter",
        address: "Danilimda-Isanpur Road, Ahmedabad",
        operating_hours: "08:00 AM – 09:00 PM",
        lat: 22.9850,
        lon: 72.5850,
        capacity_total: 180,
        current_occupancy: 154,
        ac_type: "High Efficiency Misting & Split AC",
        ors_stock_packets: 1900,
        ice_immersion_facility: true,
        wheelchair_accessible: false,
        contact: "+91-79-25339900"
      }
    ]
  },

  mumbai: {
    id: "mumbai",
    name: "Mumbai MMR",
    state: "Maharashtra",
    country: "India",
    lat: 19.0760,
    lon: 72.8777,
    zoom: 11,
    authority: "Brihanmumbai Municipal Corporation (BMC) Disaster Cell",
    municipal_body: "Brihanmumbai Municipal Corporation (BMC / MCGM)",
    water_utility: "BMC Hydraulic Engineering Department",
    power_discom: "BEST, Adani Electricity & Tata Power",
    total_population: 21300000,
    demographics: {
      'General Public': 14200000,
      'Outdoor Workers': 2850000,
      'Elderly Residents (65+)': 1650000,
      'Slum & Informal Settlements': 3950000,
      'Healthcare Workers': 195000,
      'School Authorities': 32000,
      'City Administration': 16500,
      'DISCOM Engineers': 4100
    },
    wards: [
      {
        id: "mum-w1",
        name: "Dharavi & Matunga Labor Corridor",
        district: "G/North Ward",
        population: 850000,
        uhi_offset: 2.8,
        base_hvi: 0.94,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 410,
        baseline_bed_occ: 92,
        cooling_center_count: 5,
        power_substation_stress: "Critical (96% Load)",
        centroid: [72.8550, 19.0410],
        coordinates: [[[72.83, 19.02], [72.88, 19.02], [72.88, 19.06], [72.83, 19.06], [72.83, 19.02]]],
        cohorts: { 'General Public': 510000, 'Outdoor Workers': 265000, 'Elderly Residents (65+)': 62000, 'Slum & Informal Settlements': 320000, 'Healthcare Workers': 6800, 'School Authorities': 3200, 'City Administration': 1900, 'DISCOM Engineers': 650 },
        cooling_centers: [
          { name: "Dharavi Transit Camp AC Relief Center", capacity: 300, address: "90 Feet Road, Dharavi" },
          { name: "Matunga Labor Guild Hall", capacity: 220, address: "Near Matunga Station" }
        ]
      },
      {
        id: "mum-w2",
        name: "Kurla & BKC Industrial Basin",
        district: "L Ward",
        population: 780000,
        uhi_offset: 2.2,
        base_hvi: 0.85,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 520,
        baseline_bed_occ: 86,
        cooling_center_count: 6,
        power_substation_stress: "Severe (91% Load)",
        centroid: [72.8750, 19.0680],
        coordinates: [[[72.85, 19.05], [72.90, 19.05], [72.90, 19.09], [72.85, 19.09], [72.85, 19.05]]],
        cohorts: { 'General Public': 490000, 'Outdoor Workers': 195000, 'Elderly Residents (65+)': 68000, 'Slum & Informal Settlements': 210000, 'Healthcare Workers': 9400, 'School Authorities': 3900, 'City Administration': 2400, 'DISCOM Engineers': 780 },
        cooling_centers: [
          { name: "BKC MMRDA Public Sanctuary", capacity: 400, address: "Bandra Kurla Complex Block G" }
        ]
      },
      {
        id: "mum-w3",
        name: "Govandi & Chembur East Informal Belt",
        district: "M/East Ward",
        population: 720000,
        uhi_offset: 2.5,
        base_hvi: 0.92,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 340,
        baseline_bed_occ: 94,
        cooling_center_count: 4,
        power_substation_stress: "Critical (97% Load)",
        centroid: [72.9250, 19.0550],
        coordinates: [[[72.90, 19.03], [72.95, 19.03], [72.95, 19.08], [72.90, 19.08], [72.90, 19.03]]],
        cohorts: { 'General Public': 440000, 'Outdoor Workers': 215000, 'Elderly Residents (65+)': 54000, 'Slum & Informal Settlements': 260000, 'Healthcare Workers': 4900, 'School Authorities': 2500, 'City Administration': 1400, 'DISCOM Engineers': 540 },
        cooling_centers: [
          { name: "Govandi Municipal Health Pavilion", capacity: 250, address: "Govandi Station Road" }
        ]
      },
      {
        id: "mum-w4",
        name: "Andheri East MIDC & Transit Core",
        district: "K/East Ward",
        population: 890000,
        uhi_offset: 1.7,
        base_hvi: 0.73,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 680,
        baseline_bed_occ: 79,
        cooling_center_count: 8,
        power_substation_stress: "Severe (88% Load)",
        centroid: [72.8680, 19.1150],
        coordinates: [[[72.84, 19.09], [72.90, 19.09], [72.90, 19.14], [72.84, 19.14], [72.84, 19.09]]],
        cohorts: { 'General Public': 590000, 'Outdoor Workers': 185000, 'Elderly Residents (65+)': 82000, 'Slum & Informal Settlements': 145000, 'Healthcare Workers': 14200, 'School Authorities': 5800, 'City Administration': 3100, 'DISCOM Engineers': 920 },
        cooling_centers: [
          { name: "Andheri Metro Interchange Sanctuary", capacity: 350, address: "Andheri East Metro Station" }
        ]
      },
      {
        id: "mum-w5",
        name: "Nariman Point & Fort Financial Wharf",
        district: "A Ward",
        population: 310000,
        uhi_offset: 1.0,
        base_hvi: 0.54,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 750,
        baseline_bed_occ: 61,
        cooling_center_count: 6,
        power_substation_stress: "Normal (64% Load)",
        centroid: [72.8280, 18.9280],
        coordinates: [[[72.81, 18.91], [72.85, 18.91], [72.85, 18.95], [72.81, 18.95], [72.81, 18.91]]],
        cohorts: { 'General Public': 220000, 'Outdoor Workers': 38000, 'Elderly Residents (65+)': 44000, 'Slum & Informal Settlements': 16000, 'Healthcare Workers': 18500, 'School Authorities': 3100, 'City Administration': 4800, 'DISCOM Engineers': 620 },
        cooling_centers: [
          { name: "CSMT Heritage Concourse Cooling Hall", capacity: 450, address: "CSMT Station, Fort" }
        ]
      },
      {
        id: "mum-w6",
        name: "Borivali West & Gorai Coastal Basin",
        district: "R/Central Ward",
        population: 620000,
        uhi_offset: 0.8,
        base_hvi: 0.51,
        hvi_tier: "Low",
        hvi_color: "#10b981",
        hospital_beds: 580,
        baseline_bed_occ: 58,
        cooling_center_count: 7,
        power_substation_stress: "Normal (60% Load)",
        centroid: [72.8520, 19.2300],
        coordinates: [[[72.83, 19.20], [72.88, 19.20], [72.88, 19.25], [72.83, 19.25], [72.83, 19.20]]],
        cohorts: { 'General Public': 430000, 'Outdoor Workers': 72000, 'Elderly Residents (65+)': 76000, 'Slum & Informal Settlements': 48000, 'Healthcare Workers': 9800, 'School Authorities': 4900, 'City Administration': 1900, 'DISCOM Engineers': 590 },
        cooling_centers: [
          { name: "Borivali Sports Pavilion & AC Hall", capacity: 300, address: "Eksar Road, Borivali West" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "mum-s1",
        name: "Dharavi Transit Camp Air-Conditioned Shelter",
        category: "High-Density Community Center",
        address: "90 Feet Road, Dharavi, Mumbai",
        operating_hours: "24/7 Heat Emergency Operations",
        lat: 19.0410,
        lon: 72.8550,
        capacity_total: 300,
        current_occupancy: 245,
        ac_type: "High-Capacity Dual Chiller",
        ors_stock_packets: 4800,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-22-24071100"
      },
      {
        id: "mum-s2",
        name: "KEM Hospital Parel Acute Heatstroke Ward",
        category: "Tertiary Healthcare Center",
        address: "Acharya Donde Marg, Parel, Mumbai",
        operating_hours: "24/7 Trauma & Resuscitation",
        lat: 19.0024,
        lon: 72.8428,
        capacity_total: 250,
        current_occupancy: 220,
        ac_type: "Medical Intensive HVAC",
        ors_stock_packets: 6200,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-22-24107000"
      },
      {
        id: "mum-s3",
        name: "CSMT Passenger Cooling Concourse",
        category: "Public Railway Sanctuary",
        address: "Chhatrapati Shivaji Maharaj Terminus, Fort",
        operating_hours: "24/7 Continuous Operation",
        lat: 18.9400,
        lon: 72.8353,
        capacity_total: 450,
        current_occupancy: 310,
        ac_type: "Central Station Ducted Air",
        ors_stock_packets: 3900,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-22-22620155"
      },
      {
        id: "mum-s4",
        name: "BKC MMRDA Multi-Purpose AC Pavilion",
        category: "Civic Exhibition Sanctuary",
        address: "Bandra Kurla Complex, Bandra East",
        operating_hours: "07:00 AM – 11:00 PM",
        lat: 19.0680,
        lon: 72.8750,
        capacity_total: 400,
        current_occupancy: 180,
        ac_type: "HVAC Industrial Unit",
        ors_stock_packets: 2500,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-22-26590001"
      }
    ]
  },

  kolkata: {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    lat: 22.5726,
    lon: 88.3639,
    zoom: 12,
    authority: "Kolkata Municipal Corporation (KMC) Disaster Management",
    municipal_body: "Kolkata Municipal Corporation (KMC)",
    water_utility: "KMC Water Supply & Pumping Stations",
    power_discom: "CESC & WBSEDCL",
    total_population: 15100000,
    demographics: {
      'General Public': 10200000,
      'Outdoor Workers': 2100000,
      'Elderly Residents (65+)': 1420000,
      'Slum & Informal Settlements': 2650000,
      'Healthcare Workers': 140000,
      'School Authorities': 24000,
      'City Administration': 12500,
      'DISCOM Engineers': 3200
    },
    wards: [
      {
        id: "kol-w1",
        name: "Topsia & Tangra Industrial Basin",
        district: "Borough VII",
        population: 580000,
        uhi_offset: 2.5,
        base_hvi: 0.90,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 360,
        baseline_bed_occ: 90,
        cooling_center_count: 4,
        power_substation_stress: "Critical (94% Load)",
        centroid: [88.3910, 22.5450],
        coordinates: [[[88.37, 22.52], [88.42, 22.52], [88.42, 22.57], [88.37, 22.57], [88.37, 22.52]]],
        cohorts: { 'General Public': 360000, 'Outdoor Workers': 165000, 'Elderly Residents (65+)': 44000, 'Slum & Informal Settlements': 195000, 'Healthcare Workers': 5200, 'School Authorities': 2400, 'City Administration': 1200, 'DISCOM Engineers': 490 },
        cooling_centers: [
          { name: "Topsia Municipal Relief Hub", capacity: 220, address: "Topsia Main Road" }
        ]
      },
      {
        id: "kol-w2",
        name: "BBD Bagh & Howrah Wharf Gateway",
        district: "Borough IV / V",
        population: 460000,
        uhi_offset: 1.9,
        base_hvi: 0.79,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 580,
        baseline_bed_occ: 83,
        cooling_center_count: 6,
        power_substation_stress: "Severe (89% Load)",
        centroid: [88.3510, 22.5720],
        coordinates: [[[88.33, 22.55], [88.37, 22.55], [88.37, 22.59], [88.33, 22.59], [88.33, 22.55]]],
        cohorts: { 'General Public': 310000, 'Outdoor Workers': 98000, 'Elderly Residents (65+)': 52000, 'Slum & Informal Settlements': 68000, 'Healthcare Workers': 14200, 'School Authorities': 3100, 'City Administration': 3800, 'DISCOM Engineers': 720 },
        cooling_centers: [
          { name: "Howrah Station AC Passenger Sanctuary", capacity: 400, address: "Station Road, Howrah" }
        ]
      },
      {
        id: "kol-w3",
        name: "Salt Lake Sector V & New Town IT Belt",
        district: "Bidhannagar / Sector V",
        population: 520000,
        uhi_offset: 0.9,
        base_hvi: 0.55,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 610,
        baseline_bed_occ: 62,
        cooling_center_count: 7,
        power_substation_stress: "Normal (68% Load)",
        centroid: [88.4350, 22.5820],
        coordinates: [[[88.41, 22.56], [88.46, 22.56], [88.46, 22.61], [88.41, 22.61], [88.41, 22.56]]],
        cohorts: { 'General Public': 380000, 'Outdoor Workers': 62000, 'Elderly Residents (65+)': 58000, 'Slum & Informal Settlements': 34000, 'Healthcare Workers': 11500, 'School Authorities': 4900, 'City Administration': 2200, 'DISCOM Engineers': 680 },
        cooling_centers: [
          { name: "Karunamoyee Transit Hub AC Hall", capacity: 300, address: "Salt Lake Central Park" }
        ]
      },
      {
        id: "kol-w4",
        name: "Burrabazar & Posta Wholesale Corridor",
        district: "Borough V",
        population: 410000,
        uhi_offset: 2.3,
        base_hvi: 0.86,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 390,
        baseline_bed_occ: 88,
        cooling_center_count: 5,
        power_substation_stress: "Severe (93% Load)",
        centroid: [88.3580, 22.5880],
        coordinates: [[[88.34, 22.57], [88.38, 22.57], [88.38, 22.61], [88.34, 22.61], [88.34, 22.57]]],
        cohorts: { 'General Public': 270000, 'Outdoor Workers': 115000, 'Elderly Residents (65+)': 42000, 'Slum & Informal Settlements': 88000, 'Healthcare Workers': 4800, 'School Authorities': 2100, 'City Administration': 1500, 'DISCOM Engineers': 510 },
        cooling_centers: [
          { name: "Posta Merchants Civic Cooling Pavilion", capacity: 200, address: "Maharshi Debendra Road" }
        ]
      },
      {
        id: "kol-w5",
        name: "Behala & Jadavpur South Zone",
        district: "Borough X / XIV",
        population: 650000,
        uhi_offset: 1.2,
        base_hvi: 0.64,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 540,
        baseline_bed_occ: 70,
        cooling_center_count: 6,
        power_substation_stress: "Moderate (74% Load)",
        centroid: [88.3300, 22.4950],
        coordinates: [[[88.30, 22.47], [88.35, 22.47], [88.35, 22.52], [88.30, 22.52], [88.30, 22.47]]],
        cohorts: { 'General Public': 450000, 'Outdoor Workers': 84000, 'Elderly Residents (65+)': 82000, 'Slum & Informal Settlements': 64000, 'Healthcare Workers': 9200, 'School Authorities': 4100, 'City Administration': 1800, 'DISCOM Engineers': 590 },
        cooling_centers: [
          { name: "Behala Tram Depot AC Passenger Hub", capacity: 250, address: "Diamond Harbour Road" }
        ]
      },
      {
        id: "kol-w6",
        name: "Shyambazar & North Kolkata Heritage Core",
        district: "Borough I / II",
        population: 480000,
        uhi_offset: 1.8,
        base_hvi: 0.77,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 490,
        baseline_bed_occ: 80,
        cooling_center_count: 5,
        power_substation_stress: "Severe (87% Load)",
        centroid: [88.3720, 22.6020],
        coordinates: [[[88.35, 22.58], [88.40, 22.58], [88.40, 22.63], [88.35, 22.63], [88.35, 22.58]]],
        cohorts: { 'General Public': 330000, 'Outdoor Workers': 89000, 'Elderly Residents (65+)': 64000, 'Slum & Informal Settlements': 72000, 'Healthcare Workers': 8100, 'School Authorities': 3500, 'City Administration': 1900, 'DISCOM Engineers': 580 },
        cooling_centers: [
          { name: "RG Kar Medical College Heat Oasis", capacity: 280, address: "Khudiram Bose Sarani" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "kol-s1",
        name: "SSKM Hospital Emergency Acute Thermal Unit",
        category: "Tertiary Medical Center",
        address: "AJC Bose Road, Bhowanipore, Kolkata",
        operating_hours: "24/7 Emergency & ICU Care",
        lat: 22.5390,
        lon: 88.3420,
        capacity_total: 280,
        current_occupancy: 235,
        ac_type: "Medical Grade Cleanroom HVAC",
        ors_stock_packets: 5200,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-33-22231589"
      },
      {
        id: "kol-s2",
        name: "Howrah Station Air-Conditioned Passenger Sanctuary",
        category: "Railway Transit Gateway",
        address: "Station Road, Howrah Junction",
        operating_hours: "24/7 Continuous Operation",
        lat: 22.5850,
        lon: 88.3420,
        capacity_total: 400,
        current_occupancy: 290,
        ac_type: "Industrial High-Volume Chiller",
        ors_stock_packets: 3600,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-33-26602581"
      },
      {
        id: "kol-s3",
        name: "Netaji Indoor Stadium Community Sanctuary",
        category: "Municipal Disaster Sanctuary",
        address: "Eden Gardens Enclosure, Strand Road",
        operating_hours: "06:00 AM – 10:00 PM",
        lat: 22.5680,
        lon: 88.3440,
        capacity_total: 500,
        current_occupancy: 210,
        ac_type: "Stadium-Grade Industrial HVAC",
        ors_stock_packets: 4100,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-33-22480055"
      },
      {
        id: "kol-s4",
        name: "Karunamoyee Salt Lake Public Sanctuary",
        category: "Public Transit Hub",
        address: "Central Park Metro Terminal, Salt Lake",
        operating_hours: "07:00 AM – 09:30 PM",
        lat: 22.5820,
        lon: 88.4190,
        capacity_total: 300,
        current_occupancy: 145,
        ac_type: "Split AC Centralized Cluster",
        ors_stock_packets: 2200,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-33-23597700"
      }
    ]
  },

  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
    lat: 17.3850,
    lon: 78.4867,
    zoom: 12,
    authority: "Greater Hyderabad Municipal Corporation (GHMC) Disaster Unit",
    municipal_body: "Greater Hyderabad Municipal Corporation (GHMC)",
    water_utility: "HMWSSB (Hyderabad Metro Water)",
    power_discom: "TSSPDCL",
    total_population: 10800000,
    demographics: {
      'General Public': 7200000,
      'Outdoor Workers': 1650000,
      'Elderly Residents (65+)': 890000,
      'Slum & Informal Settlements': 1580000,
      'Healthcare Workers': 125000,
      'School Authorities': 21000,
      'City Administration': 11000,
      'DISCOM Engineers': 2900
    },
    wards: [
      {
        id: "hyd-w1",
        name: "Charminar & Old City Heritage Corridor",
        district: "South Zone",
        population: 680000,
        uhi_offset: 2.4,
        base_hvi: 0.87,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 480,
        baseline_bed_occ: 91,
        cooling_center_count: 5,
        power_substation_stress: "Critical (95% Load)",
        centroid: [78.4740, 17.3610],
        coordinates: [[[78.45, 17.34], [78.50, 17.34], [78.50, 17.38], [78.45, 17.38], [78.45, 17.34]]],
        cohorts: { 'General Public': 440000, 'Outdoor Workers': 175000, 'Elderly Residents (65+)': 62000, 'Slum & Informal Settlements': 190000, 'Healthcare Workers': 6800, 'School Authorities': 2900, 'City Administration': 1600, 'DISCOM Engineers': 580 },
        cooling_centers: [
          { name: "Osmania General Hospital Thermal Care Wing", capacity: 260, address: "Afzal Gunj, Charminar" }
        ]
      },
      {
        id: "hyd-w2",
        name: "Sanathnagar & Balanagar Industrial Zone",
        district: "North Zone",
        population: 590000,
        uhi_offset: 2.6,
        base_hvi: 0.89,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 420,
        baseline_bed_occ: 89,
        cooling_center_count: 4,
        power_substation_stress: "Critical (97% Load)",
        centroid: [78.4410, 17.4650],
        coordinates: [[[78.42, 17.44], [78.47, 17.44], [78.47, 17.49], [78.42, 17.49], [78.42, 17.44]]],
        cohorts: { 'General Public': 380000, 'Outdoor Workers': 168000, 'Elderly Residents (65+)': 48000, 'Slum & Informal Settlements': 165000, 'Healthcare Workers': 5900, 'School Authorities': 2600, 'City Administration': 1400, 'DISCOM Engineers': 620 },
        cooling_centers: [
          { name: "ESI Hospital Sanathnagar Relief Pavilion", capacity: 220, address: "Sanathnagar Main Road" }
        ]
      },
      {
        id: "hyd-w3",
        name: "HITEC City & Madhapur IT Corridor",
        district: "West Zone (Serilingampally)",
        population: 540000,
        uhi_offset: 0.9,
        base_hvi: 0.51,
        hvi_tier: "Low",
        hvi_color: "#10b981",
        hospital_beds: 650,
        baseline_bed_occ: 58,
        cooling_center_count: 8,
        power_substation_stress: "Normal (63% Load)",
        centroid: [78.3810, 17.4480],
        coordinates: [[[78.36, 17.42], [78.41, 17.42], [78.41, 17.47], [78.36, 17.47], [78.36, 17.42]]],
        cohorts: { 'General Public': 410000, 'Outdoor Workers': 58000, 'Elderly Residents (65+)': 49000, 'Slum & Informal Settlements': 28000, 'Healthcare Workers': 16200, 'School Authorities': 5200, 'City Administration': 2800, 'DISCOM Engineers': 790 },
        cooling_centers: [
          { name: "Shilparamam Shaded Cultural Pavilion", capacity: 350, address: "HITEC City Main Road" }
        ]
      },
      {
        id: "hyd-w4",
        name: "Secunderabad Cantonment & Rail Hub",
        district: "Secunderabad Zone",
        population: 610000,
        uhi_offset: 1.8,
        base_hvi: 0.74,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 590,
        baseline_bed_occ: 82,
        cooling_center_count: 6,
        power_substation_stress: "Severe (88% Load)",
        centroid: [78.5020, 17.4410],
        coordinates: [[[78.48, 17.42], [78.53, 17.42], [78.53, 17.47], [78.48, 17.47], [78.48, 17.42]]],
        cohorts: { 'General Public': 420000, 'Outdoor Workers': 112000, 'Elderly Residents (65+)': 68000, 'Slum & Informal Settlements': 82000, 'Healthcare Workers': 12400, 'School Authorities': 3800, 'City Administration': 2400, 'DISCOM Engineers': 710 },
        cooling_centers: [
          { name: "Secunderabad Station AC Passenger Hall", capacity: 380, address: "Secunderabad Station Road" }
        ]
      },
      {
        id: "hyd-w5",
        name: "Kukatpally & KPHB Density Node",
        district: "Kukatpally Zone",
        population: 640000,
        uhi_offset: 1.5,
        base_hvi: 0.67,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 510,
        baseline_bed_occ: 73,
        cooling_center_count: 6,
        power_substation_stress: "Moderate (76% Load)",
        centroid: [78.3980, 17.4950],
        coordinates: [[[78.37, 17.47], [78.42, 17.47], [78.42, 17.52], [78.37, 17.52], [78.37, 17.47]]],
        cohorts: { 'General Public': 460000, 'Outdoor Workers': 88000, 'Elderly Residents (65+)': 64000, 'Slum & Informal Settlements': 62000, 'Healthcare Workers': 8900, 'School Authorities': 4200, 'City Administration': 1900, 'DISCOM Engineers': 640 },
        cooling_centers: [
          { name: "KPHB Civic Indoor Sports Arena", capacity: 260, address: "KPHB Phase 1" }
        ]
      },
      {
        id: "hyd-w6",
        name: "LB Nagar & Dilsukhnagar East Gate",
        district: "East Zone",
        population: 580000,
        uhi_offset: 1.6,
        base_hvi: 0.71,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 470,
        baseline_bed_occ: 77,
        cooling_center_count: 5,
        power_substation_stress: "Moderate (79% Load)",
        centroid: [78.5520, 17.3480],
        coordinates: [[[78.53, 17.32], [78.58, 17.32], [78.58, 17.37], [78.53, 17.37], [78.53, 17.32]]],
        cohorts: { 'General Public': 410000, 'Outdoor Workers': 94000, 'Elderly Residents (65+)': 58000, 'Slum & Informal Settlements': 76000, 'Healthcare Workers': 7800, 'School Authorities': 3400, 'City Administration': 1700, 'DISCOM Engineers': 590 },
        cooling_centers: [
          { name: "LB Nagar Metro Air-Conditioned Hub", capacity: 240, address: "LB Nagar Junction" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "hyd-s1",
        name: "Osmania General Hospital Thermal Care Wing",
        category: "Apex Medical Facility",
        address: "Afzal Gunj, High Court Road, Hyderabad",
        operating_hours: "24/7 Critical Emergency Care",
        lat: 17.3760,
        lon: 78.4760,
        capacity_total: 260,
        current_occupancy: 215,
        ac_type: "Medical Intensive Chiller",
        ors_stock_packets: 4900,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-40-24600121"
      },
      {
        id: "hyd-s2",
        name: "Secunderabad Railway AC Passenger Sanctuary",
        category: "Railway Station Gateway",
        address: "Secunderabad Railway Junction",
        operating_hours: "24/7 Continuous Operation",
        lat: 17.4340,
        lon: 78.5020,
        capacity_total: 380,
        current_occupancy: 260,
        ac_type: "Industrial High-Volume Duct System",
        ors_stock_packets: 3200,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-40-27786170"
      },
      {
        id: "hyd-s3",
        name: "Shilparamam Shaded Public Oasis",
        category: "Community Cultural Park",
        address: "Hi-Tech City Main Road, Madhapur",
        operating_hours: "09:00 AM – 09:30 PM",
        lat: 17.4520,
        lon: 78.3780,
        capacity_total: 350,
        current_occupancy: 130,
        ac_type: "Misting System + Indoor AC Halls",
        ors_stock_packets: 2100,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-40-64518164"
      },
      {
        id: "hyd-s4",
        name: "GHMC Jubilee Community Center",
        category: "Municipal Air-Conditioned Hall",
        address: "Road No. 36, Jubilee Hills",
        operating_hours: "08:00 AM – 10:00 PM",
        lat: 17.4320,
        lon: 78.4080,
        capacity_total: 200,
        current_occupancy: 95,
        ac_type: "Split AC Central Hub",
        ors_stock_packets: 1800,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-40-21111111"
      }
    ]
  },

  chennai: {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    lat: 13.0827,
    lon: 80.2707,
    zoom: 12,
    authority: "Greater Chennai Corporation (GCC) Disaster Management Cell",
    municipal_body: "Greater Chennai Corporation (GCC)",
    water_utility: "CMWSSB (Chennai MetroWater)",
    power_discom: "TANGEDCO",
    total_population: 11500000,
    demographics: {
      'General Public': 7900000,
      'Outdoor Workers': 1720000,
      'Elderly Residents (65+)': 1120000,
      'Slum & Informal Settlements': 1680000,
      'Healthcare Workers': 145000,
      'School Authorities': 22500,
      'City Administration': 11800,
      'DISCOM Engineers': 3100
    },
    wards: [
      {
        id: "chn-w1",
        name: "Vyasarpadi & North Harbor Labor Belt",
        district: "Zone IV (Tondiarpet)",
        population: 620000,
        uhi_offset: 2.7,
        base_hvi: 0.92,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 390,
        baseline_bed_occ: 93,
        cooling_center_count: 4,
        power_substation_stress: "Critical (97% Load)",
        centroid: [80.2610, 13.1180],
        coordinates: [[[80.24, 13.09], [80.29, 13.09], [80.29, 13.14], [80.24, 13.14], [80.24, 13.09]]],
        cohorts: { 'General Public': 390000, 'Outdoor Workers': 185000, 'Elderly Residents (65+)': 52000, 'Slum & Informal Settlements': 195000, 'Healthcare Workers': 5100, 'School Authorities': 2400, 'City Administration': 1300, 'DISCOM Engineers': 540 },
        cooling_centers: [
          { name: "Vyasarpadi Community Health ORS Center", capacity: 200, address: "Kalyanapuram Main Road" }
        ]
      },
      {
        id: "chn-w2",
        name: "George Town & Chennai Port Core",
        district: "Zone V (Royapuram)",
        population: 480000,
        uhi_offset: 2.1,
        base_hvi: 0.83,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 560,
        baseline_bed_occ: 87,
        cooling_center_count: 5,
        power_substation_stress: "Severe (91% Load)",
        centroid: [80.2850, 13.0920],
        coordinates: [[[80.26, 13.07], [80.31, 13.07], [80.31, 13.11], [80.26, 13.11], [80.26, 13.07]]],
        cohorts: { 'General Public': 320000, 'Outdoor Workers': 125000, 'Elderly Residents (65+)': 58000, 'Slum & Informal Settlements': 82000, 'Healthcare Workers': 14200, 'School Authorities': 2900, 'City Administration': 2800, 'DISCOM Engineers': 680 },
        cooling_centers: [
          { name: "Chennai Central Railway AC Passenger Sanctuary", capacity: 420, address: "EVR Periyar Salai, Park Town" }
        ]
      },
      {
        id: "chn-w3",
        name: "T. Nagar & Commercial Core",
        district: "Zone X (Kodambakkam)",
        population: 530000,
        uhi_offset: 1.8,
        base_hvi: 0.74,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 620,
        baseline_bed_occ: 79,
        cooling_center_count: 7,
        power_substation_stress: "Severe (88% Load)",
        centroid: [80.2320, 13.0410],
        coordinates: [[[80.21, 13.02], [80.25, 13.02], [80.25, 13.06], [80.21, 13.06], [80.21, 13.02]]],
        cohorts: { 'General Public': 370000, 'Outdoor Workers': 86000, 'Elderly Residents (65+)': 68000, 'Slum & Informal Settlements': 52000, 'Healthcare Workers': 12100, 'School Authorities': 3800, 'City Administration': 2100, 'DISCOM Engineers': 710 },
        cooling_centers: [
          { name: "T. Nagar Bus Terminus Air-Conditioned Rest Hub", capacity: 280, address: "Usman Road, T. Nagar" }
        ]
      },
      {
        id: "chn-w4",
        name: "Guindy Industrial Estate & Transit Hub",
        district: "Zone IX (Guindy)",
        population: 490000,
        uhi_offset: 2.2,
        base_hvi: 0.81,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 470,
        baseline_bed_occ: 83,
        cooling_center_count: 5,
        power_substation_stress: "Severe (89% Load)",
        centroid: [80.2110, 13.0080],
        coordinates: [[[80.19, 12.98], [80.23, 12.98], [80.23, 13.03], [80.19, 13.03], [80.19, 12.98]]],
        cohorts: { 'General Public': 330000, 'Outdoor Workers': 132000, 'Elderly Residents (65+)': 49000, 'Slum & Informal Settlements': 92000, 'Healthcare Workers': 8400, 'School Authorities': 2800, 'City Administration': 1600, 'DISCOM Engineers': 650 },
        cooling_centers: [
          { name: "Guindy Industrial Worker Relief Pavilion", capacity: 250, address: "Guindy Industrial Estate" }
        ]
      },
      {
        id: "chn-w5",
        name: "Sholinganallur OMR IT Corridor",
        district: "Zone XV (Sholinganallur)",
        population: 440000,
        uhi_offset: 0.8,
        base_hvi: 0.52,
        hvi_tier: "Low",
        hvi_color: "#10b981",
        hospital_beds: 510,
        baseline_bed_occ: 57,
        cooling_center_count: 6,
        power_substation_stress: "Normal (61% Load)",
        centroid: [80.2280, 12.9010],
        coordinates: [[[80.20, 12.88], [80.25, 12.88], [80.25, 12.93], [80.20, 12.93], [80.20, 12.88]]],
        cohorts: { 'General Public': 330000, 'Outdoor Workers': 48000, 'Elderly Residents (65+)': 42000, 'Slum & Informal Settlements': 24000, 'Healthcare Workers': 11800, 'School Authorities': 4100, 'City Administration': 1500, 'DISCOM Engineers': 590 },
        cooling_centers: [
          { name: "OMR ELCOT IT Park Sanctuary", capacity: 320, address: "Sholinganallur OMR Junction" }
        ]
      },
      {
        id: "chn-w6",
        name: "Mylapore & Marina Beach Waterfront",
        district: "Zone IX (Mylapore)",
        population: 410000,
        uhi_offset: 1.1,
        base_hvi: 0.60,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 580,
        baseline_bed_occ: 66,
        cooling_center_count: 6,
        power_substation_stress: "Normal (67% Load)",
        centroid: [80.2680, 13.0350],
        coordinates: [[[80.25, 13.01], [80.29, 13.01], [80.29, 13.06], [80.25, 13.06], [80.25, 13.01]]],
        cohorts: { 'General Public': 290000, 'Outdoor Workers': 54000, 'Elderly Residents (65+)': 59000, 'Slum & Informal Settlements': 41000, 'Healthcare Workers': 9900, 'School Authorities': 3600, 'City Administration': 2100, 'DISCOM Engineers': 510 },
        cooling_centers: [
          { name: "Mylapore Kapaleeshwarar Civic Hall", capacity: 200, address: "North Mada Street, Mylapore" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "chn-s1",
        name: "Rajiv Gandhi Govt General Hospital Thermal Care Unit",
        category: "Apex Medical Center",
        address: "EVR Periyar Salai, Park Town, Chennai",
        operating_hours: "24/7 Emergency & Resuscitation",
        lat: 13.0810,
        lon: 80.2780,
        capacity_total: 300,
        current_occupancy: 260,
        ac_type: "Medical Grade Chilled Air Unit",
        ors_stock_packets: 5800,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-44-25305000"
      },
      {
        id: "chn-s2",
        name: "Chennai Central Railway AC Passenger Sanctuary",
        category: "Transit Gateway",
        address: "Puratchi Thalaivar Dr. M.G. Ramachandran Central Station",
        operating_hours: "24/7 Continuous Operation",
        lat: 13.0827,
        lon: 80.2750,
        capacity_total: 420,
        current_occupancy: 310,
        ac_type: "Central Station Ducted Air",
        ors_stock_packets: 4100,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-44-25353545"
      },
      {
        id: "chn-s3",
        name: "T. Nagar Bus Terminus Air-Conditioned Rest Hub",
        category: "Municipal Public Transit Hub",
        address: "Usman Road, T. Nagar, Chennai",
        operating_hours: "06:00 AM – 11:00 PM",
        lat: 13.0410,
        lon: 80.2320,
        capacity_total: 280,
        current_occupancy: 195,
        ac_type: "High Efficiency Split AC Cluster",
        ors_stock_packets: 2700,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-44-24340000"
      },
      {
        id: "chn-s4",
        name: "Guindy Industrial Estate Worker Relief Pavilion",
        category: "Labor Welfare Center",
        address: "SIDCO Industrial Estate, Guindy",
        operating_hours: "08:00 AM – 08:00 PM",
        lat: 13.0080,
        lon: 80.2110,
        capacity_total: 250,
        current_occupancy: 160,
        ac_type: "Misting Fan & Ducted Split AC",
        ors_stock_packets: 2300,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-44-22501000"
      }
    ]
  },

  nagpur: {
    id: "nagpur",
    name: "Nagpur (Vidarbha)",
    state: "Maharashtra",
    country: "India",
    lat: 21.1458,
    lon: 79.0882,
    zoom: 12,
    authority: "Nagpur Municipal Corporation (NMC) Disaster Management",
    municipal_body: "Nagpur Municipal Corporation (NMC)",
    water_utility: "NMC & OCW Water Works",
    power_discom: "MSEDCL (Mahavitaran)",
    total_population: 3150000,
    demographics: {
      'General Public': 2050000,
      'Outdoor Workers': 540000,
      'Elderly Residents (65+)': 290000,
      'Slum & Informal Settlements': 480000,
      'Healthcare Workers': 42000,
      'School Authorities': 8200,
      'City Administration': 4600,
      'DISCOM Engineers': 1200
    },
    wards: [
      {
        id: "ngp-w1",
        name: "MIDC Hingna Industrial Estate",
        district: "West Zone",
        population: 380000,
        uhi_offset: 2.9,
        base_hvi: 0.93,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 290,
        baseline_bed_occ: 94,
        cooling_center_count: 4,
        power_substation_stress: "Critical (98% Load)",
        centroid: [78.9950, 21.1150],
        coordinates: [[[78.97, 21.09], [79.02, 21.09], [79.02, 21.14], [78.97, 21.14], [78.97, 21.09]]],
        cohorts: { 'General Public': 240000, 'Outdoor Workers': 122000, 'Elderly Residents (65+)': 28000, 'Slum & Informal Settlements': 118000, 'Healthcare Workers': 3400, 'School Authorities': 1400, 'City Administration': 750, 'DISCOM Engineers': 320 },
        cooling_centers: [
          { name: "MIDC Hingna Workers Oasis", capacity: 200, address: "Central MIDC Road" }
        ]
      },
      {
        id: "ngp-w2",
        name: "Itwari & Gandhibagh Wholesale Core",
        district: "Gandhibagh Zone",
        population: 420000,
        uhi_offset: 2.5,
        base_hvi: 0.88,
        hvi_tier: "Extreme",
        hvi_color: "#b71c1c",
        hospital_beds: 340,
        baseline_bed_occ: 90,
        cooling_center_count: 5,
        power_substation_stress: "Severe (93% Load)",
        centroid: [79.1150, 21.1550],
        coordinates: [[[79.09, 21.13], [79.14, 21.13], [79.14, 21.18], [79.09, 21.18], [79.09, 21.13]]],
        cohorts: { 'General Public': 270000, 'Outdoor Workers': 98000, 'Elderly Residents (65+)': 41000, 'Slum & Informal Settlements': 78000, 'Healthcare Workers': 4800, 'School Authorities': 1600, 'City Administration': 920, 'DISCOM Engineers': 290 },
        cooling_centers: [
          { name: "Gandhibagh Town Hall AC Pavilion", capacity: 220, address: "Gandhibagh Main Road" }
        ]
      },
      {
        id: "ngp-w3",
        name: "Sitabuldi & Central Interchange",
        district: "Dharampeth Zone",
        population: 360000,
        uhi_offset: 1.7,
        base_hvi: 0.72,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 510,
        baseline_bed_occ: 78,
        cooling_center_count: 6,
        power_substation_stress: "Severe (86% Load)",
        centroid: [79.0820, 21.1450],
        coordinates: [[[79.06, 21.12], [79.10, 21.12], [79.10, 21.17], [79.06, 21.17], [79.06, 21.12]]],
        cohorts: { 'General Public': 250000, 'Outdoor Workers': 54000, 'Elderly Residents (65+)': 39000, 'Slum & Informal Settlements': 32000, 'Healthcare Workers': 9800, 'School Authorities': 2200, 'City Administration': 1800, 'DISCOM Engineers': 410 },
        cooling_centers: [
          { name: "Sitabuldi Metro Interchange AC Hub", capacity: 300, address: "Sitabuldi Interchange" }
        ]
      },
      {
        id: "ngp-w4",
        name: "Mahal & Old City Historic Ward",
        district: "Mahal Zone",
        population: 390000,
        uhi_offset: 2.1,
        base_hvi: 0.81,
        hvi_tier: "High",
        hvi_color: "#ef4444",
        hospital_beds: 380,
        baseline_bed_occ: 85,
        cooling_center_count: 4,
        power_substation_stress: "Severe (89% Load)",
        centroid: [79.1050, 21.1380],
        coordinates: [[[79.08, 21.12], [79.13, 21.12], [79.13, 21.16], [79.08, 21.16], [79.08, 21.12]]],
        cohorts: { 'General Public': 260000, 'Outdoor Workers': 76000, 'Elderly Residents (65+)': 44000, 'Slum & Informal Settlements': 58000, 'Healthcare Workers': 4200, 'School Authorities': 1800, 'City Administration': 880, 'DISCOM Engineers': 270 },
        cooling_centers: [
          { name: "Reshimbagh Indoor Complex Cooling Station", capacity: 250, address: "Reshimbagh Ground" }
        ]
      },
      {
        id: "ngp-w5",
        name: "Dharampeth & Ram Nagar Green Corridor",
        district: "West Zone",
        population: 310000,
        uhi_offset: 0.8,
        base_hvi: 0.53,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 490,
        baseline_bed_occ: 59,
        cooling_center_count: 5,
        power_substation_stress: "Normal (62% Load)",
        centroid: [79.0550, 21.1420],
        coordinates: [[[79.03, 21.12], [79.08, 21.12], [79.08, 21.16], [79.03, 21.16], [79.03, 21.12]]],
        cohorts: { 'General Public': 230000, 'Outdoor Workers': 32000, 'Elderly Residents (65+)': 42000, 'Slum & Informal Settlements': 19000, 'Healthcare Workers': 7200, 'School Authorities': 2400, 'City Administration': 1100, 'DISCOM Engineers': 340 },
        cooling_centers: [
          { name: "Dharampeth Public AC Library", capacity: 180, address: "West High Court Road" }
        ]
      },
      {
        id: "ngp-w6",
        name: "IT Park Gayatri Nagar & South Sector",
        district: "Nehru Nagar Zone",
        population: 340000,
        uhi_offset: 1.0,
        base_hvi: 0.56,
        hvi_tier: "Moderate",
        hvi_color: "#f97316",
        hospital_beds: 430,
        baseline_bed_occ: 63,
        cooling_center_count: 5,
        power_substation_stress: "Normal (65% Load)",
        centroid: [79.0680, 21.1080],
        coordinates: [[[79.04, 21.08], [79.09, 21.08], [79.09, 21.13], [79.04, 21.13], [79.04, 21.08]]],
        cohorts: { 'General Public': 250000, 'Outdoor Workers': 44000, 'Elderly Residents (65+)': 36000, 'Slum & Informal Settlements': 24000, 'Healthcare Workers': 6100, 'School Authorities': 2100, 'City Administration': 980, 'DISCOM Engineers': 360 },
        cooling_centers: [
          { name: "Gayatri Nagar Tech Oasis", capacity: 200, address: "Ring Road, Gayatri Nagar" }
        ]
      }
    ],
    cooling_shelters: [
      {
        id: "ngp-s1",
        name: "Government Medical College (GMC) Thermal Emergency Center",
        category: "Apex Medical Institution",
        address: "Medical Square, Ajni, Nagpur",
        operating_hours: "24/7 Critical Resuscitation Care",
        lat: 21.1350,
        lon: 79.0950,
        capacity_total: 280,
        current_occupancy: 240,
        ac_type: "Medical Grade HVAC Chiller",
        ors_stock_packets: 6200,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-712-2700100"
      },
      {
        id: "ngp-s2",
        name: "Nagpur Junction AC Passenger Concourse",
        category: "Railway Transit Gateway",
        address: "Station Road, Sitabuldi, Nagpur",
        operating_hours: "24/7 Continuous Operation",
        lat: 21.1520,
        lon: 79.0880,
        capacity_total: 350,
        current_occupancy: 260,
        ac_type: "High-Volume Ducted Industrial AC",
        ors_stock_packets: 3400,
        ice_immersion_facility: false,
        wheelchair_accessible: true,
        contact: "+91-712-2560123"
      },
      {
        id: "ngp-s3",
        name: "NMC Suresh Bhat Auditorium Public Sanctuary",
        category: "Municipal Civic Complex",
        address: "Reshimbagh, Great Nag Road, Nagpur",
        operating_hours: "07:00 AM – 10:00 PM",
        lat: 21.1320,
        lon: 79.1120,
        capacity_total: 450,
        current_occupancy: 180,
        ac_type: "Central Industrial Chilled Water HVAC",
        ors_stock_packets: 3900,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-712-2567000"
      },
      {
        id: "ngp-s4",
        name: "MIDC Hingna Industrial Oasis",
        category: "Industrial Worker Shelter",
        address: "Central MIDC Industrial Area, Hingna Road",
        operating_hours: "08:00 AM – 08:30 PM",
        lat: 21.1150,
        lon: 78.9950,
        capacity_total: 200,
        current_occupancy: 145,
        ac_type: "Evaporative Cooling System & Split AC",
        ors_stock_packets: 2600,
        ice_immersion_facility: true,
        wheelchair_accessible: true,
        contact: "+91-712-2321000"
      }
    ]
  }
};

/**
 * Haversine formula to compute great-circle distance between two coordinates in kilometers
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Resolve the nearest or requested national city from latitude/longitude or city id
 */
export function resolveCity(query = {}) {
  const { city, lat, lon } = query;
  
  if (city && NATIONAL_CITIES[city.toLowerCase()]) {
    return NATIONAL_CITIES[city.toLowerCase()];
  }

  const queryLat = parseFloat(lat);
  const queryLon = parseFloat(lon);

  if (!isNaN(queryLat) && !isNaN(queryLon)) {
    let closestCity = NATIONAL_CITIES.delhi;
    let minDistance = Infinity;

    for (const key of Object.keys(NATIONAL_CITIES)) {
      const c = NATIONAL_CITIES[key];
      const dist = getDistanceKm(queryLat, queryLon, c.lat, c.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = c;
      }
    }
    return closestCity;
  }

  return NATIONAL_CITIES.delhi;
}
