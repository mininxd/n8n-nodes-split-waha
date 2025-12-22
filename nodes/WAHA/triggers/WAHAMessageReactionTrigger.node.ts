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

const event = 'message.reaction';
const events = [event];

export class WAHAMessageReactionTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Message Reaction Trigger',
		name: 'wahaMessageReactionTrigger',
		icon: 'file:waha.svg',
		description: 'The event is triggered when a user reacts or removes a reaction.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['message.reaction'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
