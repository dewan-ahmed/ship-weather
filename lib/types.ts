export type Station = {
  accountId: string;
  orgId: string;
  projectId: string;
  pat: string;
  baseUrl: string;
};

export type PipelineInfo = {
  identifier: string;
  name: string;
};

export type ExecutionInfo = {
  pipelineIdentifier: string;
  name: string;
  status: string;
  planExecutionId: string;
  startTs?: number;
};

export type Condition =
  | "sunny"
  | "partly"
  | "cloudy"
  | "rain"
  | "storm"
  | "fog"
  | "wind";

export type PipelineForecast = {
  identifier: string;
  name: string;
  status: string;
  condition: Condition;
  blurb: string;
  href?: string;
};

export type WeatherReport = {
  condition: Condition;
  headline: string;
  summary: string;
  temperature: number;
  successRate: number | null;
  failChance: number;
  running: number;
  failed: number;
  succeeded: number;
  total: number;
  pipelines: PipelineForecast[];
};
