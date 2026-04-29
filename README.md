# 🎵 MakingItMixProStudio

Professional online recording studio with Pro Tools-like interface, autotune, mixing, and mastering capabilities.

## 🚀 Features

- ✅ **Professional Recording** - Crystal-clear vocal recording with zero latency
- ✅ **Beat Import** - Upload and work with your beat stems
- ✅ **Custom Autotune** - Antares-like pitch correction with ultra-low latency
- ✅ **Pro Tools UI** - Industry-standard interface you know and love
- ✅ **Real-time Mixing** - 4-track mixer with volume, pan, and mute controls
- ✅ **Waveform Visualization** - See your audio in real-time
- ✅ **Cloud Storage** - Secure cloud backup of all sessions
- ✅ **Stripe Payments** - Premium subscription management
- ✅ **SSL/TLS** - Enterprise-grade security

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI with hooks
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Responsive design
- **Lucide Icons** - Beautiful icons
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Stripe** - Payment processing
- **Web Audio API** - Audio processing

### Audio Processing
- **Web Audio Worklet** - Audio playback and recording
- **YIN Algorithm** - Ultra-low latency pitch detection
- **Phase Vocoder** - Professional pitch shifting

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 12+
- Nginx (for reverse proxy)
- Hetzner VPS account

## 🚀 Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/travelbagbiggz-gif/makingitmixstudio.git
cd makingitmixstudio

# Install dependencies
npm install

# Start development server
npm start

# In another terminal, start backend
node server.js

# Visit http://localhost:5173
```

## 🔧 Configuration

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

Required variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=makingitmixstudio
DB_USER=postgres
DB_PASSWORD=your_password

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# API
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:4000
PORT=4000
```

## 🗄️ Database Setup

```bash
# Create database
./setup-db.sh

# Verify
psql -d makingitmixstudio -c "\dt"
```

## 📦 Build for Production

```bash
# Build frontend
npm run build

# Output in ./dist
ls -la dist/
```

## 🚢 Deployment to Hetzner

```bash
# 1. Update .env.production
cp .env.example .env.production
nano .env.production

# 2. Build
./build.sh

# 3. Deploy
./deploy.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🎵 Audio Processing

### Autotune Settings

- **Scale**: Major, Minor, Pentatonic, Blues, Chromatic
- **Retune Speed**: 0-100% (lower = smoother, higher = faster)
- **Pitch Correction**: 0-100% (strength of correction)
- **Humanize**: 0-100% (adds natural variation)

### Web Audio Worklet

The autotune processor runs in a dedicated Web Audio Worklet for ultra-low latency:

```javascript
// Ultra-low latency pitch detection
const pitch = detectPitch(audioBuffer)
const correctedPitch = findNearestScaleDegree(pitch)
const shifted = shiftPitch(audioBuffer, pitch, correctedPitch)
```

## 📊 Performance

- ⚡ **Pitch Detection**: < 50ms latency
- 🚀 **Build Size**: ~150KB gzipped
- 📈 **Load Time**: < 2 seconds
- 🔄 **API Response**: < 100ms

## 🔒 Security

- ✅ Bcrypt password hashing
- ✅ JWT authentication
- ✅ SQL injection prevention
- ✅ CORS configured
- ✅ SSL/TLS encryption
- ✅ Secure session tokens

## 📝 Project Structure

```
.
├── src/
│   ├── components/          # React components
│   │   ├── Autotune.jsx
│   │   ├── Mixer.jsx
│   │   ├── Waveform.jsx
│   │   └── Navigation.jsx
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx
│   │   ├── AuthPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── StudioPage.jsx
│   ├── hooks/               # Custom hooks
│   │   └── useAutotune.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   └── autotune-processor.js # Web Audio Worklet
├── server.js                 # Express backend
├── package.json
├── vite.config.mjs
├── build.sh                 # Build script
├── deploy.sh                # Deployment script
├── setup-db.sh              # Database setup
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- Built with React, Vite, and TailwindCSS
- Audio processing with Web Audio API
- Deployed on Hetzner

---

**Ready to record?** 🎤 Start at https://makingmixprostudio.com
