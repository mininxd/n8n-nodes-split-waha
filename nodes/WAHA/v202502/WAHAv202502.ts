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

// Patch "Send *" operations to support dynamic Content-Type
const chattingOp = properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('Chatting'));
const supportedBinaryOps = ['Send Image', 'Send File', 'Send Voice', 'Send Video'];
const supportedBinaryOpsValues: string[] = [];

// @ts-ignore
if (chattingOp && chattingOp.options) {
	// @ts-ignore
	chattingOp.options.forEach((option) => {
		if (supportedBinaryOps.includes(option.name)) {
			// Collect the internal value for displayOptions logic
			// @ts-ignore
			supportedBinaryOpsValues.push(option.value as string);

			// Change Content-Type to dynamic expression
			// @ts-ignore
			if (option.routing && option.routing.request) {
				// @ts-ignore
				if (!option.routing.request.headers) {
					// @ts-ignore
					option.routing.request.headers = {};
				}
				// @ts-ignore
				option.routing.request.headers['Content-Type'] = '={{ $parameter.fileUploadMode === "Binary" ? "multipart/form-data" : "application/json" }}';
			}
		}
	});
}

const fileUploadModeTemplate = {
	displayName: 'File Upload Mode',
	name: 'fileUploadMode',
	type: 'options',
	options: [
		{
			name: 'JSON',
			value: 'JSON',
		},
		{
			name: 'Binary',
			value: 'Binary',
		},
	],
	default: 'JSON',
	description: 'Select how to upload the file. This feature usable with mininxd/waha v2026.1.5.',
	displayOptions: {
		show: {
			resource: ['Chatting'],
			// operation: will be set dynamically
		},
	},
};

const binaryPropTemplate = {
	displayName: 'File',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	required: true,
	displayOptions: {
		show: {
			resource: ['Chatting'],
			// operation: will be set dynamically
			fileUploadMode: ['Binary'],
		},
	},
	routing: {
		send: {
			type: 'body',
			property: 'file',
			value: '={{ $binary[$value] }}',
		},
	},
	description: 'Name of the binary property which contains the data to upload',
};

// Find all 'file' properties and patch them
// Iterate backwards to avoid index shifting issues when splicing
for (let i = properties.length - 1; i >= 0; i--) {
	const p = properties[i];
	// Check if property is 'file' and belongs to 'Chatting'
	if (p.name === 'file' && p.displayOptions?.show?.resource?.includes('Chatting')) {
		// Check if it belongs to one of the supported operations
		// @ts-ignore
		const ops = p.displayOptions.show.operation as string[];
		const supportedOp = ops && ops.find((op) => supportedBinaryOpsValues.includes(op));

		if (supportedOp) {
			// Found a target 'file' property.

			// 1. Create specific 'fileUploadMode' parameter
			const modeParam = JSON.parse(JSON.stringify(fileUploadModeTemplate));
			// @ts-ignore
			modeParam.displayOptions.show.operation = [supportedOp];

			// 2. Create specific 'binaryPropertyName' parameter
			const binaryParam = JSON.parse(JSON.stringify(binaryPropTemplate));
			// @ts-ignore
			binaryParam.displayOptions.show.operation = [supportedOp];

			// 3. Insert 'fileUploadMode' BEFORE 'file' (at index i)
			properties.splice(i, 0, modeParam);

			// Now 'file' is at i + 1
			const fileProp = properties[i + 1];

			// 4. Modify 'file' (JSON) to show only when mode is JSON
			// Break reference sharing for displayOptions
			// @ts-ignore
			if (fileProp.displayOptions) {
				// @ts-ignore
				fileProp.displayOptions = { ...fileProp.displayOptions };
				// @ts-ignore
				if (fileProp.displayOptions.show) {
					// @ts-ignore
					fileProp.displayOptions.show = { ...fileProp.displayOptions.show };
				}
			} else {
				// @ts-ignore
				fileProp.displayOptions = {};
			}

			// @ts-ignore
			if (!fileProp.displayOptions.show) {
				// @ts-ignore
				fileProp.displayOptions.show = {};
			}
			// @ts-ignore
			fileProp.displayOptions.show.fileUploadMode = ['JSON'];

			// Patch existing routing to avoid sending JSON when hidden (Binary mode)
			// @ts-ignore
			if (!fileProp.routing) fileProp.routing = {};
			// @ts-ignore
			if (!fileProp.routing.send) fileProp.routing.send = {};

			// @ts-ignore
			let originalValue = fileProp.routing.send.value || '$value';
			if (originalValue.startsWith('=')) {
				originalValue = originalValue.slice(1);
			}
			if (originalValue.startsWith('{{') && originalValue.endsWith('}}')) {
				originalValue = originalValue.slice(2, -2);
			}
			const innerValue = originalValue.trim();

			// @ts-ignore
			fileProp.routing.send.value = `={{ $parameter.fileUploadMode === 'Binary' ? undefined : ${innerValue} }}`;

			// 5. Insert 'binaryPropertyName' AFTER 'file' (at index i + 2)
			properties.splice(i + 2, 0, binaryParam);
		}
	}
}

export class WAHAv202502 implements INodeType {
	description: INodeTypeDescription = {
		...BASE_DESCRIPTION,
		...NODE_DESCRIPTION,
		version: 202502,
		// @ts-ignore
		properties: properties,
	};
}
