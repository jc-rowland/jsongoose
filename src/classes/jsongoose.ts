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
        Object.assign(this, data);
        
      }

      static async insertMany(x:InstanceData<T>[]) {
        return this.#driver.pushMany(x)
        // Implement your method here
      }
    }

    return SpecificModel
  }

  get Schema() {
    return Schema;
  }
}

const jsongoose = new Jsongoose();

const schema = new jsongoose.Schema({ name: String, size: String });
const Tank = jsongoose.model("Tank", schema);
Tank.insertMany([{
  name:'hello',
  size:'adasd'
}])