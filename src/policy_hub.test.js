const { PolicyHub } = require('./policy_hub');
const info = {
  host: 'http://152.67.108.147:8787',
  user: 'apiuser',
  secret: '70oGnq0UJd!Maoi8HIZWmRdbu9qYnp'
}
const myHub = new PolicyHub(info.host, info.user, info.secret);

describe('Policy Hub Tests', () => { 
  it ('gets example', async () => {
    const response = await myHub.getExample('TravelCompensation');
    expect(response.request.outcomes.length).toEqual(2);
  })
  it('performs batch assessment', async () => {
    const response = await myHub.batchAssess('TravelCompensation', {
      outcomes: [{
        id: 'amount_payable',
        knownOutcomeStyle: "decision-report",
        unknownOutcomeStyle: "decision-report"
      }],
      cases: [{
        '@id': 1,
        airline_name: 'Air France'
      }]
    });
    expect(response.cases[0]['@id']).toEqual(1);
    expect(response.cases[0].amount_payable).toEqual(null);

  });
  it('gets version information', async () => {
    const response = await myHub.getVersionHistory('TravelCompensation');
    expect(response.items.length).toBeGreaterThan(0);
  })
});