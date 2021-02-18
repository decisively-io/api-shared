const axios = require('axios');
const url = require('url');
const map = require('lodash/map');

module.exports = {
  Soda: class SodaController {

    constructor (host, schema, auth) {
      this.host = host;
      this.schema = schema;
      this.auth = auth;
    }

    async get (resource, ctx) {
      let requestUrl = ctx.headers['Fn-Http-Request-Url'];
      
      let queryData = {};
      if (requestUrl) {
        queryData = url.parse(requestUrl[0], true).query;
      }
      const id = queryData.id;
      if (!id) throw 'No ID provided';

      return this._get(resource, id);
    }

    async _get(resource, id) {
      if (!id) throw 'No ID provided';

      const result = await axios.get(`${this.host}/ords/${this.schema}/soda/latest/${resource}/${id}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
        }
      });
      if (!result) throw 'Error retrieving information';
      result.data.id = id;
      return result.data;
    }

    async create (resource, data) {
      let result;
      if (Array.isArray(data)) {
        result = await axios.post(`${this.host}/ords/${this.schema}/soda/latest/${resource}?action=insert`, data, {
          headers: {
            Authorization: `Basic ${this.auth}`,
          }
        });
      } else {
        result = await axios.post(`${this.host}/ords/${this.schema}/soda/latest/${resource}`, data, {
          headers: {
            Authorization: `Basic ${this.auth}`,
          }
        });
      }
      if (!result) throw Error('Error creating record');
      if (result.data.count === 1) return result.data.items[0];
      else return result.data.items;
    }

    async delete (resource,  ctx) {
      let requestUrl = ctx.headers['Fn-Http-Request-Url'];
      
      let queryData = {};
      if (requestUrl) {
        queryData = url.parse(requestUrl[0], true).query;
      }
      const id = queryData.id;
      if (!id) throw 'No ID provided';
      return this._delete(resource, id);
    }

    async _delete (resource, id) {
      let result = await axios.delete(`${this.host}/ords/${this.schema}/soda/latest/${resource}/${id}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
        }
      });
    
      if (!result) throw Error('Error deleting record');
      return true;
    }

    async update (resource, ctx, input) {
      let requestUrl = ctx.headers['Fn-Http-Request-Url'];
      
      let queryData = {};
      if (requestUrl) {
        queryData = url.parse(requestUrl[0], true).query;
      }
      const id = queryData.id;
      if (!id) throw 'No ID provided';
      return this._update(resource, id, input);
    }

    async _update (resource, id, data) {
      let result;
      let loc = `${this.host}/ords/${this.schema}/soda/latest/${resource}`;

      // First GET the object (as the base system just sends a PATCH)
      result = await axios.get(`${loc}/${id}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
        }
      })
      
      if (!result || !result.data) throw 'Error getting information for update';

      const newData = {...result.data, ...data};

      // Now update the object in the db
      await axios.put(`${loc}/${id}`, newData, {
        headers: {
          Authorization: `Basic ${this.auth}`,
        }
      })
      newData.id = id;
      // SODA Update doesn't return any data
      return newData;
    }

    async find (resource, ctx, additionalFilter = {}) {
      let requestUrl = ctx.headers['Fn-Http-Request-Url'];
      let queryData;
      if (requestUrl) {
        queryData = url.parse(requestUrl[0], true).query;
      }

      const limit  = queryData && queryData['$limit'] ? queryData['$limit'] : 10;
      const offset = queryData && queryData['$skip']  ? queryData['$skip']  : 0;
        const sort = queryData && queryData['$orderBy'] ? queryData['$orderBy'] : 'id:desc';

      delete queryData['$limit'];
      delete queryData['$skip'];
      delete queryData['$orderBy'];
      delete queryData.customer; // Given by the gateway so we know which db to connect to (verified upstream)
      return this._find(resource, { ...queryData, ...additionalFilter}, limit, offset, sort);
    }

    async _find (resource, filter, limit = 10, offset = 0, sort = 'id:desc') {
      let _sort_data = sort.split(':');
      let sortData = {};
      sortData[_sort_data[0]] = _sort_data[1] === 'desc' ? -1 : 1;
      let result;
      let loc = `${this.host}/ords/${this.schema}/soda/latest/${resource}`;
      try {
        result = await axios.post(`${loc}?action=query&limit=${limit}&offset=${offset}`, {
          '$query': filter,
          '$orderby': sortData
        }, {
          headers: {
            Authorization: `Basic ${this.auth}`,
          }
        });
      } catch (error) {
        throw Error(error);
      }

      if (!result) return { total: 0, data: []}
      else {
        let totalCount = parseInt(result.data.count) + parseInt(offset);
        if (result.data.hasMore) {
          // More records. Unfortunately SODA can't return the totalResults so do the query again to get that information
          // We ask to get the ID's back only - so it's slightly faster
          let total;
          try {
            total = await axios.post(`${loc}?action=query&fields=id`, {
              '$query': filter,
              '$orderby': sortData
            }, {
              headers: {
                Authorization: `Basic ${this.auth}`,
              }
            });
          } catch (error) {
            throw Error(error);
          }
          totalCount = total.data.count;
        } 
        return {
          total: totalCount,
          data: map(result.data.items, (item) => {
            let data;
            data = item.value || {};
            data.id = item.id;
            data.lastModified = item.lastModified,
            data.created = item.created;

            return data;
          })
        }
      }
    }
  }
}