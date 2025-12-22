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

const event = 'group.v2.leave';
const events = [event];

export class WAHAGroupV2LeaveTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Group V2 Leave Trigger',
		name: 'wahaGroupV2LeaveTrigger',
		icon: 'file:../waha.svg',
		description: 'When you left or were removed from a group',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['group.v2.leave'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
