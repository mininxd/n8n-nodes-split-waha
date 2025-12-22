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

const event = 'engine.event';
const events = [event];

export class WAHAEngineEventTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Engine Event Trigger',
		name: 'wahaEngineEventTrigger',
		icon: 'file:../waha.svg',
		description: 'Internal engine event.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['engine.event'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
