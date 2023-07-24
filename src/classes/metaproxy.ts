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

  get bytePosition(): number {
    if (this.index === 0) {
      return 1;
    }
  
    let position = 1;
    for (let i = 0; i < this.index; i++) {
      position += this.driver.items[i].byteLength + 1;
    }
  
    return position;
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