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

const event = 'message.revoked';
const events = [event];

export class WAHAMessageRevokedTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Message Revoked Trigger',
		name: 'wahaMessageRevokedTrigger',
		icon: 'file:waha.svg',
		description: 'The event is triggered when a user, whether it be you or any other participant, revokes a previously sent message.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['message.revoked'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
