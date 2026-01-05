import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as doc from './openapi.json';
import { BASE_DESCRIPTION, NODE_DESCRIPTION } from '../base/node';
import { WAHAOperationsCollector } from '../openapi/WAHAOperationsCollector';
import {
	N8NPropertiesBuilder,
	N8NPropertiesBuilderConfig,
	Override,
} from '@devlikeapro/n8n-openapi-node';
import {WAHAOperationParser} from "../openapi/WAHAOperationParser";
import {WAHAResourceParser} from "../openapi/WAHAResourceParser";

const customDefaults: Override[] = [
	{
		find: {
			name: 'session',
			required: true,
			type: 'string',
		},
		replace: {
			default: '={{ $json.session }}',
		},
	},
	{
		find: {
			name: 'chatId',
			required: true,
			type: 'string',
		},
		replace: {
			default: '={{ $json.payload.from }}',
		},
	},
	{
		find: {
			name: 'messageId',
			type: 'string',
		},
		replace: {
			default: '={{ $json.payload.id }}',
		},
	},
	{
		find: {
			name: 'reply_to',
			type: 'string',
		},
		replace: {
			default: '',
		},
	},
];

const config: N8NPropertiesBuilderConfig = {
	OperationsCollector: WAHAOperationsCollector as any,
	operation: new WAHAOperationParser(),
	resource: new WAHAResourceParser(),
};
const parser = new N8NPropertiesBuilder(doc, config);
const properties = parser.build(customDefaults);

// Add Binary Support
const chattingOp = properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('Chatting'));
// @ts-ignore
if (chattingOp && chattingOp.options) {
	const endpoints = [
		{ name: 'Send Image', path: '/api/sendImage' },
		{ name: 'Send File', path: '/api/sendFile' },
		{ name: 'Send Voice', path: '/api/sendVoice' },
		{ name: 'Send Video', path: '/api/sendVideo' },
	];

	endpoints.forEach((ep) => {
		// Add (Binary) variant
		// @ts-ignore
		chattingOp.options.push({
			name: `${ep.name} (Binary)`,
			value: `${ep.name} (Binary)`,
			action: `${ep.name} (Binary)`,
			description: 'This feature usable with mininxd/waha v2026.1.5',
			routing: {
				request: {
					method: 'POST',
					url: `=${ep.path}`,
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				},
				send: {
					type: 'body',
					property: 'file',
				},
			},
		});
	});
}

// Update existing properties to show up for new operations
properties.forEach((p) => {
	// @ts-ignore
	if (p.displayOptions?.show?.operation) {
		// @ts-ignore
		const ops = p.displayOptions.show.operation;
		const newOps: string[] = [];
		if (p.name !== 'file') {
			// Exclude 'file' property
			if (ops.includes('Send Image')) newOps.push('Send Image (Binary)');
			if (ops.includes('Send File')) newOps.push('Send File (Binary)');
			if (ops.includes('Send Voice')) newOps.push('Send Voice (Binary)');
			if (ops.includes('Send Video')) newOps.push('Send Video (Binary)');
		}

		if (newOps.length > 0) {
			// Break reference sharing for displayOptions and show to avoid affecting other properties (like 'file')
			// @ts-ignore
			if (p.displayOptions) {
				// @ts-ignore
				p.displayOptions = { ...p.displayOptions };
				// @ts-ignore
				if (p.displayOptions.show) {
					// @ts-ignore
					p.displayOptions.show = { ...p.displayOptions.show };
				}
			}

			// Create a new array
			// @ts-ignore
			p.displayOptions.show.operation = [...new Set([...ops, ...newOps])];
		}
	}
});

// Add properties for binary inputs
properties.push({
	displayName: 'File (Binary)',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	required: true,
	displayOptions: {
		show: {
			resource: ['Chatting'],
			operation: [
				'Send Image (Binary)',
				'Send File (Binary)',
				'Send Voice (Binary)',
				'Send Video (Binary)',
			],
		},
	},
	description: 'Name of the binary property to upload',
});

export class WAHAv202502 implements INodeType {
	description: INodeTypeDescription = {
		...BASE_DESCRIPTION,
		...NODE_DESCRIPTION,
		version: 202502,
		// @ts-ignore
		properties: properties,
	};
}
