import { executionHref } from "./api";
import type {
  Condition,
  ExecutionInfo,
  PipelineForecast,
  PipelineInfo,
  Station,
  WeatherReport,
} from "./types";

const SUCCESS = new Set(["Success", "IgnoreFailed"]);
const RUNNING = new Set([
  "Running",
  "Waiting",
  "Queued",
  "Paused",
  "ApprovalWaiting",
  "ResourceWaiting",
  "InterventionWaiting",
  "ApprovalRejected",
]);

function conditionForRate(successRate: number, running: number, failed: number): Condition {
  if (failed >= 4 && successRate < 40) return "storm";
  if (successRate >= 90 && failed === 0) return running > 0 ? "wind" : "sunny";
  if (successRate >= 75) return running > 2 ? "wind" : "partly";
  if (successRate >= 55) return "cloudy";
  if (successRate >= 35) return "rain";
  return "storm";
}

function pipelineCondition(status: string): Condition {
  if (SUCCESS.has(status)) return "sunny";
  if (RUNNING.has(status)) return "wind";
  if (status === "Expired") return "fog";
  if (status === "Failed" || status === "Errored" || status === "Aborted") {
    return "rain";
  }
  return "cloudy";
}

function pipelineBlurb(status: string): string {
  if (SUCCESS.has(status)) return "Fair winds. Last run shipped.";
  if (RUNNING.has(status)) return "Still at sea — run in progress.";
  if (status === "Failed" || status === "Errored") return "Squall. Last run failed.";
  if (status === "Aborted") return "Turned back. Run aborted.";
  if (status === "Expired") return "Becalmed. Run expired.";
  return `Current status: ${status}.`;
}

const COPY: Record<Condition, { headline: string; summary: string }> = {
  sunny: {
    headline: "Clear shipping skies",
    summary: "Pipelines are leaving the harbor on time. A fine day to ship.",
  },
  partly: {
    headline: "Mostly fair, a few clouds",
    summary: "Most runs are green. Keep an eye on the occasional flake.",
  },
  cloudy: {
    headline: "Overcast over the shipyard",
    summary: "Mixed results. Pack a jacket — some deploys may drizzle.",
  },
  rain: {
    headline: "Failed-deploy showers",
    summary: "Bring a raincoat. Several recent runs did not make it to shore.",
  },
  storm: {
    headline: "Severe shipping weather",
    summary: "Thunder over CI. Seek logs and shelter before the next launch.",
  },
  fog: {
    headline: "Harbor fog",
    summary: "No recent ships have sailed from this project. Waiting on the first run.",
  },
  wind: {
    headline: "Gusty with pipelines in flight",
    summary: "Runs are still moving. Expect chop until they dock.",
  },
};

export function buildWeather(
  station: Station,
  pipelines: PipelineInfo[],
  executions: ExecutionInfo[],
): WeatherReport {
  if (executions.length === 0) {
    return {
      condition: "fog",
      ...COPY.fog,
      temperature: 52,
      successRate: null,
      failChance: 0,
      running: 0,
      failed: 0,
      succeeded: 0,
      total: 0,
      pipelines: pipelines.map((p) => ({
        identifier: p.identifier,
        name: p.name,
        status: "No runs",
        condition: "fog",
        blurb: "Has not left the dock yet.",
      })),
    };
  }

  const terminal = executions.filter((e) => !RUNNING.has(e.status));
  const succeeded = terminal.filter((e) => SUCCESS.has(e.status)).length;
  const failed = terminal.filter(
    (e) => !SUCCESS.has(e.status) && e.status !== "Skipped",
  ).length;
  const running = executions.filter((e) => RUNNING.has(e.status)).length;
  const successRate =
    terminal.length === 0 ? 100 : Math.round((succeeded / terminal.length) * 100);
  const failChance = terminal.length === 0 ? 0 : Math.round((failed / terminal.length) * 100);
  const condition = conditionForRate(successRate, running, failed);

  const latestByPipeline = new Map<string, ExecutionInfo>();
  for (const execution of executions) {
    if (!latestByPipeline.has(execution.pipelineIdentifier)) {
      latestByPipeline.set(execution.pipelineIdentifier, execution);
    }
  }

  const forecast: PipelineForecast[] = [];
  const seen = new Set<string>();

  for (const [identifier, execution] of latestByPipeline) {
    seen.add(identifier);
    const named =
      pipelines.find((p) => p.identifier === identifier)?.name || execution.name;
    forecast.push({
      identifier,
      name: named,
      status: execution.status,
      condition: pipelineCondition(execution.status),
      blurb: pipelineBlurb(execution.status),
      href: execution.planExecutionId ? executionHref(station, execution) : undefined,
    });
  }

  for (const pipeline of pipelines) {
    if (seen.has(pipeline.identifier)) continue;
    forecast.push({
      identifier: pipeline.identifier,
      name: pipeline.name,
      status: "No runs",
      condition: "fog",
      blurb: "Has not left the dock yet.",
    });
  }

  return {
    condition,
    headline: COPY[condition].headline,
    summary: COPY[condition].summary,
    temperature: Math.round(38 + successRate * 0.5),
    successRate,
    failChance,
    running,
    failed,
    succeeded,
    total: executions.length,
    pipelines: forecast,
  };
}
