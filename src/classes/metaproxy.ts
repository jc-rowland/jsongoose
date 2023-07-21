import JSONDriver from "./jsondriver";
export default class MetaProxy<T> {
  public index: number;
  public byteLength: number;
  private driver: JSONDriver<T>;
  constructor(byteLength:number,
    index: number,
    driver: JSONDriver<T>
  ) {
    this.byteLength = byteLength;
    this.driver = driver;
    this.index = index;
  }

  get bytePosition():number{
    return this.index === 0?1:this.driver.items[this.index-1].bytePosition+this.driver.items[this.index-1].byteLength+1
  }

  async get() {
    
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