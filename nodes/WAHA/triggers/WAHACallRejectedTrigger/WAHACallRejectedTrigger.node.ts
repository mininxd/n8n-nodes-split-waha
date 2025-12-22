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

const event = 'call.rejected';
const events = [event];

export class WAHACallRejectedTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Call Rejected Trigger',
		name: 'wahaCallRejectedTrigger',
		icon: 'file:../waha.svg',
		description: 'The event is triggered when the call is rejected by the user.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['call.rejected'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
