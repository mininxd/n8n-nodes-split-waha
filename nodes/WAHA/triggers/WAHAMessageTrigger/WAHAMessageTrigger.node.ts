import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import {
	BASE_TRIGGER_DESCRIPTION,
	CONFIGURE_WEBHOOK_NOTE,
	makeEventNote,
	makeWebhookForEvents,
	TRIGGER_DESCRIPTION,
} from '../../base/trigger';

const event = 'message';
const events = [event];

export class WAHAMessageTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Message Trigger',
		name: 'wahaMessageTrigger',
		icon: 'file:../waha.svg',
		description: 'Incoming message.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['message'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
