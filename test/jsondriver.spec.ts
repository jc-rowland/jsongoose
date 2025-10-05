import path from 'path';
import { expect } from 'chai';
import JSONDriver from '../src/classes/jsondriver'
import fs from 'fs'

const dataPath = path.resolve('.', 'test/store/');
const dataFilePath = path.resolve(dataPath, 'data.jsondb');
const metaFilePath = path.resolve(dataPath, 'data.jsondb.meta');

const testData = '[{"foo":"bar"},{"foo":"bz"},{"hello":"dolly"},{"hello":"dobby"}]';
const testMeta = '{"metaPath":"D:\\\\apaths\\\\Misc\\\\jsongoose\\\\test\\\\store\\\\data.jsondb.meta","items":[13,12,17,17]}';

let data: JSONDriver<any>; // Declare 'data' as a global variable

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to remove a file
const removeFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


const initData = async ()=>{
  if(fs.existsSync(dataFilePath)){
    removeFile(dataFilePath);
  }
  if(fs.existsSync(metaFilePath)){
    removeFile(metaFilePath);
  }


  // Create the files for testing
  fs.writeFileSync(dataFilePath, testData);
  fs.writeFileSync(
    metaFilePath,
    testMeta
  );
  data = new JSONDriver(dataPath,'data')
  return data
}

fs.writeFileSync(dataFilePath, testData);
fs.writeFileSync(
  metaFilePath,
  testMeta
  );
  
  
  describe('Example Test Suite', () => {

  beforeEach(async function() {
    if(data && data.file){
      await data.file.cleanup()
    }
    // Remove any existing files in the store directory
    await initData()
  });
  
  it('should read the items', async () => {
    const item1 = data.items[0];
    const item2 = data.items[1];
    expect(await item1.get()).to.deep.eq({"foo":"bar"})
    expect(await item2.get()).to.deep.eq({"foo":"bz"})
  });

  it('should push a new item', async () => {
    await data.push({blah:"foo"})
    await data.push({blah:"foo"})
    await data.push({blah:"foo"})
    await data.push({blah:"foo",other:'Hello'})
    
    expect(await data.items[data.items.length-1].get()).to.deep.eq({blah:"foo",other:'Hello'})
  });

  it('should update an item', async () => {
    
    let update = {new:"thing",some:"thing"} as any
    await data.update(0,update)
    expect(await data.items[0].get()).to.be.deep.eq(update)

    update = {new:"d",some:"thing"}
    await data.update(0,update)
    expect(await data.items[0].get()).to.be.deep.eq(update)

    update = {x:"x",a:"x"}
    await data.update(0,update)
    expect(await data.items[0].get()).to.be.deep.eq(update)

    update = {x:"adsdasdad",a:"zasdasdasdad"}
    await data.update(0,update)

    
    
    expect(await data.items[0].get()).to.be.deep.eq(update)
    expect(await data.items[1].get()).to.be.deep.eq({"foo":"bz"})
  });

  it('should empty the array', async () => {
    await data.delete(0)
    await data.delete(0)
    await data.delete(0)
    await data.delete(0)
    expect(fs.readFileSync(dataFilePath).toString()).to.eq('[]')
  });

  it('[push] should push X items into the array', async () => {
    console.log('data.items.length',data.items.length)
    for (let i = 0; i < 5000; i++) {
      await data.push({item:"thing"})
    }
    expect(data.items.length).to.eq(5004)
  });

  it('[pushMany] should push X items into the array', async () => {
    await data.push({blah:"foo"})
    await data.push({blah:"foo"})
    console.time('1')
    let items = [] as any[];

    for (let i = 0; i < 500; i++) {
      items.push({"item":"thang"})
    }
    await data.pushMany(items)
    console.timeEnd('1')
    data.delete(201)

    console.time('2')
    data.items[480].bytePosition
    console.log(await data.items[480].get())
    console.timeEnd('2')
  });

});
