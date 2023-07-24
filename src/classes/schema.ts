import {ModelSchema} from './model';

export type SchemaOption = {
  type: new (...args: any[]) => any;
  required?: boolean;
  default?: any;
};

export default class Schema<T extends ModelSchema> {
  constructor(public schema: T) {}
}