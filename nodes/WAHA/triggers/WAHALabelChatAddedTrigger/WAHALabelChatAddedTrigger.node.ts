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

const event = 'label.chat.added';
const events = [event];

export class WAHALabelChatAddedTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Label Chat Added Trigger',
		name: 'wahaLabelChatAddedTrigger',
		icon: 'file:../waha.svg',
		description: 'The event is triggered when a label is added to a chat',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['label.chat.added'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
