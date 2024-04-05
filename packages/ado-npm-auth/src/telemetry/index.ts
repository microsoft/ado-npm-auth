import { platform, arch } from "os";
import { isWsl } from "../utils/is-wsl.js";

export type TelemetryProperties = {
  success: boolean;
  automaticSuccess: boolean;
  platform: string;
  arch: string;
  error: string;
};

export interface TelemetryClient {
  LogEvent: (eventName: string, properties: Map<string, string>) => void;
  flush(): void;
};

/**
 * Logs an node-azure-auth event to telemetry.
 */
export const logTelemetry = (
  inputProperties: {
    success?: boolean;
    automaticSuccess?: boolean;
    error?: string;
  },
  flush?: boolean,
  client?: TelemetryClient,
) => {
  const outputProperties = new Map<string, string>();
  outputProperties.set("success", inputProperties.success ? "true" : "false");
  outputProperties.set(
    "automaticSuccess",
    inputProperties.automaticSuccess ? "true" : "false"
  );
  outputProperties.set(
    "error",
    inputProperties.error ? inputProperties.error : ""
  );
  outputProperties.set("platform", isWsl() ? "wsl" : platform());
  outputProperties.set("arch", arch());

  if (client) {
    client.LogEvent("node-azure-auth", outputProperties);
    
    if (flush) {
      client.flush();
    }
  }
};
