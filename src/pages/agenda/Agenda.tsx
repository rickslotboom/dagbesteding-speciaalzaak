import React, { useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import medewerkersJson from "../../data/medewerkers.json";

// ===== Types =====
interface Medewerker {
  id: string;
  name: string;
  img?: string; // niet meer nodig maar laten we het type simpel houden
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

// ===== Component =====
export default function Agenda(): JSX.Element {
  const medewerkers = medewerkersJson as Medewerker[];
  const medewerkerMap = useMemo(
    () => Object.fromEntries(medewerkers.map((m) => [m.id, m])),
    [medewerkers]
  );

  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showWeekView, setShowWeekView] = useState<boolean>(false);
  const [rooster, setRooster] = useState<Rooster>({});

  const navigate = useNavigate();

  // ===== Auto rooster genereren =====
  function generateRoosterForMonth(year: number, month: number): Rooster {
    const days = daysInMonth(year, month);
    const result: Rooster = {};

    // pick random helper
    const pickRandom = <T,>(arr: T[], n: number) => {
      const copy = arr.slice();
      const out: T[] = [];
      for (let i = 0; i < n && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
      }
      return out;
    };

    for (let d = 1; d <= days; d++) {
      const key = formatDateKey(year, month, d);
      const weekday = new Date(year, month, d).getDay(); // 0 = Sun

      const available = medewerkers
        .map((m) => m.id)
        .filter((id) => {
          if (id.toLowerCase() === "octo" && weekday === 0) return false;
          return true;
        });

      let num = Math.random() < 0.6 ? 1 : 2;
      if (Math.random() < 0.1) num = 0;

      const picked = pickRandom(available, num);
      result[key] = picked;
    }

    return result;
  }

  React.useEffect(() => {
    setRooster(generateRoosterForMonth(viewYear, viewMonth));
    setSelectedDateKey(null);
  }, [viewYear, viewMonth]);

  // ===== Month Controls =====
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

  // ===== Calendar Layout =====
  const calendarRows = useMemo(() => {
    const startDay = startDayOfMonth(viewYear, viewMonth);
    const totalDays = daysInMonth(viewYear, viewMonth);

    const offset = (startDay + 6) % 7; // Monday-start
    const cells = [];

    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewYear, viewMonth]);

  const selectedWeekIndex = useMemo(() => {
    if (!selectedDateKey) return null;
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    if (y !== viewYear || m - 1 !== viewMonth) return null;

    for (let i = 0; i < calendarRows.length; i++) {
      if (calendarRows[i].includes(d)) return i;
    }
    return null;
  }, [selectedDateKey, calendarRows]);

  function goToMedewerker(id: string) {
    navigate(`/client/${id}`);
  }

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

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={showWeekView}
            onChange={() => setShowWeekView((v) => !v)}
          />
          Week view
        </label>
      </header>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontWeight: 700 }}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      {!showWeekView ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
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
                        goToMedewerker(id);
                      }}
                    >
                      {medewerkerMap[id]?.name}
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
      ) : (
        // WEEKVIEW
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
          {(selectedWeekIndex !== null ? calendarRows[selectedWeekIndex] : calendarRows[0]).map(
            (cell, idx) => {
              if (cell === null) return <div key={idx} style={emptyCellStyle} />;

              const dateKey = formatDateKey(viewYear, viewMonth, cell);
              const scheduled = rooster[dateKey] || [];

              return (
                <div
                  key={idx}
                  style={{ ...dayCellStyle, minHeight: 140 }}
                  onClick={() => setSelectedDateKey(dateKey)}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{cell}</div>

                  {scheduled.length === 0
                    ? "Niemand"
                    : scheduled.map((id) => (
                        <div
                          key={id}
                          style={{ cursor: "pointer", marginBottom: 6 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToMedewerker(id);
                          }}
                        >
                          {medewerkerMap[id]?.name}
                        </div>
                      ))}
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Selected day detail */}
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
                  onClick={() => goToMedewerker(id)}
                >
                  {medewerkerMap[id]?.name}
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
