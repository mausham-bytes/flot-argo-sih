# 🏊‍♂️ Flot - Argo Float Ocean Data Visualization Platform

**Full-stack platform to visualize and analyze Argo Float ocean data. Explore ocean currents, temperature, salinity, and marine patterns with interactive maps and AI-powered insights.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🌊 Features

- **Interactive Ocean Maps**: Visualize Argo float positions with animated markers
- **Real-time Data Dashboard**: Monitor ocean temperature, salinity, and depth profiles
- **AI-Powered Chat Assistant**: Query ocean data with natural language (Nerida AI)
- **Time Series Analysis**: Replay float movement history with time sliders
- **CSV Data Export**: Download filtered datasets for research
- **Anomaly Detection**: Automated identification of unusual ocean patterns
- **Multi-page Navigation**: Dashboard, Map View, Profiles, and Chat sections

## 🏗️ Architecture

```
flot-argo-sih/
├── backend/                 # FastAPI Application
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── models.py       # SQLAlchemy DB models
│   │   ├── routes/         # API endpoints (location, chat)
│   │   ├── services/       # Business logic (data processing, LLM)
│   │   └── utils/          # Helper functions
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Pytest unit tests
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Dashboard, Map)
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API service clients
│   └── package.json        # Node dependencies
└── docs/                   # Documentation
    ├── architecture.md    # System design docs
    ├── api.md            # API documentation
    └── sih-project.md    # SIH-specific requirements
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Setup with Docker
```bash
# Clone the repository
git clone https://github.com/yourorg/flot-argo-sih.git
cd flot-argo-sih

# Start the full stack
docker-compose up --build

# Access the application at http://localhost:3000
```

### Manual Setup (Development)

#### Backend Setup
```bash
cd backend/
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend/
npm install
npm run dev
```

## 📤 API Documentation

FastAPI provides automatic interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints
- `GET /floats` - Retrieve Argo float data with filtering options
- `POST /chat/query` - AI-powered data queries
- `GET /floats/{id}/trajectory` - Historical movement data for a float

## 🖼️ Screenshots

### Dashboard Overview
![Dashboard Screenshot](./docs/screenshots/dashboard.png)

### Ocean Map with Floats
![Map View Screenshot](./docs/screenshots/map.png)

### AI Chat Assistant
![Chat Screenshot](./docs/screenshots/chat.png)

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Navigation
- **Leaflet/Mapbox** - Mapping
- **Recharts** - Data visualization
- **Jest** - Testing

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Primary database
- **Pydantic** - Data validation
- **JWT** - Authentication
- **pytest** - Testing
- **uvicorn** - ASGI server

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local orchestration
- **GitHub Actions** - CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Argo International Ocean Data Program for float data
- SIH (Smart India Hackathon) for the initiative
- Marine researchers and oceanographers worldwide
