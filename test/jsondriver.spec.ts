import path from 'path';
import { expect } from 'chai';
import JSONDriver from '../src/classes/jsondriver'
const dataPath = path.resolve('.','test/store/')

describe('Example Test Suite', () => {
  
  it('should read the items', async () => {
    console.log('dataPath',dataPath)
    const data = new JSONDriver(dataPath,'data')
    const item1 = data.getIndex(0);
    console.log(item1)
    const item2 = data.getIndex(1);
    console.log(item2)
    const item3 = data.getIndex(2);
    console.log(item3)
  });

  it.only('should delete an item', async () => {
    console.log('dataPath',dataPath)
    const data = new JSONDriver(dataPath,'data')
    data.deleteIndex(1);
    data.getIndex(1);
  });

  // Add more test cases as needed
});

async function asyncOperation(): Promise<string> {
  return Promise.resolve('expected value');
}
