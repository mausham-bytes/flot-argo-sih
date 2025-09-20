
🌊 Flot Argo-SIH

Flot Argo-SIH is a full-stack web application designed to analyze and visualize Argo float oceanographic data.
The project integrates a FastAPI backend for data services with a React frontend for interactive visualization.
It is developed as part of the Smart India Hackathon (SIH).
---
✨ Key Features
🌍 Real-time Map Integration

Interactive Leaflet map with custom float markers

Active/inactive float status indicators

Detailed popup info for each float

Search & filter functionality

Responsive map controls

📊 Enhanced Data Visualization

Dynamic line/area charts with Recharts

Real-time profile data: temperature, salinity, oxygen

Depth-based analysis with proper oceanographic scaling

Interactive data tables with quality indicators

💬 Intelligent Chat System

Context-aware responses for selected floats

Query-specific visualizations (temp, salinity, oxygen)

Mock AI responses with typing indicators

Real-time formatted chat interface

⚙️ Backend API Integration

Mock Flask API for development

REST endpoints for float metadata & profiles

Dynamic profile generation with realistic oceanographic data

CORS enabled for seamless frontend integration

🎨 Improved UI/UX

Responsive, mobile-friendly layouts

Loading states & error handling

Selected float detail panels

Smooth animations & transitions

Better navigation between sections

## 📂 Project Structure  

```bash
flot-argo-sih/
│
├── src/                         # Development mode (React + Flask mock backend)
│   ├── components/              # React UI components
│   │   ├── InteractiveMap.tsx   # Main map component
│   │   ├── MapView.tsx          # Map view wrapper
│   │   ├── ProfileView.tsx      # Profile data visualization
│   │   ├── ChatPanel.tsx        # Intelligent chat system
│   │   ├── SummaryCards.tsx     # Key metrics summary
│   │
│   ├── services/
│   │   └── argoApi.ts           # API integration (Axios)
│   │
│   ├── App.tsx                  # Main application
│   └── index.tsx                # Entry point
│
│   ├── backend/                 # Mock backend (Flask)
│   │   ├── mock-server.py       # Flask mock API
│   │   ├── requirements.txt     # Backend dependencies
│   │   └── README.md            # Backend usage
│
│   ├── public/                  # Static assets
│   ├── vite.config.ts           # Vite configuration
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│
├── ARGO_FLOAT/                  # Production-ready full stack (FastAPI + React)
│   ├── Argo_backend/            # Backend (FastAPI)
│   │   ├── main.py              # Entry point
│   │   ├── requirements.txt     # Backend dependencies
│   │   ├── app/                 # App modules
│   │   │   ├── __init__.py
│   │   │   ├── routes/          # API routes
│   │   │   ├── models/          # Database models
│   │   │   ├── services/        # Business logic
│   │   │   └── utils/           # Helper functions
│   │   └── tests/               # Backend unit tests
│   │
│   ├── Argo_frontend/           # Frontend (React + Vite + Tailwind)
│   │   ├── public/              # Static assets
│   │   ├── src/                 # React source code
│   │   │   ├── components/      # UI components
│   │   │   ├── pages/           # Page-level components
│   │   │   ├── services/        # API calls to backend
│   │   │   ├── App.tsx
│   │   │   └── index.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── venv/                    # Virtual environment (ignored in Git)
│
├── .github/                     # GitHub Actions (CI/CD)
│   └── workflows/               # Automated workflows
│
├── README.md                    # Project documentation
├── LICENSE                      # MIT License
└── .gitignore                   # Ignore unnecessary files


Backend (FastAPI)
cd ARGO_FLOAT/Argo_backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend (React + Vite)
cd ARGO_FLOAT/Argo_frontend
npm install
npm run dev

📝 License

This project is licensed under the MIT License
