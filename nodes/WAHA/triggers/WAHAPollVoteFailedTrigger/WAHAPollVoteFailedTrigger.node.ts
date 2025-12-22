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

const event = 'poll.vote.failed';
const events = [event];

export class WAHAPollVoteFailedTrigger implements INodeType {
	description: INodeTypeDescription = {
		...BASE_TRIGGER_DESCRIPTION,
		...TRIGGER_DESCRIPTION,
		version: 1,
		displayName: 'WAHA Poll Vote Failed Trigger',
		name: 'wahaPollVoteFailedTrigger',
		icon: 'file:../waha.svg',
		description: 'There may be cases when it fails to decrypt a vote from the user. Read more about how to handle such events in the documentations.',
		outputs: [NodeConnectionTypes.Main],
		outputNames: ['poll.vote.failed'],
		properties: [CONFIGURE_WEBHOOK_NOTE, makeEventNote(events)],
	};
	webhook = makeWebhookForEvents(events);
}
