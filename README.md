# CME Futures Watchlist (React + FastAPI)

A full-stack futures market dashboard built with React, TypeScript, and FastAPI.  
The application demonstrates REST-based data flow, polling, sortable market tables, and derived UI signals in a clean frontend–backend architecture.

![Watchlist Screenshot](./screenshot.png)

---

## Overview

This project simulates a futures market watchlist dashboard. It is designed as a portfolio application to demonstrate real-world web development patterns, including:

- frontend ↔ backend integration
- REST API design and consumption
- polling and asynchronous data flow
- data-driven UI rendering

---

## Tech Stack

**Frontend**

- React (Vite)
- TypeScript
- Axios

**Backend**

- FastAPI
- Python

---

## Features

- REST API-driven data flow
- Polling (auto-refresh every 10 seconds)
- Manual refresh control
- Sortable table (ascending/descending per column)

### Market Highlights

- Largest move
- Widest spread
- Highest range

### UI Behavior

- Derived UI signals based on backend data
- Local time formatting from backend UTC timestamps
- Loading and error state handling
- Clean, centered UI layout with interactive row hover

---

## Architecture

```text
React Frontend
      ↓ (Axios HTTP)
FastAPI Backend (/watchlist)
      ↓
Data Provider (mock)
```

The frontend consumes a structured REST response:

```json
{
  "rows": [...],
  "as_of": "...",
  "source": "mock"
}
```

The backend returns UTC timestamps.  
The frontend formats timestamps and derives UI signals.

---

## Project Structure

```
project02_futures_watchlist/
│
├── backend/
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── services/
│   │       └── api.ts
│   │
│   └── package.json
│
└── README.md
```

## How to Run

### Backend

```powershell
cd backend
.\start.ps1
```

or:

```powershell
uvicorn main:app --reload
```

API endpoint:

```
http://127.0.0.1:8000/watchlist
```

---

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App runs at:

```
http://localhost:5173
```

---

## Notes

- Data is mocked by design to focus on frontend/backend integration patterns  
- The backend is structured to allow easy replacement with a live market data provider  
- The project emphasizes clean architecture and data flow over external dependencies  

---

## Future Improvements

- Live market data integration (IBKR Web API or alternative)
- Filtering (e.g., show only active signals)
- Signal scoring / ranking system
- Improved UI components (badges, tooltips)
- Deployment to a public hosting environment

---

## Purpose

This project demonstrates:

- Full-stack development skills
- REST API design and consumption
- React state and lifecycle management
- Data-driven UI rendering
- Separation of concerns between frontend and backend