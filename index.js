'use strict';

var joi = require('@hapi/joi');
var { find, get, set, merge } = require('lodash');

var patterns = {
	alphanum: '^[a-zA-Z0-9]*$',
	alphanumLower: '^[a-z0-9]*$',
	alphanumUpper: '^[A-Z0-9]*$',
	token: '^[a-zA-Z0-9_]*$',
	tokenLower: '^[a-z0-9_]*$',
	tokenUpper: '^[A-Z0-9_]*$'
};

var isJoi = function (joiObj) {
	return !!((joiObj && joi.isSchema(joiObj)));
};

var hasJoiMeta = function (joiObj) {
	return !!((isJoi(joiObj) && Array.isArray(joiObj['$_terms'].metas)));
};

var getJoiMetaProperty = function (joiObj, propertyName) {

	// get headers added using meta function
	if (isJoi(joiObj) && hasJoiMeta(joiObj)) {

		var joiMeta = joiObj['$_terms'].metas;
		let i = joiMeta.length;
		while (i--) {
			if (joiMeta[i][propertyName]) {
				return joiMeta[i][propertyName];
			}
		}
	}
	return undefined;
};

module.exports = exports = function parse (schema, existingComponents) {
	// inspect(schema);

	if (!schema) throw new Error('No schema was passed.');

	if (typeof schema === 'object' && !joi.isSchema(schema)) {
		schema = joi.object().keys(schema);
	}

	if (!joi.isSchema(schema)) throw new TypeError('Passed schema does not appear to be a joi schema.');

	var override = meta(schema, 'swagger');
	if (override && meta(schema, 'swaggerOverride')) {
		return { swagger: override, components: {} };
	}

	var metaDefName = meta(schema, 'className');
	var metaDefType = meta(schema, 'classTarget') || 'schemas';

	// if the schema has a definition class name, and that
	// definition is already defined, just use that definition
	if (metaDefName && get(existingComponents, [ metaDefType, metaDefName ])) {
		return { swagger: refDef(metaDefType, metaDefName) };
	}

	if (get(schema, '_flags.presence') === 'forbidden') {
		return false;
	}

	var swagger;
	var components = {};

	if (parseAsType[schema.type]) {
		swagger = parseAsType[schema.type](schema, existingComponents, components);
	} else {
		throw new TypeError(`${schema.type} is not a recognized Joi type.`);
	}

	if (!swagger) return { swagger, components };

//	if (schema._valids && schema._valids['_values'] && schema._valids['_values'].has(null)) {
//		swagger.nullable = true;
//	}

	var description = get(schema, '_flags.description');
	if (description) {
		swagger.description = description;
	}

	if (schema['$_terms'].examples && schema['$_terms'].examples.length) {
		if (schema['$_terms'].examples.length === 1) {
			swagger.example = extractExampleValue(schema['$_terms'].examples[0]);
		} else {
			swagger.examples = schema['$_terms'].examples.map(extractExampleValue);
		}
	}

	var label = get(schema, '_flags.label');
	if (label) {
		swagger.title = label;
	}

	var defaultValue = get(schema, '_flags.default');
	if (defaultValue && typeof defaultValue !== 'function') {
		swagger.default = defaultValue;
	}

	if (metaDefName) {
		set(components, [ metaDefType, metaDefName ], swagger);
		return { swagger: refDef(metaDefType, metaDefName), components };
	}

	if (override) {
		Object.assign(swagger, override);
	}

	return { swagger, components };
};

var parseAsType = {
	number: (schema) => {
		var swagger = {};

		if (find(schema._rules, { name: 'integer' })) {
			swagger.type = 'integer';
		} else {
			swagger.type = 'number';
			if (find(schema._rules, { name: 'precision' })) {
				swagger.format = 'double';
			} else {
				swagger.format = 'float';
			}
		}

		var sign = find(schema._rules, { name: 'sign' })
		if (sign) {
			if (sign.args['sign'] === 'positive') {
				swagger.minimum = 1;
			}

			if (sign.args['sign'] === 'negative') {
				swagger.maximum = -1;
			}
		}

		var min = find(schema._rules, { name: 'min' });
		if (min) {
			swagger.minimum = min.args['limit'];
		}

		var max = find(schema._rules, { name: 'max' });
		if (max) {
			swagger.maximum = max.args['limit'];
		}

		if (schema._valids && schema._valids['_values']) {
			var valids = Array.from(schema._valids['_values']).filter((s) => typeof s === 'number');
			if (valids.length > 0) {
		    swagger.enum = valids;
      }
		}

		return swagger;
	},
	string: (schema) => {
		var swagger = { type: 'string' };
		var strict = schema['_preferences'] !== null && schema['_preferences']['convert'] === false;

		var pattern = find(schema._rules, { name: 'pattern' });
		if (pattern) {
			swagger.pattern = pattern.args.regex.toString().slice(1, -1);
		}

		if (find(schema._rules, { name: 'alphanum' })) {
			var caseType = find(schema._rules, { name: 'case' })
			if (strict && caseType && caseType.args['direction'] === 'lower') {
				swagger.pattern = patterns.alphanumLower;
			} else if (strict && caseType && caseType.args['direction'] === 'upper') {
				swagger.pattern = patterns.alphanumUpper;
			} else {
				swagger.pattern = patterns.alphanum;
			}
		}

		if (find(schema._rules, { name: 'token' })) {
			var caseType = find(schema._rules, { name: 'case' })
			if (caseType && caseType.args['direction'] === 'lower') {
				swagger.pattern = patterns.tokenLower;
			} else if (caseType && caseType.args['direction'] === 'upper') {
				swagger.pattern = patterns.tokenUpper;
			} else {
				swagger.pattern = patterns.token;
			}
		}

		if (find(schema._rules, { name: 'email' })) {
			swagger.format = 'email';
			delete swagger.pattern;
		}

		if (find(schema._rules, { name: 'isoDate' })) {
			swagger.format = 'date-time';
			delete swagger.pattern;
		}

		for (let i = 0; i < schema._rules.length; i++) {
			const test = schema._rules[i];
			if (test.name === 'min') {
				swagger.minLength = test.args['limit'];
			}

			if (test.name === 'max') {
				swagger.maxLength = test.args['limit'];
			}

			if (test.name === 'length') {
				swagger.minLength = test.args['limit'];
				swagger.maxLength = test.args['limit'];
			}
		}

		if (schema._valids && schema._valids['_values']) {
			var valids = Array.from(schema._valids['_values']).filter((s) => typeof s === 'string');
      if (valids.length > 0) {
        swagger.enum = valids;
      }
		}

		return swagger;
	},
	binary: (schema) => {
		var swagger = { type: 'string', format: 'binary' };

		if (get(schema, '_flags.encoding') === 'base64') {
			swagger.format = 'byte';
		}

		for (let i = 0; i < schema._rules.length; i++) {
			const test = schema._rules[i];
			if (test.name === 'min') {
				swagger.minLength = test.args['limit'];
			}

			if (test.name === 'max') {
				swagger.maxLength = test.args['limit'];
			}

			if (test.name === 'length') {
				swagger.minLength = test.args['limit'];
				swagger.maxLength = test.args['limit'];
			}
		}

		return swagger;
	},
	date: (/* schema */) => ({ type: 'string', format: 'date-time' }),
	boolean: (/* schema */) => ({ type: 'boolean' }),
	alternatives: (schema, existingComponents, newComponentsByRef) => {
		var index = meta(schema, 'swaggerIndex') || 0;

		var matches = get(schema, [ '$_terms', 'matches']);
		var firstItem = get(matches, [ 0 ]);

		var itemsSchema;
		if (firstItem.ref) {
			if (schema._baseType && !firstItem.otherwise) {
				itemsSchema = index ? firstItem.then : schema._baseType;
			} else {
				itemsSchema = index ? firstItem.otherwise : firstItem.then;
			}
		} else if (index) {
			itemsSchema = get(matches, [ index, 'schema' ]);
		} else {
			itemsSchema = firstItem.schema;
		}

		if (!itemsSchema) {
			return;
		}

		var items = exports(itemsSchema, Object.assign({}, existingComponents || {}, newComponentsByRef || {}));

		if (get(itemsSchema, '_flags.presence') === 'required') {
			items.swagger.__required = true;
		}

		merge(newComponentsByRef, items.components || {});

		return items.swagger;
	},
	array: (schema, existingComponents, newComponentsByRef) => {
		var index = meta(schema, 'swaggerIndex') || 0;
		var itemsSchema = get(schema, [ '$_terms', 'items', index ]);

		if (!itemsSchema) {
			return { type: 'array' };
		}

		var items = exports(itemsSchema, merge({}, existingComponents || {}, newComponentsByRef || {}));

		merge(newComponentsByRef, items.components || {});

		var swagger = { type: 'array' };

		for (let i = 0; i < schema._rules.length; i++) {
			const test = schema._rules[i];
			if (test.name === 'min') {
				swagger.minItems = test.args['limit'];
			}

			if (test.name === 'max') {
				swagger.maxItems = test.args['limit'];
			}

			if (test.name === 'length') {
				swagger.minItems = test.args['limit'];
				swagger.maxItems = test.args['limit'];
			}
		}

		var unique = find(schema._rules, { name: 'unique' })
		if (unique) {
			swagger.uniqueItems = true;
		}

		swagger.items = items.swagger;
		return swagger;
	},
	object: (schema, existingComponents, newComponentsByRef) => {

		var requireds = [];
		var properties = {};

		var combinedComponents = merge({}, existingComponents || {}, newComponentsByRef || {});

		var children = get(schema, [ '$_terms', 'keys']) || [];
		children.forEach((child) => {
			var key = child.key;
			if (!child.schema) return;
			var prop = exports(child.schema, combinedComponents);
			if (!prop.swagger) { // swagger is falsy if joi.forbidden()
				return;
			}

			merge(newComponentsByRef, prop.components || {});
			merge(combinedComponents, prop.components || {});

			properties[key] = prop.swagger;

			if (get(child, 'schema._flags.presence') === 'required' || prop.swagger.__required) {
				requireds.push(key);
				delete prop.swagger.__required;
			}
		});

		var swagger = { type: 'object' };
		if (requireds.length) {
			swagger.required = requireds;
		}
		swagger.properties = properties;

		var unknown = get(schema, '_flags')
		if (unknown && unknown['unknown'] !== null && typeof unknown['unknown'] === 'boolean') {
			swagger.additionalProperties = unknown['unknown'] === true;
		}

		return swagger;
	},
	any: (schema, existingDefinitions, newDefinitionsByRef) => {
		var swagger = {};
		for (let i = 0; i < schema._rules.length; i++) {
			const test = schema._rules[i];
			if (test.name === 'min') {
				swagger.minLength = test.args['limit'];
			}

			if (test.name === 'max') {
				swagger.maxLength = test.args['limit'];
			}

			if (test.name === 'length') {
				swagger.minLength = test.args['limit'];
				swagger.maxLength = test.args['limit'];
			}
		}

		if (schema._valids && schema._valids['_values']) {
			var valids = Array.from(schema._valids['_values']);
				if (valids.length > 0) {
					swagger.oneOf = valids.map(
					(itemsSchema) =>
					exports(itemsSchema, Object.assign({}, existingDefinitions || {}, newDefinitionsByRef || {})).swagger
				);
			}
		}

		if (schema._refs && schema._refs['refs'] && schema['$_terms'].whens) {
			var valids = schema['$_terms'].whens;

				if (valids.length > 0) {
					swagger.oneOf = valids.map(
					(itemsSchema) => {
					return exports(itemsSchema.ref, Object.assign({}, existingDefinitions || {}, newDefinitionsByRef || {})).swagger
				});
			}
		}

		// convert property to file upload, if indicated by meta property
		if (getJoiMetaProperty(schema, 'swaggerType') === 'file') {
			swagger.type = 'file';
			swagger.in = 'formData';
		}

		if (!swagger.type){
			swagger.type = 'string';
		}

		var description = get(schema, '_flags.description');
		if (description) {
			swagger.description = description;
		}

		return swagger;
	},
	link: (schema, existingDefinitions, newDefinitionsByRef) => {
		/*var fn = get(schema, '_flags.lazy');
		if (fn && !schema.lazied) {
			schema.lazied = true;
			var newSchema = fn();
			var parsed = parseAsType[newSchema.type](newSchema, existingDefinitions, newDefinitionsByRef);
			return parsed;
		}*/
		return {};
	},
};

function meta (schema, key) {
	var flattened = Object.assign.apply(null, [ {} ].concat(schema['$_terms'].metas));

	return get(flattened, key);
}

function refDef (type, name) {
	return { $ref: '#/components/' + type + '/' + name };
}

function extractExampleValue (example) {
	return typeof example.value === 'undefined' ? example : example.value;
}
