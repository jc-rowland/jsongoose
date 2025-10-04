import fs from "fs";
import { promises as fsPromises, Stats } from 'fs';

type BytePosition = number;
type ByteLength = number;

export default class FileManager {
  static FILE_TIMEOUT = 5000;
  filePath: string;
  private queueProcessingTimeout: NodeJS.Timeout | null;
  private fd:number;
  constructor(filePath: string) {
    this.filePath = filePath;
    this.queueProcessingTimeout = null;
    this.fd = 0;
    process.on("exit", this.cleanup);
  }

  private get fileHandler(){
    if(this.queueProcessingTimeout){
      clearTimeout(this.queueProcessingTimeout)
      this.queueProcessingTimeout = null;
    }
      this.queueProcessingTimeout = setTimeout(
        this.cleanup,FileManager.FILE_TIMEOUT
      )
    if(this.fd===0){
      this.fd = fs.openSync(this.filePath, "r+")
    }
    return this.fd
  }

  private get stats() {
    return fs.fstatSync(this.fileHandler);
  }

  async cleanup() {
    process.removeListener('exit',this.cleanup)
    if(this.fd!==0){
      fs.closeSync(this.fileHandler);
      this.fd = 0
    }
    // Close the file when the process is about to exit
    if (this.queueProcessingTimeout) {
      clearTimeout(this.queueProcessingTimeout)
      this.queueProcessingTimeout = null;
    }
  }
  
  async read(bytePosition: number, byteLength: number) {
    const buffer = Buffer.alloc(byteLength);
    fs.readSync(this.fileHandler, buffer, 0, byteLength, bytePosition);
    return JSON.parse(buffer.toString());
  }

  async insert(
    data: string,
    bytePosition: BytePosition,
    byteLength: ByteLength
  ) {
    const newDataLength = Buffer.byteLength(data);
    const fileSize = this.stats.size;
  
    // Check if the bytePosition is within the file's range
    if (bytePosition > fileSize) {
      console.error("Byte position exceeds file size.");
      return;
    }
  
    // Calculate the length of data to be shifted
    const shiftAmount = newDataLength - byteLength;
  
    // Read the data after the insertion point that will be shifted
    const shiftDataLength = fileSize - bytePosition - byteLength;
    const shiftDataBuffer = Buffer.alloc(shiftDataLength);
    fs.readSync(this.fileHandler, shiftDataBuffer, 0, shiftDataLength, bytePosition + byteLength);
  
    // Write the new data at the insertion point
    const dataBuffer = Buffer.from(data);
    fs.writeSync(this.fileHandler, dataBuffer, 0, newDataLength, bytePosition);
  
    // Write the shifted data after the new data
    fs.writeSync(this.fileHandler, shiftDataBuffer, 0, shiftDataLength, bytePosition + newDataLength);
  
    // If data is shorter than byteLength, truncate the file to remove the remaining bytes
  if (shiftAmount < 0) {
    fs.ftruncateSync(this.fileHandler, fileSize + shiftAmount);
  }
    return newDataLength;
  }

  async write(
    data: string,
    offset?: number | null | undefined,
    position?: number | null | undefined
  ) {
    const dataBuffer = Buffer.from(data);
    return fs.writeSync(
      this.fileHandler,
      dataBuffer,
      offset,
      dataBuffer.byteLength,
      position
    );
  }

  async delete(
    bytePosition: BytePosition,
    byteLength: ByteLength
  ) {
    const fileSize = this.stats.size;
  
  
    // Calculate the actual number of bytes to delete
    const bytesToDelete = Math.min(byteLength, fileSize - bytePosition);
  
    // Calculate the number of bytes to shift (remaining bytes after the deletion range)
    const bytesToShift = fileSize - bytePosition - bytesToDelete;
  
    if (bytesToShift > 0) {
      // Create a buffer to hold the data that will be shifted
      const shiftBuffer = Buffer.alloc(bytesToShift);
  
      // Read the data after the deletion range
      fs.readSync(this.fileHandler, shiftBuffer, 0, bytesToShift, bytePosition + bytesToDelete);
  
      // Write the shifted data to its new position
      fs.writeSync(this.fileHandler, shiftBuffer, 0, bytesToShift, bytePosition);
    }
  
    // Truncate the file to remove the deleted portion and the shifted data
    fs.ftruncateSync(this.fileHandler, fileSize - bytesToDelete);
    return bytesToShift
  }
}
