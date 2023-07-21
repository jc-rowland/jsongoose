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
  await data.init()
  return data
}

fs.writeFileSync(dataFilePath, testData);
fs.writeFileSync(
  metaFilePath,
  testMeta
  );
  
  
  describe('Example Test Suite', () => {

  beforeEach(async function() {
    if(data){
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

  // Add more test cases as needed
});
