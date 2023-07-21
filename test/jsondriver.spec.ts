import path from 'path';
import { expect } from 'chai';
import JSONDriver from '../src/classes/jsondriver'
import fs from 'fs'

const dataPath = path.resolve('.','test/store/');
const dataFilePath = path.resolve(dataPath, 'data.jsondb');
const metaFilePath = path.resolve(dataPath, 'data.jsondb.meta');

const testData = '[{"foo":"bar"},{"foo":"baz"}]'
const testMeta = '{"metaPath":"D:\\\\apaths\\\\Misc\\\\jsongoose\\\\test\\\\store\\\\data.jsondb.meta","items":[[1,13],[15,13]]}'
// Helper function to remove a file
const removeFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

fs.writeFileSync(dataFilePath, testData);
fs.writeFileSync(
  metaFilePath,
  testMeta
  );
  
  let data = new JSONDriver(dataPath,'data')
  
describe('Example Test Suite', () => {

  beforeEach(async function() {
    await data.file.cleanup()
    // Remove any existing files in the store directory
    if(fs.existsSync(dataFilePath)){
      removeFile(dataFilePath);
    }
    if(fs.existsSync(metaFilePath)){
      removeFile(metaFilePath);
    }


    // Create the files for testing
    fs.writeFileSync(dataFilePath, '[{"foo":"bar"},{"foo":"baz"}]');
    fs.writeFileSync(
      metaFilePath,
      testMeta
    );
    data = new JSONDriver(dataPath,'data')
    await data.init()
    console.log('init')
  });
  
  it('should read the items', async () => {
    console.log('dataPath',dataPath)
    const item1 = data[0];
    const item2 = data[1];
    expect(await item1.get()).to.deep.eq({"foo":"bar"})
    expect(await item2.get()).to.deep.eq({"foo":"baz"})
  });

  it('should push a new item', async () => {
    await data.push({blah:"foo"})
    await data.push({blah:"foo"})
    await data.push({blah:"foo"})
    await data.push({blah:"foo",other:'Hello'})
    expect(await data[data.length-1].get()).to.deep.eq({blah:"foo",other:'Hello'})
  });

  it.only('should update an item', async () => {
    
    // let update = {new:"thing",some:"thing"}
    // await data.update(0,update)
    // expect(await data[0].get()).to.be.deep.eq(update)

    // update = {new:"d",some:"thing"}
    // await data.update(0,update)
    // expect(await data[0].get()).to.be.deep.eq(update)

    // update = {new:"tsdfsdfsdfsdfhing",some:"aaaa"}
    // await data.update(0,update)
    // expect(await data[0].get()).to.be.deep.eq(update)

    let update = {new:"z",some:"z"}
    await data.update(0,update)
    expect(await data[0].get()).to.be.deep.eq(update)
    console.log(data[1])
    expect(await data[1].get()).to.be.deep.eq({"foo":"baz"})
  });

  // it('should delete an item', async () => {
    
  //   data.delete(1);
  //   console.log(data[1])
  // });

  // Add more test cases as needed
});
