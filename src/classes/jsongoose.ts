import {FastJson} from 'fast-json'
import path from 'node:path'; 

interface ConnectOptions {
  /** Location of the database */
  dirName:String
  /** Name of the database */
  db:String
}

export default class Jsongoose {
  
  connect(ops:ConnectOptions){

  }
}