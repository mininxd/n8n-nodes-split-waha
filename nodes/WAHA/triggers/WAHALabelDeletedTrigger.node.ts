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
} from '../base/trigger';

const event = 'label.deleted';
const events = [event];

export class WAHALabelDeletedTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Label Deleted Trigger',
		name: 'wahaLabelDeletedTrigger',
		icon: 'file:waha.svg',
		description: 'The event is triggered when a label is deleted',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['label.deleted'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
