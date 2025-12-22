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

const event = 'label.upsert';
const events = [event];

export class WAHALabelUpsertTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Label Upsert Trigger',
		name: 'wahaLabelUpsertTrigger',
		icon: 'file:waha.svg',
		description: 'The event is triggered when a label is created or updated',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['label.upsert'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
