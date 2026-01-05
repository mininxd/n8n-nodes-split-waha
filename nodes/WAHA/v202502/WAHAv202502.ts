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

// Patch "Send *" operations to support Binary Uploads (via Split Operation strategy)
const chattingOp = properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('Chatting'));
const supportedBinaryOps = ['Send Image', 'Send File', 'Send Voice', 'Send Video'];
const newOptions: any[] = [];

// @ts-ignore
if (chattingOp && chattingOp.options) {
	// @ts-ignore
	chattingOp.options.forEach((option) => {
		// @ts-ignore
		if (supportedBinaryOps.includes((option as any).value as string)) {
			// Create Binary version of the operation
			const newOption = JSON.parse(JSON.stringify(option));
			newOption.name = `${(option as any).name} (Binary)`;
			newOption.value = `${(option as any).value}:Binary`;

			if (!newOption.routing) newOption.routing = {};
			// Enable binary data sending
			newOption.routing.sendBinaryData = true;
			// Tell n8n which property holds the binary data key
			newOption.routing.binaryPropertyName = 'binaryPropertyName';

			// Remove Content-Type header if it exists to let n8n handle multipart boundary
			if (newOption.routing.request && newOption.routing.request.headers) {
				delete newOption.routing.request.headers['Content-Type'];
			}

			newOptions.push(newOption);
		}
	});
	// Append the new binary operations
	// @ts-ignore
	chattingOp.options.push(...newOptions);
}

const binaryPropTemplate = {
	displayName: 'Input Binary Field',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	required: true,
	displayOptions: {
		show: {
			resource: ['Chatting'],
			// operation: will be set dynamically
		},
	},
	description: 'The name of the binary property which contains the file to be uploaded',
};

// Find all 'file' properties and insert 'binaryPropertyName' parameter
// Iterate backwards to avoid index shifting issues when splicing
for (let i = properties.length - 1; i >= 0; i--) {
	const p = properties[i];
	// Check if property is 'file' and belongs to 'Chatting'
	if (p.name === 'file' && p.displayOptions?.show?.resource?.includes('Chatting')) {
		// Check which operations this 'file' property belongs to
		// @ts-ignore
		const ops = p.displayOptions.show.operation as string[];

		// Find overlap between this property's ops and our supported binary ops
		const relevantOps = ops && ops.filter((op) => supportedBinaryOps.includes(op));

		if (relevantOps && relevantOps.length > 0) {
			// Generate the corresponding :Binary operation values
			const relevantBinaryOpsValues = relevantOps.map((op) => `${op}:Binary`);

			// Create specific 'binaryPropertyName' parameter for these operations
			const binaryParam = JSON.parse(JSON.stringify(binaryPropTemplate));
			// @ts-ignore
			binaryParam.displayOptions.show.operation = relevantBinaryOpsValues;

			// Insert 'binaryPropertyName' AFTER 'file' (at index i + 1)
			properties.splice(i + 1, 0, binaryParam);
		}
	}
}

// Update existing parameters to show up for the new :Binary operations
properties.forEach((p) => {
	// Skip the 'file' parameter itself (we use binaryPropertyName instead)
	if (p.name === 'file') return;

	if (p.displayOptions?.show?.operation) {
		const ops = p.displayOptions.show.operation as string[];
		const newBinaryOps: string[] = [];

		ops.forEach((op) => {
			if (supportedBinaryOps.includes(op)) {
				newBinaryOps.push(`${op}:Binary`);
			}
		});

		if (newBinaryOps.length > 0) {
			// Add the new binary operations to the existing list
			ops.push(...newBinaryOps);
		}
	}
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
