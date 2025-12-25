import {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import * as doc from './openapi.json';
import {
	BASE_TRIGGER_DESCRIPTION,
	CONFIGURE_WEBHOOK_NOTE,
	makeEventNote,
	makeWebhookForEvents,
	SESSION_PROPERTY,
	TRIGGER_DESCRIPTION,
	WEBHOOK_URL_PROPERTY,
} from '../base/trigger';

function getEvents() {
	const schemas = doc.components.schemas;
	const schema = schemas.WAHAWebhookSessionStatus;
	const event = schema.properties.event;
	return event.enum;
}

const events = getEvents();
const outputs = events.map((_) => NodeConnectionTypes.Main);
const outputNames = events;

export class WAHATriggerV202502 implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 202502,
		outputs: outputs,
		outputNames: outputNames,
		properties: [
			SESSION_PROPERTY,
			WEBHOOK_URL_PROPERTY,
			CONFIGURE_WEBHOOK_NOTE,
			makeEventNote(events),
		],
	};
	webhook = makeWebhookForEvents(events);
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// We can't really check efficiently without fetching the whole config.
				// For now, return false to force 'create' which will update the config.
				const session = this.getNodeParameter('session', 'default') as string;
				let webhookUrl = this.getNodeParameter('webhookUrl', '') as string;
				if (!webhookUrl) {
					webhookUrl = this.getNodeWebhookUrl('default') as string;
				}

				try {
					const response = await this.helpers.requestWithAuthentication.call(this, 'wahaApi', {
						method: 'GET',
						uri: `/api/sessions/${session}`,
						json: true,
					});

					const currentWebhooks = response.content?.config?.webhooks || [];
					const found = currentWebhooks.find((w: any) => w.url === webhookUrl);
					if (!found) {
						return false;
					}
					// Check if events match? Maybe overkill.
					return true;
				} catch (error) {
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const session = this.getNodeParameter('session', 'default') as string;
				let webhookUrl = this.getNodeParameter('webhookUrl', '') as string;
				if (!webhookUrl) {
					webhookUrl = this.getNodeWebhookUrl('default') as string;
				}

				// Check credentials
				try {
					this.getCredentials('wahaApi');
				} catch (e) {
					// No credentials, skip registration
					return true;
				}

				// Fetch current config
				let currentWebhooks: any[] = [];
				try {
					const response = await this.helpers.requestWithAuthentication.call(this, 'wahaApi', {
						method: 'GET',
						uri: `/api/sessions/${session}`,
						json: true,
					});
					currentWebhooks = response.content?.config?.webhooks || [];
				} catch (error) {
					// Session might not exist or error
					console.error('Failed to fetch session config', error);
					// For now, try to update anyway or throw
					throw error;
				}

				// Add or update webhook
				const existingIndex = currentWebhooks.findIndex((w: any) => w.url === webhookUrl);
				if (existingIndex !== -1) {
					currentWebhooks[existingIndex] = {
						url: webhookUrl,
						events: events,
					};
				} else {
					currentWebhooks.push({
						url: webhookUrl,
						events: events,
					});
				}

				// Update session
				await this.helpers.requestWithAuthentication.call(this, 'wahaApi', {
					method: 'PUT',
					uri: `/api/sessions/${session}`,
					body: {
						config: {
							webhooks: currentWebhooks,
						},
					},
					json: true,
				});

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const session = this.getNodeParameter('session', 'default') as string;
				let webhookUrl = this.getNodeParameter('webhookUrl', '') as string;
				if (!webhookUrl) {
					webhookUrl = this.getNodeWebhookUrl('default') as string;
				}

				// Check credentials
				try {
					this.getCredentials('wahaApi');
				} catch (e) {
					return true;
				}

				// Fetch current config
				let currentWebhooks: any[] = [];
				try {
					const response = await this.helpers.requestWithAuthentication.call(this, 'wahaApi', {
						method: 'GET',
						uri: `/api/sessions/${session}`,
						json: true,
					});
					currentWebhooks = response.content?.config?.webhooks || [];
				} catch (error) {
					// If we can't fetch, maybe session is gone. Ignore.
					return true;
				}

				// Remove webhook
				const newWebhooks = currentWebhooks.filter((w: any) => w.url !== webhookUrl);

				if (newWebhooks.length === currentWebhooks.length) {
					return true; // Nothing to remove
				}

				// Update session
				await this.helpers.requestWithAuthentication.call(this, 'wahaApi', {
					method: 'PUT',
					uri: `/api/sessions/${session}`,
					body: {
						config: {
							webhooks: newWebhooks,
						},
					},
					json: true,
				});

				return true;
			},
		},
	};
}
