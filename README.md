# System Design Coach

An AI-powered system design interview coach built with Next.js and Google's Generative AI.

## Production

Access the live application: **https://official-system-design-coach.vercel.app/**

## Tech Stack

- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Generative AI
- **State Management**: Zustand
- **Node**: >=22.15.0

## Getting Started

### Prerequisites
- Node.js 22.15.0 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env.local file with your Google Generative AI API key
echo "NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here" > .env.local
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Features

- **Interview Mode**: Practice system design interviews with AI feedback
- **Learn Mode**: Study system design concepts and patterns
- **Evaluation**: Get detailed evaluation reports on your design solutions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript

## License

Private project
