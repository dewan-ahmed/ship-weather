"use client";

import { useEffect, useState } from "react";
import Sky from "@/components/Sky";
import StationForm from "@/components/StationForm";
import { fetchExecutions, fetchPipelines } from "@/lib/api";
import type { Station, WeatherReport } from "@/lib/types";
import { buildWeather } from "@/lib/weather";

const STORAGE_KEY = "ship-weather-station";

const EMPTY_STATION: Station = {
  accountId: "",
  orgId: "",
  projectId: "",
  pat: "",
  baseUrl: "https://app.harness.io",
};

function loadStation(): Station {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATION };
    const parsed = JSON.parse(raw) as Partial<Station>;
    return {
      ...EMPTY_STATION,
      ...parsed,
      pat: sessionStorage.getItem("ship-weather-pat") || "",
    };
  } catch {
    return { ...EMPTY_STATION };
  }
}

function persist(station: Station) {
  const { pat, ...rest } = station;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  if (pat) sessionStorage.setItem("ship-weather-pat", pat);
}

const ICONS: Record<string, string> = {
  sunny: "☀️",
  partly: "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
  fog: "🌫️",
  wind: "💨",
};

export default function WeatherStation() {
  const [station, setStation] = useState<Station>(EMPTY_STATION);
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStation, setShowStation] = useState(true);
  const [fetchedAt, setFetchedAt] = useState("");

  useEffect(() => {
    setStation(loadStation());
  }, []);

  async function checkWeather() {
    setLoading(true);
    setError(null);
    persist(station);
    try {
      const [pipelines, executions] = await Promise.all([
        fetchPipelines(station),
        fetchExecutions(station),
      ]);
      setReport(buildWeather(station, pipelines, executions));
      setFetchedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
      setShowStation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read Harness weather.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {report ? <Sky condition={report.condition} /> : <Sky condition="partly" />}

      <header className="topbar">
        <strong>Ship Weather</strong>
        {report ? (
          <div className="topbar-actions">
            <button type="button" className="ghost" onClick={() => void checkWeather()} disabled={loading}>
              {loading ? "Updating…" : "Refresh"}
            </button>
            <button type="button" className="ghost" onClick={() => setShowStation(true)}>
              Change station
            </button>
          </div>
        ) : null}
      </header>

      {showStation || !report ? (
        <div className="center">
          <StationForm
            station={station}
            onChange={setStation}
            onSubmit={() => void checkWeather()}
            loading={loading}
            error={error}
          />
        </div>
      ) : null}
      {report && !showStation ? (
        <main className="report">
          <p className="station-name">
            {station.orgId} / {station.projectId}
          </p>
          <div className="hero">
            <span className="icon">{ICONS[report.condition]}</span>
            <div>
              <h1>{report.headline}</h1>
              <p>{report.summary}</p>
            </div>
          </div>

          <section className="stats">
            <article>
              <span>Ship temp</span>
              <b>{report.temperature}°</b>
            </article>
            <article>
              <span>Success</span>
              <b>{report.successRate == null ? "—" : `${report.successRate}%`}</b>
            </article>
            <article>
              <span>Chance of fail</span>
              <b>{report.failChance}%</b>
            </article>
            <article>
              <span>Recent runs</span>
              <b>{report.total}</b>
            </article>
          </section>

          <p className="meta">
            {report.succeeded} fair · {report.failed} squalls · {report.running} still at sea
            {fetchedAt ? ` · updated ${fetchedAt}` : ""}
          </p>

          <h2>Pipeline forecast</h2>
          <ul className="forecast">
            {report.pipelines.map((pipeline) => (
              <li key={pipeline.identifier} className={`tile tile-${pipeline.condition}`}>
                <div>
                  <strong>
                    {pipeline.href ? (
                      <a href={pipeline.href} target="_blank" rel="noreferrer">
                        {pipeline.name}
                      </a>
                    ) : (
                      pipeline.name
                    )}
                  </strong>
                  <p>{pipeline.blurb}</p>
                </div>
                <span>
                  {ICONS[pipeline.condition]} {pipeline.status}
                </span>
              </li>
            ))}
          </ul>
        </main>
      ) : null}
    </div>
  );
}
