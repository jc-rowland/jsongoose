import path from 'path';
import fs from 'fs';
import { readFile } from 'fs/promises';

interface Chunk {
  data: Buffer;
  bytesRead: number;
}
type BytePosition = number
type ByteLength = number

type JSONDBMeta_Item = [BytePosition,ByteLength]

type JSONDBMeta_File = {
  length:number
  items:JSONDBMeta_Item[]
}

class JSONDBMeta {
  private metaPath:string
  public length:number
  public items:JSONDBMeta_Item[]

  constructor(metaPath:string){
    this.metaPath = metaPath;
    const meta    = JSON.parse(fs.readFileSync(metaPath).toString()) as JSONDBMeta_File
    this.length   = meta.length
    this.items    = meta.items
  }
  
  write(){
    return fs.writeFileSync(this.metaPath,JSON.stringify(this))
  }

  update(i:number,newByteSize:number){
    const item = this.items[i]
    const oldByteSize = item[1];
    const byteDelta = newByteSize - oldByteSize
    this.items[i][1] = newByteSize

    for (let x = i+1; x < this.items.length; x++) {
      //cascade byte position to the remaining items
      this.items[x][0] = this.items[x][0]+byteDelta
    }
    this.write()
  }

  delete(i:number){
    const item                   = this.items[i]
    const oldByteSize            = item[1];
    const bytePositionAtDeletion = item[0];
    this.items.splice(i, 1);

    let currentBytePosition = bytePositionAtDeletion
    let nextBytePosition = bytePositionAtDeletion;
    for (let x = i; x < this.items.length; x++) {
      currentBytePosition = nextBytePosition
      nextBytePosition = this.items[x][0]
      //cascade byte position to the remaining items
      this.items[x][0] = currentBytePosition
    }
    this.write()
  }
}

export default class JSONDriver {
  private fileDir:string
  private filePath:string
  private metaPath:string
  private meta:JSONDBMeta

  constructor(fileDir:string,filename:string){
    let normalizedFilename = filename.replace('.json','')
    this.fileDir  = fileDir
    this.filePath = path.resolve(this.fileDir,normalizedFilename+'.jsondb')
    this.metaPath = path.resolve(this.fileDir,normalizedFilename+'.jsondb.meta')
    this.meta     = new JSONDBMeta(this.metaPath)
  }

  private read(bytePosition: number, byteLength: number): Chunk | null {
  
    const maxBytesToRead = byteLength
    const buffer = Buffer.alloc(maxBytesToRead);
  
    const fileDescriptor = fs.openSync(this.filePath, 'r');
    fs.readSync(fileDescriptor, buffer, 0, maxBytesToRead, bytePosition);
    fs.closeSync(fileDescriptor);
    console.log('Buffer output', buffer.toString())
    return JSON.parse(buffer.toString());
  }
  private delete(bytePosition: number, byteLength: number) {
    const fileStats = fs.statSync(this.filePath);
    const fileSize = fileStats.size;
  
    if (bytePosition >= fileSize) {
      console.error('Byte position exceeds file size.');
      return;
    }
  
    const maxBytesToRemove = byteLength
  
    const fileDescriptor = fs.openSync(this.filePath, 'r+');
    const buffer = Buffer.alloc(maxBytesToRemove);
  
    const bytesRead = fs.readSync(fileDescriptor, buffer, 0, maxBytesToRemove, bytePosition);
  
    // Shift remaining bytes to replace the removed portion
    const shiftPosition = bytePosition + bytesRead;
    const shiftLength = fileSize - shiftPosition;
    const shiftBuffer = Buffer.alloc(shiftLength);
  
    fs.readSync(fileDescriptor, shiftBuffer, 0, shiftLength, shiftPosition);
    fs.writeSync(fileDescriptor, shiftBuffer, 0, shiftLength, bytePosition);
  
    // Truncate the file to remove the remaining bytes
    fs.ftruncateSync(fileDescriptor, fileSize - bytesRead);
  
    fs.closeSync(fileDescriptor);
  }

  getIndex(i:number){
    const item = this.meta.items[i]
    if(!item){return undefined}
    const [bytePosition,byteLength] = item
    return this.read(bytePosition,byteLength)
  }
  deleteIndex(i:number){
    const item = this.meta.items[i]
    const isLastItem = i===this.meta.length-1
    if(!item){return undefined}
    const [bytePosition,byteLength] = item
    this.delete(bytePosition,byteLength+(isLastItem?0:1))
    this.meta.delete(i)
  }


}