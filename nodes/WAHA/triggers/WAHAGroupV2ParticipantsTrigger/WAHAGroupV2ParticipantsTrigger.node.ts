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

const event = 'group.v2.participants';
const events = [event];

export class WAHAGroupV2ParticipantsTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Group V2 Participants Trigger',
		name: 'wahaGroupV2ParticipantsTrigger',
		icon: 'file:../waha.svg',
		description: 'When participants changed - join, leave, promote to admin',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['group.v2.participants'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
