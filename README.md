# Robotics Economics Visualizations

Interactive visualizations exploring the economics of humanoid robotics deployment.

## Visualizations

### 1. Global Robot Labor Arbitrage (World Map)
Interactive choropleth map showing where robot labor is cost-competitive vs human labor. Adjust robot CapEx to see how viability changes across ~50 countries.

### 2. Supply Chain Analysis
Visual breakdown of robotics supply chain bottlenecks, focusing on:
- Rare earth processing (China 85% market share)
- Precision reducers (Japan 60% market share)
- Why these are more solvable than they appear

### 3. Datacenter Market Sizing
$1T+ market by 2030 breakdown:
- Hyperscaler CapEx projections
- Robotics TAM in construction, operations, supply chain
- Animated growth trajectory

### 4. Deployment Data Flywheel
10-year projection showing compounding advantage:
- Day 1 → 10M robots
- 500M hours of training data
- 120 model updates
- The moat that makes catching up nearly impossible

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Tech Stack
- React 18
- D3.js (for map projection)
- Vite (build tool)

## Fonts
All visualizations use exactly 2 fonts:
- **Georgia** (serif) - Headlines, numbers, emphasis
- **Inter** (sans-serif) - Body text, labels

## Data Sources
- Labor rates: BLS, Conference Board, KPMG (2024)
- Datacenter market: Company filings, Synergy Research, Bloomberg
- Supply chain: USGS, industry reports

## Economics Model

Robot equivalent hourly rate calculation:
```
CapEx amortized: $robotCapEx / (16 hrs/day × 300 days × 3 years)
+ Maintenance: ($robotCapEx × 15%) / (16 × 300) per year
+ Electricity: $0.50/hr
+ Teleoperator: $6.29/hr ÷ 8 robots = $0.79/hr
÷ Efficiency: (70% speed × 85% success) = 59.5%
= ~$6-10/hr at $45K CapEx
```

## License
MIT
