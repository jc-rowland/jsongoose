import path from "path";
import fs from "fs";
import FileManager from "./filemanager";
import MetaProxy from "./metaproxy";

export default class JSONDriver<T> {
  [index: number]: MetaProxy<T>;
  private metaPath: string;
  public file: FileManager;
  public items: MetaProxy<T>[];

  constructor(fileDir: string, filename: string) {
    
    let normalizedFilename = filename.replace(".json", "");

    const filePath = path.resolve(fileDir, normalizedFilename + ".jsondb");
    this.file = new FileManager(filePath);

    this.metaPath = path.resolve(fileDir, normalizedFilename + ".jsondb.meta");
    const meta = this.loadMeta();
    process.on("exit", () => this.saveMeta());

    this.items = meta.items.map((byteLength:number,i:number)=>{
      return new MetaProxy<T>(byteLength, i,this)
    })
  }

  async init(){
    await this.file.init()
  }

  private loadMeta() {
    return JSON.parse(fs.readFileSync(this.metaPath).toString());
  }

  private saveMeta() {
    return fs.writeFileSync(
      this.metaPath,
      JSON.stringify({
        metaPath: this.metaPath,
        items: this.items.map((x)=>x.byteLength),
      })
    );
  }

  readMany() {}

  async push(item:any) {
    const newItem = JSON.stringify(item);
    const byteLength = Buffer.byteLength(newItem);
    const bytePosition =
      this.items.length > 0
        ? this.items[this.items.length - 1].bytePosition + this.items[this.items.length - 1].byteLength
        : 1;

    const fileDescriptor = this.file.fileHandler as number;

    // bytePosition is subtracted by 1 to account for the extra comma
    this.file.write(fileDescriptor, `,${newItem}]`, 0, bytePosition);
    
    return this.items.push(new MetaProxy(
      byteLength,
      this.items.length,
      this
    ))
  }

  async update(i: number, updateValue: T) {
    const item = this.items[i];
    const { bytePosition, byteLength } = item;

    const newDataLength = await this.file.insert(
      JSON.stringify(updateValue),
      bytePosition,
      byteLength
    ) as number;

    this.items[i].byteLength = newDataLength

    
    return updateValue
  }

  async delete(i: number) {
    const item = this.items[i];
    const isLastItem = i === this.items.length - 1;
    const isFirstItem = i===0;
    const isOnlyItem = isLastItem && isFirstItem

    if (!item) {
      return undefined;
    }
    
    await this.file.delete(
      item.bytePosition + (isOnlyItem?0:isFirstItem?0:-1),
      item.byteLength + ((isOnlyItem?0:isLastItem ? 0 : 1))
    );

    this.items.splice(i,1)
    for (let x = 0; x < this.items.length; x++) {
      this.items[x].index--;
    }
  }
}
