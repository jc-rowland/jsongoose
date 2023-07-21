import fs from "fs";
import { promises as fsPromises, Stats } from 'fs';

type BytePosition = number;
type ByteLength = number;

export default class FileManager {
  filePath: string;
  fileHandler: number;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileHandler = 0;
  }
  async init() {
    this.fileHandler = fs.openSync(this.filePath, "r+");
    process.on("exit", () => this.cleanup());
  }

  public get stats() {
    return fs.fstatSync(this.fileHandler);
  }

  async cleanup() {
    // Close the file when the process is about to exit
    if (this.fileHandler !== null) {
      fs.closeSync(this.fileHandler);
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
    fd: number,
    data: string,
    offset?: number | null | undefined,
    position?: number | null | undefined
  ) {
    const dataBuffer = Buffer.from(data);
    return fs.writeSync(
      fd,
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
