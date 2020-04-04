import { Validator } from 'jsonschema';
import { Component, Maybe } from 'bind';
import { JSON_VALIDATOR } from '../lib/consts/appcomponents';
import SchemaValidationError from '../lib/errors/schemavalidationerror';

@Component(JSON_VALIDATOR)
export default class JsonSchemaValidator {
  private validator;

  constructor() {
    this.validator = new Validator();
  }

  validate(body: Object, schema: Object, errorMessage: string = ''): Maybe<Error> {
    const res = this.validator.validate(body, schema, { propertyName: 'Object' });
    if (!res.valid) {
      return new SchemaValidationError([errorMessage, res.toString()].join('\n'));
    }

    return undefined;
  }
}
