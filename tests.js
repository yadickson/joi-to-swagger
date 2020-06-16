var suite = require('tapsuite');
var parser = require('./');
var joi = require('@hapi/joi');

suite('swagger converts', (s) => {
	var i = 0;
	function simpleTest (input, output, components, only) {
		s[only ? 'only' : 'test']('Set ' + i++, (t) => {
			var result = parser(input);
			t.deepEqual(result.swagger, output, 'swagger matches');
			if (components) t.deepEqual(result.components, components, 'components match');
			t.end();
		});
	}

	simpleTest(
		joi.any(),
		{
			type: 'string'
		}
	);

	simpleTest(
		joi.number().integer().default(10),
		{
			type: 'integer',
			default: 10
		}
	);

	simpleTest(
		joi.number().integer().min(1).max(10),
		{
			type: 'integer',
			maximum: 10,
			minimum: 1,
		}
	);

	simpleTest(
		joi.number().integer().positive(),
		{
			type: 'integer',
			minimum: 1,
		}
	);

	simpleTest(
		joi.number().integer().negative(),
		{
			type: 'integer',
			maximum: -1,
		}
	);

	simpleTest(
		joi.number().positive(),
		{
			type: 'number',
			format: 'float',
			minimum: 1,
		}
	);

	simpleTest(
		joi.number().negative(),
		{
			type: 'number',
			format: 'float',
			maximum: -1,
		}
	);

	simpleTest(
		joi.number().precision(2).negative(),
		{
			type: 'number',
			format: 'double',
			maximum: -1,
		}
	);

	simpleTest(
		joi.number().integer().label('number title'),
		{
			type: 'integer',
			title: 'number title'
		}
	);

	simpleTest(
		joi.number().integer().description('number description'),
		{
			type: 'integer',
			description: 'number description'
		}
	);

	simpleTest(
		joi.number().integer().allow(1, 2, 3),
		{
			type: 'integer',
			enum: [ 1, 2, 3 ],
			nullable: false
		}
	);

	simpleTest(
		joi.number().integer().allow(1, 2, 3, null),
		{
			type: 'integer',
			enum: [ 1, 2, 3 ],
			nullable: true
		}
	);

	simpleTest(
		joi.number().integer().valid(1, 2, 3),
		{
			type: 'integer',
			enum: [ 1, 2, 3 ],
			nullable: false
		}
	);

	simpleTest(
		joi.number().integer().valid(1, 2, 3, null),
		{
			type: 'integer',
			enum: [ 1, 2, 3 ],
			nullable: true
		}
	);

	simpleTest(
		joi.string(),
		{
			type: 'string',
		}
	);

	simpleTest(
		joi.string().label('test'),
		{
			type: 'string',
			title: 'test',
		}
	);

	simpleTest(
		joi.string().description('test'),
		{
			type: 'string',
			description: 'test',
		}
	);

	simpleTest(
		joi.string().regex(/^A$/),
		{
			type: 'string',
			pattern: '^A$',
		}
	);

	simpleTest(
		joi.string().pattern(new RegExp('^AB$')),
		{
			type: 'string',
			pattern: '^AB$',
		}
	);

	simpleTest(
		joi.string().min(4).max(9),
		{
			type: 'string',
			maxLength: 9,
			minLength: 4,
		}
	);

	simpleTest(
		joi.string().min(4).max(9).length(14),
		{
			type: 'string',
			maxLength: 14,
			minLength: 14,
		}
	);

	simpleTest(
		joi.string().max(9).length(14).min(4),
		{
			type: 'string',
			maxLength: 14,
			minLength: 4,
		}
	);

	simpleTest(
		joi.string().alphanum(),
		{
			type: 'string',
			pattern: '^[a-zA-Z0-9]*$',
		}
	);

	simpleTest(
		joi.string().strict().alphanum().lowercase(),
		{
			type: 'string',
			pattern: '^[a-z0-9]*$',
		}
	);

	simpleTest(
		// confirm that non-strict mode enables insensitive match
		joi.string().alphanum().uppercase(),
		{
			type: 'string',
			pattern: '^[a-zA-Z0-9]*$',
		}
	);

	simpleTest(
		joi.string().strict().alphanum().uppercase(),
		{
			type: 'string',
			pattern: '^[A-Z0-9]*$',
		}
	);

	simpleTest(
		joi.string().strict().alphanum().lowercase(),
		{
			type: 'string',
			pattern: '^[a-z0-9]*$',
		}
	);

	simpleTest(
		joi.string().alphanum().email(),
		{
			type: 'string',
			format: 'email',
		}
	);

	simpleTest(
		joi.string().alphanum().regex(/^$/).email(),
		{
			type: 'string',
			format: 'email',
		}
	);

	simpleTest(
		joi.string().alphanum().email().regex(/^$/),
		{
			type: 'string',
			format: 'email',
		}
	);

	simpleTest(
		joi.string().alphanum().isoDate(),
		{
			type: 'string',
			format: 'date-time',
		}
	);

	simpleTest(
		joi.string().alphanum().regex(/^$/).isoDate(),
		{
			type: 'string',
			format: 'date-time',
		}
	);

	simpleTest(
		joi.string().alphanum().isoDate().regex(/^$/),
		{
			type: 'string',
			format: 'date-time',
		}
	);

	simpleTest(
		joi.string().allow('A', 'B', 'C'),
		{
			type: 'string',
			enum: [ 'A', 'B', 'C' ],
			nullable: false
		}
	);

	simpleTest(
		joi.string().allow('A', 'B', 'C', null),
		{
			type: 'string',
			enum: [ 'A', 'B', 'C' ],
			nullable: true
		}
	);

	simpleTest(
		joi.string().valid('A', 'B', 'C'),
		{
			type: 'string',
			enum: [ 'A', 'B', 'C' ],
			nullable: false
		}
	);

	simpleTest(
		joi.string().valid('A', 'B', 'C', null),
		{
			type: 'string',
			enum: [ 'A', 'B', 'C' ],
			nullable: true
		}
	);

	simpleTest(
		joi.string().token(),
		{
			type: 'string',
			pattern: '^[a-zA-Z0-9_]*$',
		}
	);

	simpleTest(
		joi.string().token().lowercase(),
		{
			type: 'string',
			pattern: '^[a-z0-9_]*$',
		}
	);

	simpleTest(
		joi.string().token().uppercase(),
		{
			type: 'string',
			pattern: '^[A-Z0-9_]*$',
		}
	);

	simpleTest(
		joi.boolean(),
		{
			type: 'boolean',
		}
	);

	simpleTest(
		joi.boolean().allow(null),
		{
			type: 'boolean',
			nullable: true,
		}
	);

	simpleTest(
		joi.binary(),
		{
			type: 'string',
			format: 'binary',
		}
	);

	simpleTest(
		joi.binary().encoding('base64'),
		{
			type: 'string',
			format: 'byte',
		}
	);

	simpleTest(
		joi.binary().min(10).max(25),
		{
			type: 'string',
			format: 'binary',
			minLength: 10,
			maxLength: 25
		}
	);

	simpleTest(
		joi.binary().length(20),
		{
			type: 'string',
			format: 'binary',
			minLength: 20,
			maxLength: 20
		}
	);

	simpleTest(
		joi.array(),
		{
			type: 'array'
		}
	);

	simpleTest(
		joi.array().items(joi.boolean(), joi.date()),
		{
			type: 'array',
			items: { type: 'boolean' },
		}
	);

	simpleTest(
		joi.array().items(joi.string()).unique(),
		{
			type: 'array',
			uniqueItems: true,
			items: { type: 'string' },
		}
	);

	simpleTest(
		joi.array().items(joi.string(), joi.number()).meta({ swaggerIndex: 1 }).min(1).max(5),
		{
			type: 'array',
			items: { type: 'number', format: 'float' },
			minItems: 1,
			maxItems: 5,
		}
	);

	simpleTest(
		joi.array().items(joi.number()).length(10),
		{
			type: 'array',
			items: { type: 'number', format: 'float' },
			minItems: 10,
			maxItems: 10,
		}
	);

	simpleTest(
		joi.alternatives(joi.string(), joi.number()).meta({ swaggerIndex: 1 }),
		{ type: 'number', format: 'float' }
	);
/*
	simpleTest(
		joi.when('myRequiredField', {
			is: true,
			then: joi.string(),
			otherwise: joi.number(),
		}),
		{ type: 'string' }
	);

	simpleTest(
		joi.when('myRequiredField', {
			is: false,
			then: joi.string(),
			otherwise: joi.number(),
		}),
		{ type: 'number' }
	);

	simpleTest(
		joi.when('myRequiredField', {
			is: true,
			then: joi.string(),
			otherwise: joi.number(),
		}).meta({ swaggerIndex: 1 }),
		{ type: 'number', format: 'float' }
	);
*/
	simpleTest(
		joi.object({
			req: joi.string().required(),
			forbiddenAny: joi.forbidden(),
			forbiddenString: joi.string().forbidden(),
			forbiddenNumber: joi.number().forbidden(),
			forbiddenBoolean: joi.boolean().forbidden(),
			forbiddenBinary: joi.binary().forbidden()
		}),
		{ type: 'object', required: [ 'req' ], properties: { req: { type: 'string' } } }
	);

	simpleTest(
		joi.object({
			req: joi.string().required(),
			aString: joi.string(),
			aNumber: joi.number().integer(),
			aBoolean: joi.boolean(),
			aBinary: joi.binary()
		}),
		{ type: 'object', required: [ 'req' ], properties: { req: { type: 'string' }, aString: { type: 'string' }, aNumber: { type: 'integer' }, aBoolean: { type: 'boolean' }, aBinary: { type: 'string', format: 'binary' } } }
	);
/*
	simpleTest(
		joi.object({
			req: joi.string().required(),
			forbiddenAny: joi.forbidden(),
			forbiddenString: joi.string().forbidden(),
			forbiddenNumber: joi.number().forbidden(),
			forbiddenBoolean: joi.boolean().forbidden(),
			forbiddenBinary: joi.binary().forbidden(),
			maybeRequiredOrForbidden: joi.number().when('someField', {
				is: true,
				then: joi.required(),
				otherwise: joi.forbidden(),
			})
				.meta({ swaggerIndex: 1 }),
		}),
		{ type: 'object', required: [ 'req' ], properties: { req: { type: 'string' } } }
	);
*/
	simpleTest(
		joi.object().keys({
			id: joi.number().integer().required(),
			name: joi.string(),
		}),
		{
			type: 'object',
			required: [ 'id' ],
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' },
			},
		}
	);

	simpleTest(
		joi.object().keys({
			name: joi.string(),
			settings: joi.object(),
		}),
		{
			type: 'object',
			properties: {
				name: { type: 'string' },
				settings: { type: 'object', properties: {} },
			},
		}
	);

	simpleTest(
		joi.object().keys({
			value: joi.string().default('hello'),
		}).unknown(false),
		{
			type: 'object',
			properties: {
				value: { type: 'string', default: 'hello' },
			},
		}
	);

	simpleTest(
		joi.object().keys({
			value: joi.string().default('hello'),
		}).unknown(true),
		{
			type: 'object',
			additionalProperties: true,
			properties: {
				value: { type: 'string', default: 'hello' },
			},
		}
	);

	simpleTest(
		joi.string().alphanum().email().meta({ className: 'Email' }),
		{
			$ref: '#/components/schemas/Email',
		},
		{
			schemas: {
				Email: {
					type: 'string',
					format: 'email',
				},
			},
		}
	);

	simpleTest(
		joi.string().example('sii'),
		{
			example: 'sii',
			type: 'string',
		}
	);

	simpleTest(
		joi.string().example('sel').example('wyn'),
			{
				examples: [
					'sel',
					'wyn',
				],
				type: 'string',
			}
	);

	simpleTest(
		joi.object().example({a: 1}),
		{
			example: { a: 1 },
			properties: {},
			type: 'object',
		}
	);

	simpleTest(
		{
			start: joi.object().unknown(false).keys({
				lat:  joi.number().min(-90).max(90).required(),
				lon:  joi.number().min(-180).max(180).required(),
			}).meta({ className: 'GeoPoint' }),
			stop: joi.object().unknown(false).keys({
				lat:  joi.number().min(-90).max(90).required(),
				lon:  joi.number().min(-180).max(180).required(),
			}).meta({ className: 'GeoPoint' }),
		},
		{
			type: 'object',
			properties: {
				start: { $ref: '#/components/schemas/GeoPoint' },
				stop: { $ref: '#/components/schemas/GeoPoint' },
			},
		},
		{
			schemas: {
				GeoPoint: {
					type: 'object',
					required: [ 'lat', 'lon' ],
					properties: {
						lat: {
							type: 'number',
							format: 'float',
							minimum: -90,
							maximum: 90,
						},
						lon: {
							type: 'number',
							format: 'float',
							minimum: -180,
							maximum: 180,
						},
					},
				},
			},
		}
	);

	simpleTest(
		{
			body: joi.object().keys({
				subject: joi.string(),
				message: joi.string().trim().min(1, 'utf8').max(400, 'utf8').meta({ className: 'MessageBody' }),
			}).meta({ className: 'MessageCreate', classTarget: 'requestBodies' }),
		},
		{
			type: 'object',
			properties: {
				body: { '$ref': '#/components/requestBodies/MessageCreate' },
			},
		},
		{
			schemas: {
				'MessageBody': {
					maxLength: 400,
					minLength: 1,
					type: 'string',
				},
			},
			requestBodies: {
				'MessageCreate': {
					type: 'object',
					properties: {
						message: { '$ref': '#/components/schemas/MessageBody' },
						subject: { 'type': 'string' },
					},
				},
			},
		}
	);

	// recursive
	const Person = joi.object({
		firstName: joi.string().required(),
		lastName: joi.string().required(),
		children: joi.array().items(joi.link('#person')),
	}).id('person');

	simpleTest(
		Person,
		{
			type: 'object',
			required: [ 'firstName', 'lastName' ],
			properties: {
				firstName: { type: 'string' },
				lastName: { type: 'string' },
				children: {
					type: 'array',
					items: {},
				},
			},
		}
	);

	simpleTest(
		{
			id: joi.string()
				.when('version', { is: joi.number().greater(0).required(), then: joi.string().required() }),
		},
		{
			type: 'object',
			properties: {
				id: { type: 'string' },
			},
		}
	);

	simpleTest(
		{
			id: joi.string()
				.description('user id')
				.forbidden(),
		},
		{
			type: 'object',
			properties: {},
		}
	);

	simpleTest(
		joi.date().default(Date.now).description('current date'),
		{
			type: 'string',
			format: 'date-time',
			description: 'current date'
		}
	);
	// test files
	simpleTest(
		joi.any().meta({ swaggerType: 'file' }).description('simpleFile'),
		{
			description: 'simpleFile',
			in: 'formData',
			type: 'file',
		}
	);
});
