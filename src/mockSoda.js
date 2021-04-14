
let mock_data = [];
const remove = require('lodash/remove');
const url = require('url');
const filter = require('lodash/filter');
const resetMockData = (new_data = []) => {
  mock_data = new_data
};
const mockSoda = {
  create: (type, data) => new Promise((resolve, reject) => {
    if (!mock_data[type]) mock_data[type] = [];
    if (Array.isArray(data)) {
      data.map((item, index) => mock_data[type].push({...item, ...{id: mock_data[type].length + 1}}));
    } else {
      mock_data[type].push({...data, ...{ id: mock_data[type].length + 1}});
    }
    let result = mock_data[type][mock_data[type].length - 1];
    resolve(result);
    //resolve()
  }),
  _get: (type, id) => new Promise((resolve, reject) => {
    if (mock_data[type] && mock_data[type][id-1]) resolve(mock_data[type][id - 1]);
    else reject({ 
      message: 'No ' + type + ' found'
    })
  }),
  delete: (type, ctx) => new Promise((resolve, reject) => {
    let requestUrl = ctx.headers['Fn-Http-Request-Url'];

    let queryData = {};
    if (requestUrl) {
      queryData = url.parse(requestUrl[0], true).query;
    }
    const id = queryData.id;
    if (!id) throw {
      message: 'No ID provided'
    }
    let del = remove(mock_data[type], (val) => {
      return val.id == id;
    });
    if (del.length === 1) {
      resolve(true);
    } else {
      reject({ 
        message: `${type} not found`
      })
    }
  }),
  update: (type, ctx, data) => new Promise((resolve, reject) => {
    let requestUrl = ctx.headers['Fn-Http-Request-Url'][0];
    if (!requestUrl) return reject({message: 'Invalid URL'});
    const loc = requestUrl.indexOf('id=');
    const id = requestUrl.substring(loc + 3);
    if (mock_data[type] && mock_data[type][id-1]) {
      let existing = mock_data[type][(id-1)];
      let update = mock_data[type][(id-1)] = {
        ...existing,
        ...data
      }
      resolve(update);
    } else reject({message: 'Error'})
  }),
  _update: (type, id, data) => new Promise((resolve, reject) => {
    let existing = mock_data[type][(id-1)];
    let update = mock_data[type][(id-1)] = {
      ...existing,
      ...data
    }
    resolve(update);
  }),
  get: (type, ctx) => new Promise((resolve, reject) => {
    let requestUrl = ctx.headers['Fn-Http-Request-Url'][0];
    if (!requestUrl) return reject({message: 'Invalid URL'});
    const loc = requestUrl.indexOf('id=');
    const id = requestUrl.substring(loc + 3);
    if (mock_data[type] && mock_data[type][id-1]) resolve(mock_data[type][id-1]);
    else reject({ message: `No ${type} found`});
    //resolve(mock_data[type]);
  }),
  find: (type, ctx) => new Promise((resolve, reject) => { // TODO
    resolve({
      total: mock_data[type] ? mock_data[type].length : 0,
      data: mock_data[type]
    })
  }),
  _find: (type, _filter) => new Promise((resolve, reject) => {
    if (!mock_data[type]) resolve({total: 0, data:[]});
    let _filteredData = filter(mock_data[type], _filter);
    resolve({
      total: _filteredData.length,
      data: _filteredData
    })
  })
};
exports.mockSoda = mockSoda;
exports.mock_data = mock_data;
exports.getMockData = () => { return mock_data; }
exports.resetMockData = resetMockData;