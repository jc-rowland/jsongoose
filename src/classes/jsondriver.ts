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

    // TODO: Add createIfMissing to config options
    const meta = this.loadMeta(true);
    process.on("exit", () => this.saveMeta());

    this.items = meta.items.map((byteLength:number,i:number)=>{
      return new MetaProxy<T>(byteLength, i,this)
    })
  }

  private loadMeta(createIfMissing:boolean=false) {
    try {
      return JSON.parse(fs.readFileSync(this.metaPath).toString());
    } catch (error) {
      if(createIfMissing){
        this.saveMeta()
        return this.loadMeta(false)
      }
      throw new Error(`Metadata Path [${this.metaPath}] Not Found`)
    }
  }

  private saveMeta() {
    return fs.writeFileSync(
      this.metaPath,
      JSON.stringify({
        metaPath: this.metaPath,
        items: this.items?this.items.map((x)=>x.byteLength):[]
      })
    );
  }

  readMany() {}

  async push(item:any) {
    const newItem = JSON.stringify(item);
    const byteLength = Buffer.byteLength(newItem);
    const itemIndex = this.items.length - 1
    const bytePosition =
      this.items.length > 0
        ? this.items[itemIndex].bytePosition + this.items[itemIndex].byteLength
        : 1;

    // bytePosition is subtracted by 1 to account for the extra comma
    await this.file.write(`,${newItem}]`, 0, bytePosition);
    
    return this.items.push(new MetaProxy(
      byteLength,
      this.items.length,
      this
    ))
  }

  async pushMany(items:any[]) {
    
    return new Promise((resolve,reject)=>{

      // Creating a write stream.
      const writeStream = fs.createWriteStream(this.file.filePath, {
        flags: 'r+', // open the file for reading and writing
        start: this.items.length > 0
                ? this.items[this.items.length - 1].bytePosition + this.items[this.items.length - 1].byteLength
                : 1 // setting the start position
      });

      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
    
      for (let i = 0; i < items.length; i++) {
        const newItem = JSON.stringify(items[i]);
        const byteLength = Buffer.byteLength(newItem);
        
    
        // Writing to the stream
        writeStream.write(`,${newItem}`);
    
        this.items.push(new MetaProxy(
          byteLength,
          this.items.length,
          this
        ));
      }
      
      // Make sure to end the stream when you're done writing
      writeStream.end("]");
    })

  
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
