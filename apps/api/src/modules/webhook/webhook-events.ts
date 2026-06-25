/** Events a WebhookConfig can subscribe to — must match the @OnEvent() handlers in webhook.service.ts. */
export const WEBHOOK_EVENTS = ['study.received', 'export.completed', 'agent.offline', 'agent.online'] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
