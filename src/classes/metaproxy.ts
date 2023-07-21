import JSONDriver from "./jsondriver";
export default class MetaProxy<T> {
  public index: number;
  public bytePosition: number;
  public byteLength: number;
  private driver: JSONDriver<T>;
  constructor(
    [bytePosition, byteLength]: [number, number],
    driver: JSONDriver<T>,
    index: number
  ) {
    this.bytePosition = bytePosition;
    this.byteLength = byteLength;
    this.driver = driver;
    this.index = index;
  }

  async get() {
    console.log('GET',this.bytePosition,
    this.byteLength)
    return this.driver.file.read(
      this.bytePosition,
      this.byteLength
    ) as T;
  }

  async set(x: T) {
    return this.driver.update(this.index, x);
  }

  async delete() {
    this.driver.delete(this.index);
  }
}