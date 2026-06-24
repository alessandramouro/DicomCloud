import * as fs from 'fs';
import * as path from 'path';

/**
 * Plain, dependency-free credential persistence — used both by agent.config.ts's
 * registerAs() factory (synchronous, runs before any Nest provider exists) and by
 * main.ts's pre-boot enrollment step (runs before NestFactory.create).
 */
export interface AgentCredentials {
  agentId: string;
  apiKey: string;
}

function credentialsPath(): string {
  const storagePath = process.env.STORAGE_PATH || './storage';
  return path.join(storagePath, 'credentials.json');
}

export function readCredentials(): AgentCredentials | null {
  try {
    const raw = fs.readFileSync(credentialsPath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AgentCredentials>;
    if (parsed.agentId && parsed.apiKey) {
      return { agentId: parsed.agentId, apiKey: parsed.apiKey };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCredentials(credentials: AgentCredentials): void {
  const filePath = credentialsPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(credentials, null, 2), 'utf-8');
}
