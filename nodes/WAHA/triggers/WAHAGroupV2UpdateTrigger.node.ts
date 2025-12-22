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

const event = 'group.v2.update';
const events = [event];

export class WAHAGroupV2UpdateTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Group V2 Update Trigger',
		name: 'wahaGroupV2UpdateTrigger',
		icon: 'file:waha.svg',
		description: 'When group info is updated',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['group.v2.update'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
