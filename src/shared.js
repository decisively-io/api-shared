const axios = require('axios');
const get = require('lodash/get');
const lowerCase = require('lodash/lowerCase');
const url = require('url');
const atob = require('atob');

const getQueryData = (ctx) => {
  let requestUrl = ctx.headers['Fn-Http-Request-Url'];
    
  let queryData = {};
  if (requestUrl) {
    queryData = url.parse(requestUrl[0], true).query;
  }
  return queryData;
}
exports.getQueryData = getQueryData;

const parseToken = (ctx, header = 'Fn-Http-H-Idcs-Token') => {
  let token = get(ctx, `headers[${header}][0]`);
  if (!token) {
    console.log('No token provided');
    return false;
  }

  if (token.split(' ').length > 1) token = token.split(' ')[1]; // to remove bearer
  let payload;
  try {
    // Parse the token to get additional info
    const parts = token.split('.');
    payload = JSON.parse(atob(parts[1]));
  } catch (error) {
    console.log('Error parsing token', error);
    return false;
  }
  return payload;
}
exports.parseToken = parseToken;

const checkCustomer = async (ctx) => {
  
  const customer = get(ctx, 'headers[Fn-Http-H-Dcsvly-Customer][0]');

  if (!customer) {
    console.log('CheckCustomer: No customer header provided');
    return false;
  } 
  const payload = parseToken(ctx);
  if (!payload) return false;
  const url = get(payload, 'tenant_iss');
  const token = get(ctx, `headers[Fn-Http-H-Idcs-Token][0]`);
  // Validate the user has access to this customer
  try {

    const groups = await axios.get(`${url}/admin/v1/MyGroups`, {
      headers: {
        Authorization: `${token}`
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
exports.checkCustomer = checkCustomer;