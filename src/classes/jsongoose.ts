import path from "node:path";
import Schema from "./schema";
import Model, { ModelSchema } from "./model";
import { InstanceData, Indexable } from "./model";
import JSONDriver from "./jsondriver";

interface ConnectOptions {
  /** Location of the database */
  dirName: string;
  /** Name of the database */
  db: string;
}

export default class Jsongoose {
  private databasePath: string = "";

  connect(ops: ConnectOptions) {
    this.databasePath = path.resolve(ops.dirName);
    console.log("Connected to", this.databasePath)
  }

  model<T extends ModelSchema>(
    modelName: string,
    schema: Schema<T> | T
  ){
    let s = schema instanceof Schema ? schema : new Schema<T>(schema);
    const dbPath = this.databasePath

    class SpecificModel extends Model<T> {

      static #driver:JSONDriver<T> = new JSONDriver<T>(dbPath,modelName)

      constructor(data: InstanceData<T>) {
        super(s.schema, data);        
      }

      static async insertMany(x:InstanceData<T>[]) {
        return this.#driver.pushMany(x)
      }
    }

    return SpecificModel
  }

  get Schema() {
    return Schema;
  }
}