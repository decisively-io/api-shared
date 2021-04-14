const { resetMockData, mockSoda } = require('./mockSoda');

describe('Mock Soda Tests', () => { 
  it ('filters results', async () => {
    resetMockData({
      Models: [{
        id: 1,
        env: 'test',
        active: false
      }, {
        id: 2,
        env: 'test',
        active: true
      },{
        id:  3,
        env: 'prod',
        active: true
      }]
    })
    let results = await mockSoda._find('Models', {env: 'test', active: true});
    expect(results).toEqual({
      total: 1,
      data: [{
        active: true,
        env: 'test',
        id: 2
      }]
    });
    results = await mockSoda._find('Models', {env: 'prod'});
    expect(results).toEqual({
      total: 1,
      data: [{
        active: true,
        env: 'prod',
        id: 3
      }]
    });
    results = await mockSoda._find('Models', {});
    expect(results).toEqual({
      total: 3,
      data: [{
        id: 1,
        env: 'test',
        active: false
      }, {
        id: 2,
        env: 'test',
        active: true
      },{
        id:  3,
        env: 'prod',
        active: true
      }]
    });
    results = await mockSoda._find('Models', {env: 'prod', unknown: true});
    expect(results).toEqual({
      total: 0,
      data: []
    });
  })
});
