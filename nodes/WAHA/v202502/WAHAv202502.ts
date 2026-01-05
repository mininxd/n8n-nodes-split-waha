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

// @ts-ignore
if (chattingOp && chattingOp.options) {
	// @ts-ignore
	chattingOp.options.forEach((option) => {
		if (supportedBinaryOps.includes(option.name)) {
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

// Find the 'file' property to insert 'fileUploadMode' before it and update it
const filePropIndex = properties.findIndex((p) => p.name === 'file');
if (filePropIndex !== -1) {
	// Add 'fileUploadMode' parameter before 'file'
	properties.splice(filePropIndex, 0, {
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
		description: 'Select how to upload the file. This feature usable with mininxd/waha v2026.1.5',
		displayOptions: {
			show: {
				resource: ['Chatting'],
				operation: supportedBinaryOps,
			},
		},
	});

	const fileProp = properties[filePropIndex + 1]; // Shifted by 1

	// Break reference sharing for displayOptions
	// @ts-ignore
	if (fileProp.displayOptions) {
		// @ts-ignore
		fileProp.displayOptions = { ...fileProp.displayOptions };
	} else {
		// @ts-ignore
		fileProp.displayOptions = {};
	}

	// @ts-ignore
	fileProp.displayOptions.hide = {
		fileUploadMode: ['Binary'],
	};

	// Patch existing routing to avoid sending JSON when hidden
	// @ts-ignore
	if (fileProp.routing && fileProp.routing.send && fileProp.routing.send.value) {
		// @ts-ignore
		fileProp.routing.send.value = `={{ $parameter.fileUploadMode === 'Binary' ? undefined : JSON.parse($value) }}`;
	}
}

// Add 'binaryPropertyName' parameter
properties.push({
	displayName: 'Binary Property',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	required: true,
	displayOptions: {
		show: {
			resource: ['Chatting'],
			operation: supportedBinaryOps,
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
