import path from "path";
import fs from "fs";
import FileManager from "./filemanager";
import MetaProxy from "./metaproxy";

export default class JSONDriver<T> {
  [index: number]: MetaProxy<T>;
  private metaPath: string;
  public length: number;
  public file: FileManager;

  constructor(fileDir: string, filename: string) {
    let normalizedFilename = filename.replace(".json", "");
    this.length = 0;

    const filePath = path.resolve(fileDir, normalizedFilename + ".jsondb");
    this.file = new FileManager(filePath);

    this.metaPath = path.resolve(fileDir, normalizedFilename + ".jsondb.meta");
    const meta = this.loadMeta();
    process.on("exit", () => this.saveMeta());

    for (let index = 0; index < meta.items.length; index++) {
      this[index] = new MetaProxy<T>(meta.items[index], this, index);
      this.length++;
    }
  }

  async init(){
    await this.file.init()
  }

  get items() {
    let items = [];
    for (let index = 0; index < this.length; index++) {
      items.push([this[index].bytePosition, this[index].byteLength]);
    }
    return items;
  }

  private loadMeta() {
    return JSON.parse(fs.readFileSync(this.metaPath).toString());
  }

  private saveMeta() {
    return fs.writeFileSync(
      this.metaPath,
      JSON.stringify({
        metaPath: this.metaPath,
        items: this.items,
      })
    );
  }

  readMany() {}

  async push(item: any) {
    const newItem = JSON.stringify(item);
    const byteLength = Buffer.byteLength(newItem);
    const bytePosition =
      this.length > 0
        ? this[this.length - 1].bytePosition + this[this.length - 1].byteLength
        : 1;

    const fileDescriptor = this.file.fileHandler as number;

    // bytePosition is subtracted by 1 to account for the extra comma
    this.file.write(fileDescriptor, `,${newItem}]`, 0, bytePosition - 1);

    this[this.length] = new MetaProxy(
      [bytePosition, byteLength],
      this,
      this.length
    );
    this.length++;
    return this.length;
  }

  async update(i: number, updateValue: T) {
    const item = this[i];
    const { bytePosition, byteLength } = item;

    const newDataLength = await this.file.insert(
      JSON.stringify(updateValue),
      bytePosition,
      byteLength
    ) as number;

    const byteDelta = newDataLength - byteLength;
    console.log('newDataLength',newDataLength)
    this[i].byteLength = newDataLength
    console.log('byteDelta',byteDelta)
    for (let x = i+1; x < this.length; x++) {
      //cascade byte position to the remaining items
      console.log('this[x].bytePosition',this[x].bytePosition)
      this[x].bytePosition += byteDelta;
      console.log(this.items)
      console.log('this[x].bytePosition += byteDelta',this[x].bytePosition)
    }

    
    return updateValue
  }

  async delete(i: number) {
    const item = this[i];
    const isLastItem = i === this.length - 1;
    if (!item) {
      return undefined;
    }
    this.file.delete(
      item.bytePosition,
      item.byteLength + (isLastItem ? 0 : 1)
    );
    const bytePositionAtDeletion = item.bytePosition;

    this.items.splice(i, 1);
    const byteDelta = 0 - item.byteLength;

    for (let x = i; x < this.length; x++) {
      //cascade byte position to the remaining items
      this[x].byteLength = this[x].byteLength + byteDelta;
    }
  }
}
