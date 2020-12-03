const axios = require('axios');
const get = require('lodash/get');
const lowerCase = require('lodash/lowerCase');
const url = require('url');
const atob = require('atob');

module.exports = {
  getQueryData: (ctx) => {
    let requestUrl = ctx.headers['Fn-Http-Request-Url'];
      
    let queryData = {};
    if (requestUrl) {
      queryData = url.parse(requestUrl[0], true).query;
    }
    return queryData;
  },
  checkCustomer: async (ctx) => {
    let idcs_token = get(ctx, 'headers[Fn-Http-H-Idcs-Token][0]');
    if (!idcs_token) {
      console.log('CheckCustomer: No access token provided');
      return false;
    }
    const customer = get(ctx, 'headers[Fn-Http-H-Dcsvly-Customer][0]');

    if (!customer) {
      console.log('CheckCustomer: No customer header provided');
      return false;
    } 
    if (idcs_token.split(' ').length > 1) idcs_token = idcs_token.split(' ')[1];
    let url;
    try {
      // Parse the token to get additional info
      const parts = idcs_token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      url = get(payload, 'tenant_iss');
    } catch (error) {
      console.log('CheckCustomer: Error parsing token', error);
      return false;
    }
    // Validate the user has access to this customer
    try {

      const groups = await axios.get(`${url}/admin/v1/MyGroups`, {
        headers: {
          Authorization: `Bearer ${idcs_token}`
        }
      });
      if (!groups) throw "No Groups";
      let found = false;
      let expand;
      get(groups, 'data.Resources', []).forEach((group) => {
        if (group.displayName.indexOf('Dcsvly') > -1) {
          // A dcsvly group - check if it is theirs
          expand = group.displayName.split('_');
          if (lowerCase(expand[1]) === lowerCase(customer)) found = true;
        }
      });
      if (!found) throw "No matching group found"
    } catch (error) {
      console.log('CheckCustomer: Error checking group', error);
      return false;
    }
    // If we got here we found a matching customer group in IDCS. Approved.
    return true; 
  }
}