
🌊 Flot Argo-SIH

Flot Argo-SIH is a full-stack web application designed to analyze and visualize Argo float oceanographic data.
The project integrates a FastAPI backend for data services with a React frontend for interactive visualization.
It is developed as part of the Smart India Hackathon (SIH).
---

✨ Features
🌐 User Features

📊 Interactive Visualizations – Explore ocean float datasets with rich graphs and charts.

🌍 Oceanographic Insights – Access and analyze global float datasets easily.

🎨 Modern Interface – Responsive, intuitive React-based UI for seamless exploration.

⚙️ Technical Features

⚡ FastAPI Backend – High-performance REST API for float data processing.

🔄 Seamless Integration – React frontend communicates directly with backend APIs.

🛠️ Scalable Design – Modular architecture for extending APIs and UI components.

✅ Testing Support – Backend unit tests for reliability and robustness.


flot-argo-sih/
│
├── ARGO_FLOAT/                # Main project folder
│   ├── Argo_backend/          # Backend (FastAPI)
│   │   ├── main.py            # Entry point for FastAPI app
│   │   ├── requirements.txt   # Backend dependencies
│   │   ├── app/               # App modules
│   │   │   ├── __init__.py
│   │   │   ├── routes/        # API routes
│   │   │   ├── models/        # Database models (if any)
│   │   │   ├── services/      # Business logic
│   │   │   └── utils/         # Helper functions
│   │   └── tests/             # Backend unit tests
│   │
│   ├── Argo_frontend/         # Frontend (React + Vite + Tailwind)
│   │   ├── public/            # Static assets (favicon, index.html)
│   │   ├── src/               # React source code
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page-level components
│   │   │   ├── services/      # API calls to backend
│   │   │   ├── App.tsx        # Main React app
│   │   │   └── index.tsx      # Entry point
│   │   ├── package.json       # Frontend dependencies
│   │   └── tsconfig.json      # TypeScript config
│   │
│   ├── venv/                  # Python virtual environment (ignored in Git)
│
├── README.md                  # Project documentation
├── LICENSE                    # License file
├── .gitignore                 # Ignore unnecessary files
└── .github/                   # GitHub Actions (CI/CD)
    └── workflows/             # Automated workflows

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
