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
    const maxBytesToRead = byteLength;
    const buffer = Buffer.alloc(maxBytesToRead);

    fs.readSync(this.fileHandler, buffer, 0, maxBytesToRead, bytePosition);
    console.log("Buffer output: ", buffer.toString());
    return JSON.parse(buffer.toString());
  }

  async insert(
    data: string,
    bytePosition: BytePosition,
    byteLength: ByteLength
  ) {
    const newDataLength = Buffer.byteLength(data);
    const stats = fs.fstatSync(this.fileHandler);
    const fileSize = stats.size;
    // Shift the data if necessary
    if (newDataLength !== byteLength) {
      const shiftAmount = newDataLength - byteLength;

      if (shiftAmount > 0) {
        const tempBuffer = Buffer.allocUnsafe(shiftAmount);
        fs.readSync(this.fileHandler, tempBuffer, 0, shiftAmount, bytePosition + byteLength);
        fs.writeSync(
          this.fileHandler,
          tempBuffer,
          0,
          shiftAmount,
          bytePosition + newDataLength
        );
      } else if (shiftAmount < 0) {
        const tempBuffer = Buffer.allocUnsafe(-shiftAmount);
        fs.readSync(this.fileHandler, tempBuffer, 0, -shiftAmount, bytePosition + byteLength);
        fs.writeSync(
          this.fileHandler,
          tempBuffer,
          0,
          -shiftAmount,
          bytePosition + newDataLength
        );
      }
      // Overwrite the data in the specified byte range with the new JSON string
      const dataBuffer = Buffer.from(data);
      fs.writeSync(this.fileHandler, dataBuffer, 0, newDataLength, bytePosition);

      // Truncate the file to remove any residual data beyond the desired byte range
      fs.ftruncateSync(this.fileHandler, fileSize + shiftAmount);
      return newDataLength;
    }
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
    const fileSize = this.stats.size

    if (bytePosition >= fileSize) {
      console.error("Byte position exceeds file size.");
      return;
    }

    const maxBytesToRemove = byteLength;

    const buffer = Buffer.alloc(maxBytesToRemove);

    const bytesRead = fs.readSync(
      this.fileHandler,
      buffer,
      0,
      maxBytesToRemove,
      bytePosition
    );

    // Shift remaining bytes to replace the removed portion
    const shiftPosition = bytePosition + bytesRead;
    const shiftLength = fileSize - shiftPosition;
    const shiftBuffer = Buffer.alloc(shiftLength);

    fs.readSync(this.fileHandler, shiftBuffer, 0, shiftLength, shiftPosition);
    fs.writeSync(this.fileHandler, shiftBuffer, 0, shiftLength, bytePosition);

    // Truncate the file to remove the remaining bytes
    fs.ftruncateSync(this.fileHandler, fileSize - bytesRead);
  }
}
