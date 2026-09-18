import type { ExecutionInfo, PipelineInfo, Station } from "./types";

type HarnessPage<T> = {
  status?: string;
  message?: string;
  data?: {
    content?: T[];
    totalElements?: number;
  };
};

function displayName(raw: string | undefined, fallback: string) {
  if (!raw) return fallback;
  const match = raw.match(/^\[([^\]]+)\]/);
  return match ? match[1] : raw;
}

async function harnessPost<T>(
  station: Station,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`/api/harness${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": station.pat,
      "x-harness-url": station.baseUrl,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: HarnessPage<unknown> & { message?: string; error?: string } = {};
  try {
    json = text ? (JSON.parse(text) as typeof json) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    throw new Error(
      json.message ||
        json.error ||
        (res.status === 401
          ? "Harness rejected the PAT. Check the token and account ID."
          : `Harness returned ${res.status}`),
    );
  }
  if (json.status === "ERROR" || json.status === "FAILURE") {
    throw new Error(json.message || "Harness request failed.");
  }
  return json as T;
}

export async function fetchPipelines(station: Station): Promise<PipelineInfo[]> {
  const qs = new URLSearchParams({
    accountIdentifier: station.accountId,
    orgIdentifier: station.orgId,
    projectIdentifier: station.projectId,
    page: "0",
    size: "100",
  });

  const json = await harnessPost<HarnessPage<{ identifier?: string; name?: string }>>(
    station,
    `/pipeline/api/pipelines/list?${qs}`,
    { filterType: "PipelineSetup" },
  );

  return (json.data?.content ?? []).map((p) => ({
    identifier: p.identifier || "unknown",
    name: displayName(p.name, p.identifier || "Pipeline"),
  }));
}

export async function fetchExecutions(station: Station): Promise<ExecutionInfo[]> {
  const qs = new URLSearchParams({
    accountIdentifier: station.accountId,
    orgIdentifier: station.orgId,
    projectIdentifier: station.projectId,
    page: "0",
    size: "50",
  });

  const json = await harnessPost<
    HarnessPage<{
      pipelineIdentifier?: string;
      name?: string;
      status?: string;
      planExecutionId?: string;
      startTs?: number;
    }>
  >(station, `/pipeline/api/pipelines/execution/summary?${qs}`, {
    filterType: "PipelineExecution",
  });

  return (json.data?.content ?? []).map((e) => ({
    pipelineIdentifier: e.pipelineIdentifier || "unknown",
    name: displayName(e.name, e.pipelineIdentifier || "Pipeline"),
    status: e.status || "Unknown",
    planExecutionId: e.planExecutionId || "",
    startTs: e.startTs,
  }));
}

export function executionHref(station: Station, execution: ExecutionInfo): string {
  const base = station.baseUrl.replace(/\/$/, "");
  return `${base}/ng/account/${encodeURIComponent(station.accountId)}/all/orgs/${encodeURIComponent(station.orgId)}/projects/${encodeURIComponent(station.projectId)}/pipelines/${encodeURIComponent(execution.pipelineIdentifier)}/deployments/${encodeURIComponent(execution.planExecutionId)}/pipeline`;
}
