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

const event = 'chat.archive';
const events = [event];

export class WAHAChatArchiveTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Chat Archive Trigger',
		name: 'wahaChatArchiveTrigger',
		icon: 'file:../waha.svg',
		description: 'The event is triggered when the chat is archived or unarchived',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['chat.archive'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
