import { useState, useEffect, useRef } from "react"
import axios from "axios"

/*
APP COMPONENT

This frontend displays a mock CME futures watchlist.

It demonstrates:
- fetching data from a FastAPI backend
- storing API data in React state
- refreshing automatically and manually
- sorting table columns
- deriving simple signal labels from market-style metrics
- rendering a styled data table
*/

type WatchlistRow = {
  symbol: string
  last: number
  change_pct: number
  spread_bps: number
  range_pct: number
}

type SignalTag = {
  label: string
  className: string
}

type WatchlistResponse = {
  rows: WatchlistRow[]
  as_of: string
  source: string
}

export default function App() {
  /*
  STATE MANAGEMENT

  These state values control the visible data, API metadata, sorting state,
  loading state, and error state. The component keeps backend data separate
  from UI controls so the table can be re-rendered whenever either changes.
  */

  const [rows, set_rows] = useState<WatchlistRow[]>([])
  const [as_of, set_as_of] = useState("")
  const [source, set_source] = useState("")
  const [sort_key, set_sort_key] = useState("symbol")
  const [sort_dir, set_sort_dir] = useState<"asc" | "desc">("asc")
  const [loading, set_loading] = useState(true)
  const [error, set_error] = useState("")

  // prevents overlapping API calls during manual refresh + auto-refresh
  const is_fetching = useRef(false)

  /*
  SORTING HELPER

  This function returns a sorted copy of the table data. It does not mutate the
  original rows array, which keeps React state predictable.
  */

  function get_sorted_rows(data: WatchlistRow[], key: string, direction: "asc" | "desc") {
    return [...data].sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1
      return 0
    })
  }

  /*
  API LOAD FUNCTION

  This function calls the backend watchlist endpoint, stores returned rows and
  metadata, and handles loading/error state. The is_fetching ref prevents a new
  request from starting before the previous request has finished.
  */

  async function load_watchlist() {
    if (is_fetching.current) return
    is_fetching.current = true

    try {
      set_loading(true)
      set_error("")

      const response = await axios.get<WatchlistResponse>("http://127.0.0.1:8000/watchlist")

      set_rows(response.data.rows)
      set_as_of(response.data.as_of)
      set_source(response.data.source)
    } catch (err) {
      set_error("failed to load watchlist from backend")
    } finally {
      set_loading(false)
      is_fetching.current = false
    }
  }

  /*
  INITIAL LOAD + AUTO REFRESH

  The first load runs when the component mounts. A timer then refreshes the
  watchlist every 10 seconds to simulate a live market data viewer.
  */

  useEffect(() => {
    load_watchlist()

    const interval = setInterval(() => {
      if (!is_fetching.current) {
        load_watchlist()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  /*
  TABLE SORT CONTROL

  Clicking a column header sets that column as the active sort key. Clicking the
  same column again toggles between ascending and descending order.
  */

  function sort_table(key: string) {
    let direction: "asc" | "desc" = "asc"

    if (sort_key === key && sort_dir === "asc") {
      direction = "desc"
    }

    set_sort_key(key)
    set_sort_dir(direction)
  }

  /*
  SIGNAL BASELINES

  These values identify the most extreme row in the current dataset for each
  metric. They are used to highlight the largest absolute move, widest spread,
  and highest range position.
  */

  const max_range_pct = rows.length > 0 ? Math.max(...rows.map((row) => row.range_pct)) : 0
  const max_abs_change =
    rows.length > 0 ? Math.max(...rows.map((row) => Math.abs(row.change_pct))) : 0
  const max_spread_bps = rows.length > 0 ? Math.max(...rows.map((row) => row.spread_bps)) : 0

  /*
  SIGNAL GENERATION

  Converts raw numeric values into simple labels shown in the Signal column.
  These labels also drive cell highlighting, so the table's visual emphasis is
  derived from the same logic as the displayed signal text.
  */

  function get_signal_data(row: WatchlistRow): SignalTag[] {
    const signals: SignalTag[] = []

    if (Math.abs(row.change_pct) >= max_abs_change) {
      signals.push({
        label: "large move",
        className: "move",
      })
    }

    if (row.spread_bps >= max_spread_bps) {
      signals.push({
        label: "wide spread",
        className: "spread",
      })
    }

    if (row.range_pct >= max_range_pct) {
      signals.push({
        label: "high range",
        className: "range",
      })
    }

    return signals
  }

  /*
  RENDER

  The UI is split into:
  - page shell
  - title and metadata
  - loading/error state
  - sortable watchlist table
  - manual refresh button
  */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "60px 24px 40px 24px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        backgroundColor: "#0b0f14",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          CME Futures Watchlist
        </h1>

        <div
          style={{
            marginBottom: "18px",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          source: {source || "—"} |{" "}
          {as_of
            ? new Date(as_of).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "—"}
        </div>

        {loading && rows.length === 0 && <p>loading...</p>}

        {error && <p style={{ color: "red", marginTop: 0 }}>{error}</p>}

        {!error && (
          <>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#1a1f26",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "auto",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#1f252d" }}>
                    <th
                      style={{
                        ...th_style,
                        backgroundColor: sort_key === "symbol" ? "#2c3440" : "#2c2f34",
                      }}
                      onClick={() => sort_table("symbol")}
                    >
                      Symbol {sort_key === "symbol" ? (sort_dir === "asc" ? "▲" : "▼") : ""}
                    </th>

                    <th
                      style={{
                        ...th_style,
                        backgroundColor: sort_key === "last" ? "#2c3440" : "#2c2f34",
                      }}
                      onClick={() => sort_table("last")}
                    >
                      Last {sort_key === "last" ? (sort_dir === "asc" ? "▲" : "▼") : ""}
                    </th>

                    <th
                      style={{
                        ...th_style,
                        backgroundColor: sort_key === "change_pct" ? "#2c3440" : "#2c2f34",
                      }}
                      onClick={() => sort_table("change_pct")}
                    >
                      % Change{" "}
                      {sort_key === "change_pct" ? (sort_dir === "asc" ? "▲" : "▼") : ""}
                    </th>

                    <th
                      style={{
                        ...th_style,
                        backgroundColor: sort_key === "spread_bps" ? "#2c3440" : "#2c2f34",
                      }}
                      onClick={() => sort_table("spread_bps")}
                    >
                      Spread (bps){" "}
                      {sort_key === "spread_bps" ? (sort_dir === "asc" ? "▲" : "▼") : ""}
                    </th>

                    <th
                      style={{
                        ...th_style,
                        backgroundColor: sort_key === "range_pct" ? "#2c3440" : "#2c2f34",
                      }}
                      onClick={() => sort_table("range_pct")}
                    >
                      Range % {sort_key === "range_pct" ? (sort_dir === "asc" ? "▲" : "▼") : ""}
                    </th>

                    <th style={{ ...th_style, textAlign: "center" }}>Signal</th>
                  </tr>
                </thead>

                <tbody>
                  {get_sorted_rows(rows, sort_key, sort_dir).map((row) => {
                    const signals = get_signal_data(row)

                    return (
                      <tr
                        key={row.symbol}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#232831"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ""
                        }}
                      >
                        <td style={td_style}>{row.symbol}</td>

                        <td style={td_number_style}>{row.last.toFixed(2)}</td>

                        <td
                          style={{
                            ...td_number_style,
                            color: row.change_pct >= 0 ? "green" : "red",
                            fontWeight: "normal",
                            backgroundColor: signals.some((s) => s.className === "move")
                              ? "#3a3f47"
                              : undefined,
                          }}
                        >
                          {row.change_pct.toFixed(2)}%
                        </td>

                        <td
                          style={{
                            ...td_number_style,
                            fontWeight: "normal",
                            backgroundColor: signals.some((s) => s.className === "spread")
                              ? "#3a3f47"
                              : undefined,
                          }}
                        >
                          {row.spread_bps.toFixed(2)}
                        </td>

                        <td
                          style={{
                            ...td_number_style,
                            fontWeight: "normal",
                            backgroundColor: signals.some((s) => s.className === "range")
                              ? "#3a3f47"
                              : undefined,
                          }}
                        >
                          {row.range_pct.toFixed(1)}%
                        </td>

                        <td
                          style={{
                            ...td_style,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {signals.length === 0 ? (
                            "—"
                          ) : (
                            signals.map((s, index) => (
                              <span key={`${row.symbol}-${s.className}-${index}`}>
                                <span
                                  style={{
                                    color:
                                      s.className === "move"
                                        ? "#d9480f"
                                        : s.className === "spread"
                                          ? "#1864ab"
                                          : "#2b8a3e",
                                  }}
                                >
                                  {s.label}
                                </span>
                                {index < signals.length - 1 && (
                                  <span style={{ color: "#999", margin: "0 6px" }}>•</span>
                                )}
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={load_watchlist}
              disabled={loading}
              style={{
                marginTop: "20px",
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              {loading ? "Updating..." : "Refresh"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/*
STYLE CONSTANTS

These shared style objects keep repeated table styling in one place.
They are intentionally simple inline styles for a compact portfolio demo.
*/

const th_style = {
  borderBottom: "1px solid #2a313a",
  padding: "12px 14px",
  textAlign: "left" as const,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
  backgroundColor: "#2c2f34",
  color: "#cfd6df",
  fontSize: "14px",
  fontWeight: "600",
}

const td_style = {
  borderBottom: "1px solid #2c2f34",
  padding: "12px 14px",
  color: "#d7dde5",
}

const td_number_style = {
  borderBottom: "1px solid #2a313a",
  padding: "12px 14px",
  textAlign: "right" as const,
  fontVariantNumeric: "tabular-nums" as const,
  color: "#d7dde5",
}