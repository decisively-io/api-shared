const source = require('./index');

const { Soda, checkCustomer, getQueryData, mockSoda, mock_data, getMockData} = require('./index');
describe('Main Tests', () => { 
  it('packages everything', async () => {
    expect(source.getQueryData).toBeTruthy();
    expect(source.parseToken).toBeTruthy();
    expect(source.checkCustomer).toBeTruthy();
    expect(source.Soda).toBeTruthy();
    expect(source.PolicyHub).toBeTruthy();

    expect(getQueryData).toBeTruthy();
    expect(mockSoda).toBeTruthy();
    expect(mock_data).toBeTruthy();
    expect(getMockData).toBeTruthy();
  });
});