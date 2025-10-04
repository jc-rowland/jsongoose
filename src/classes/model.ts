import { SchemaOption } from "./schema";
import JSONDriver from './jsondriver'
export type Indexable<T> = T & { [key: string]: any };
export type ModelSchema = Record<string, SchemaOption | Function>;

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { required: true } ? never : K;
}[keyof T];

export type InstanceData<T extends ModelSchema> = {
  [K in RequiredKeys<T>]: T[K] extends { type: infer U; required: boolean }
    ? U extends new (...args: any[]) => infer V
      ? V
      : never
    : T[K] extends new (...args: any[]) => infer W
    ? W
    : never;
} &
  {
    [K in OptionalKeys<T>]?: T[K] extends { type: infer U; required?: boolean }
      ? U extends new (...args: any[]) => infer V
        ? V
        : never
      : T[K] extends new (...args: any[]) => infer W
      ? W
      : never;
  };

  export default class Model<T extends ModelSchema> {
  
    constructor(public schema: T, public data: InstanceData<T>) {
      
      // Validate and assign each key from schema
      for (let key in schema) {
        const schemaOption = schema[key as keyof T];
        let value = (data as any)[key as keyof T];
  
        // If the value is an object (SchemaOption)
        if (typeof schemaOption === "object" && schemaOption !== null) {
          schemaOption as SchemaOption;

          if(value === undefined && schemaOption.default !== undefined){
            value = typeof schemaOption.default === 'function'?schemaOption.default():schemaOption.default
          }
  
          if (schemaOption.required && value === undefined) {
            throw new Error(`Property ${key} is required.`);
          }
  
          if (value !== undefined && !(value instanceof schemaOption.type)) {
            throw new Error(`Property ${key} must be an instance of ${schemaOption.type.name}.`);
          }

          if (value !== undefined && !(value instanceof schemaOption.type)) {
            throw new Error(`Property ${key} must be an instance of ${schemaOption.type.name}.`);
          }
        }
  
        // If the value is a function (constructor for basic type)
        else if (typeof schemaOption === "function") {
          if (value !== undefined && !(value instanceof schemaOption)) {
            throw new Error(`Property ${key} must be an instance of ${schemaOption.name}.`);
          }
        }
      }
  
      // Assign validated data to this
      Object.assign(this, data);
    }
    
  }
