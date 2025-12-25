import {
	type IDataObject,
	type INodeExecutionData,
	INodeProperties,
	INodeTypeBaseDescription,
	WebhookType,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

export const BASE_TRIGGER_DESCRIPTION: INodeTypeBaseDescription = {
	displayName: 'WAHA Trigger(S)',
	name: 'wahaTriggerSplit',
	icon: 'file:waha.svg',
	group: ['trigger'],
	description: 'Handle WAHA events via webhooks',
};
export const TRIGGER_DESCRIPTION = {
	defaults: {
		name: 'WAHA Trigger',
	},
	inputs: [],
	credentials: [
		{
			name: 'wahaApi',
			required: false,
		},
	],
	webhooks: [
		{
			name: 'default' as WebhookType,
			httpMethod: 'POST',
			responseMode: 'onReceived',
			path: 'waha',
		},
	],
};

export const SESSION_PROPERTY: INodeProperties = {
	displayName: 'Session',
	name: 'session',
	type: 'string',
	default: 'default',
	description: 'The session to listen to',
};

export const WEBHOOK_URL_PROPERTY: INodeProperties = {
	displayName: 'Webhook URL Override',
	name: 'webhookUrl',
	type: 'string',
	default: '',
	description:
		'Override the webhook URL sent to WAHA. Useful if using a tunnel or proxy. Leave empty to use n8n detected URL.',
};

export const CONFIGURE_WEBHOOK_NOTE: INodeProperties = {
	displayName:
		'Remember to configure WAHA instance (session or server) to send events to <b>Webhook URL</b>. ' +
		'<br/>Check <b>Docs</b> link above☝️',
	name: 'operation',
	type: 'notice',
	typeOptions: {
		theme: 'info',
	},
	default: '',
};

function noteText(events: string[]): string {
	const parts = ['<b>Events</b>:'];
	for (const event of events) {
		parts.push(`- ${event}`);
	}
	return parts.join('<br>');
}

export function makeEventNote(events: string[]): INodeProperties {
	return {
		displayName: noteText(events),
		name: 'operation',
		type: 'notice',
		typeOptions: {
			theme: 'info',
		},
		default: '',
	};
}

export function makeWebhookForEvents(events: string[]) {
	async function webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const eventType = bodyData.event as string | undefined;

		if (eventType === undefined || !events.includes(eventType)) {
			// If not eventType is defined or when one is defined, but we are not
			// listening to it do not start the workflow.
			return {};
		}

		// Filter by session if configured
		try {
			const session = this.getNodeParameter('session', 'default') as string;
			const bodySession = bodyData.session as string | undefined;
			// If the event has session info, and we configured a session, they must match.
			// If event doesn't have session info (e.g. engine event might not?), we might skip check or assume match?
			// Usually WAHA events have session.
			if (bodySession && bodySession !== session) {
				return {};
			}
		} catch (error) {
			// Parameter likely doesn't exist on this node version, ignore
		}

		const eventIndex: number = events.indexOf(eventType);
		const req = this.getRequestObject();

		const data = this.helpers.returnJsonArray(req.body as IDataObject);
		const empty: INodeExecutionData[] = [];
		const workflowData = events.map((_) => empty);
		workflowData[eventIndex] = data;

		return {
			workflowData: workflowData,
		};
	}

	return webhook;
}

// Exporting types for usage in triggers
