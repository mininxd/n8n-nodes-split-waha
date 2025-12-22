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

const event = 'message.any';
const events = [event];

export class WAHAMessageAnyTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Message Any Trigger',
		name: 'wahaMessageAnyTrigger',
		icon: 'file:../waha.svg',
		description: 'Fired on all message creations, including your own.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['message.any'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
