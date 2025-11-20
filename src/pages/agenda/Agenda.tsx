import React, { useMemo, useState, useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { getAllClients, getMonthRooster } from "../../services/roosterService";

// ===== Types =====
interface Client {
  id: string;
  name: string;
  photo?: string;
  intro?: string;
}

type Rooster = Record<string, string[]>;

// ===== Helpers =====
function formatDateKey(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ============================================================
//                      ★★★ AGENDA ★★★
// ============================================================
export default function Agenda(): JSX.Element {
  const navigate = useNavigate();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [clients, setClients] = useState<Client[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [rooster, setRooster] = useState<Rooster>({});

  // ============================================================
  //                  1. LOAD CLIENTS
  // ============================================================
  useEffect(() => {
    async function load() {
      const list = await getAllClients();
      setClients(list);
      setClientMap(Object.fromEntries(list.map((c) => [c.id, c])));
    }
    load();
  }, []);

  // ============================================================
  //             2. LOAD ROOSTER FOR THIS MONTH
  // ============================================================
  useEffect(() => {
    async function loadRooster() {
      if (clients.length === 0) return;

      const r = await getMonthRooster(viewYear, viewMonth);
      setRooster(r);
      setSelectedDateKey(null);
    }
    loadRooster();
  }, [clients, viewYear, viewMonth]);

  // ============================================================
  //                     MONTH NAVIGATION
  // ============================================================
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  const monthName = new Intl.DateTimeFormat("nl-NL", {
    month: "long",
  }).format(new Date(viewYear, viewMonth, 1));

  // ============================================================
  //                CALENDAR GRID GENERATION
  // ============================================================
  const calendarRows = useMemo(() => {
    const startDay = startDayOfMonth(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);

    const offset = (startDay + 6) % 7; // maandag=0
    const cells: (number | null)[] = [];

    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return rows;
  }, [viewYear, viewMonth]);

  function goToClient(id: string) {
    navigate(`/client/${id}`);
  }

  // ============================================================
  //                          RENDER
  // ============================================================
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <button onClick={prevMonth} style={btnStyle}>‹</button>
          <button onClick={nextMonth} style={{ ...btnStyle, marginLeft: 8 }}>›</button>

          <strong style={{ marginLeft: 12, fontSize: 18 }}>
            {monthName} {viewYear}
          </strong>
        </div>
      </header>

      {/* Week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontWeight: 700 }}>{d}</div>
        ))}
      </div>

      {/* Calendar: ONLY MONTH VIEW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {calendarRows.flat().map((cell, idx) => {
          if (cell === null) return <div key={idx} style={emptyCellStyle} />;

          const dateKey = formatDateKey(viewYear, viewMonth, cell);
          const scheduled = rooster[dateKey] || [];

          return (
            <div
              key={idx}
              style={{
                ...dayCellStyle,
                border: selectedDateKey === dateKey ? "2px solid #b86b45" : undefined,
              }}
              onClick={() => setSelectedDateKey(dateKey)}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{cell}</div>

              <div style={{ fontSize: 13 }}>
                {scheduled.slice(0, 3).map((id) => (
                  <div
                    key={id}
                    style={{ cursor: "pointer", marginBottom: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToClient(id);
                    }}
                  >
                    {clientMap[id]?.name}
                  </div>
                ))}

                {scheduled.length > 3 && (
                  <div style={{ fontSize: 12 }}>+{scheduled.length - 3} meer</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details onderaan */}
      {selectedDateKey && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#fffaf4",
            borderRadius: 12,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Ingeroosterd op {selectedDateKey}</h3>

          {rooster[selectedDateKey]?.length ? (
            <ul>
              {rooster[selectedDateKey].map((id) => (
                <li
                  key={id}
                  style={{ cursor: "pointer", marginBottom: 6 }}
                >
                  {clientMap[id]?.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>Niemand ingeroosterd.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ===== STYLES =====
const btnStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  cursor: "pointer",
};

const emptyCellStyle: React.CSSProperties = {
  minHeight: 100,
};

const dayCellStyle: React.CSSProperties = {
  background: "#fff",
  padding: 10,
  borderRadius: 10,
  minHeight: 100,
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  cursor: "pointer",
};
