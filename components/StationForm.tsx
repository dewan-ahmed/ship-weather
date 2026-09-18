import type { FormEvent } from "react";
import type { Station } from "@/lib/types";

type Props = {
  station: Station;
  onChange: (station: Station) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
};

export default function StationForm({ station, onChange, onSubmit, loading, error }: Props) {
  function update<K extends keyof Station>(key: K, value: Station[K]) {
    onChange({ ...station, [key]: value });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="station-card" onSubmit={handleSubmit}>
      <p className="eyebrow">Harness weather station</p>
      <h1>Ship Weather</h1>
      <p className="lede">
        Point it at a project. We read recent pipeline runs and hang a forecast over the harbor.
      </p>

      <label>
        Account ID
        <input
          required
          autoComplete="off"
          value={station.accountId}
          onChange={(e) => update("accountId", e.target.value.trim())}
          placeholder="e.g. AbcDefGhiJ-xYZabCDefGH"
        />
      </label>
      <div className="row">
        <label>
          Organization
          <input
            required
            autoComplete="off"
            value={station.orgId}
            onChange={(e) => update("orgId", e.target.value.trim())}
            placeholder="default"
          />
        </label>
        <label>
          Project
          <input
            required
            autoComplete="off"
            value={station.projectId}
            onChange={(e) => update("projectId", e.target.value.trim())}
            placeholder="my_project"
          />
        </label>
      </div>
      <label>
        Personal access token
        <input
          required
          type="password"
          autoComplete="off"
          value={station.pat}
          onChange={(e) => update("pat", e.target.value)}
          placeholder="pat.xxxxx..."
        />
      </label>
      <label>
        Harness URL
        <input
          required
          autoComplete="off"
          value={station.baseUrl}
          onChange={(e) => update("baseUrl", e.target.value.trim())}
          placeholder="https://app.harness.io"
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button type="submit" disabled={loading}>
        {loading ? "Reading the skies…" : "Check the weather"}
      </button>
      <p className="fineprint">
        The PAT is stored in this browser only and proxied to Harness from your local app. It is
        never committed or sent anywhere else.
      </p>
    </form>
  );
}
