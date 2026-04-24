"""
main.py

PURPOSE
-------
FastAPI backend for a mock futures market watchlist.

This project demonstrates:
- frontend-to-backend API integration
- CORS configuration for local React development
- mock third-party data provider behavior
- structured JSON responses for a data viewer UI

DESIGN INTENT
-------------
The app simulates a real market data feed. The instrument symbols and last
prices stay fixed so the table has stable anchors, while selected market
metrics are randomized on each request to make refresh behavior visible.
"""

from datetime import datetime, UTC
import random
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ==================================================
# APPLICATION SETUP
# ==================================================
# This section creates the FastAPI app object. The app object is the central
# object used to register API routes and middleware.

app = FastAPI()


# ==================================================
# CORS CONFIGURATION
# ==================================================
# The React frontend runs on localhost:5173, while this backend runs on a
# different local port. Browsers block that by default unless the backend
# explicitly allows the frontend origin.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# MOCK MARKET DATA PROVIDER
# ==================================================
# This function simulates the role of a third-party market data provider.
#
# The `last` values are fixed so each instrument remains recognizable.
# The calculated market-style fields vary on each request so the frontend
# refresh button produces visible changes.

def get_mock_watchlist_rows():
    """
    Return mock futures watchlist rows.

    Dynamic fields:
    - change_pct: simulated percent change from prior close
    - spread_bps: simulated bid/ask spread in basis points
    - range_pct: simulated position inside the day's range
    """

    base_rows = [
        {"symbol": "ES", "last": 6138.3},
        {"symbol": "NQ", "last": 17342.75},
        {"symbol": "YM", "last": 50095.41},
        {"symbol": "GC", "last": 4638.3},
        {"symbol": "SI", "last": 72.75},
        {"symbol": "CL", "last": 105.41},
        {"symbol": "ZB", "last": 118.3},
        {"symbol": "RTY", "last": 2342.75},
        {"symbol": "HG", "last": 7.41},
    ]

    rows = []

    for row in base_rows:
        rows.append({
            "symbol": row["symbol"],
            "last": row["last"],
            "change_pct": round(random.uniform(-1.0, 1.0), 4),
            "spread_bps": round(random.uniform(0.5, 3.0), 3),
            "range_pct": round(random.uniform(0, 100), 1),
        })

    return rows


# ==================================================
# WATCHLIST ENDPOINT
# ==================================================
# This endpoint returns the mock market data payload consumed by the frontend.
# The response shape mimics a real provider-style API response by including:
# - rows: instrument data
# - as_of: timestamp of generation
# - source: mock/real source marker

@app.get("/watchlist")
def get_watchlist():
    """
    Return current mock watchlist data.
    """

    # Add a brief delay so the frontend loading state is visible during refresh.
    time.sleep(1)

    rows = get_mock_watchlist_rows()

    return {
        "rows": rows,
        "as_of": datetime.now(UTC).isoformat(),
        "source": "mock",
    }