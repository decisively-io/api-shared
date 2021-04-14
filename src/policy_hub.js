const axios = require('axios');

const fs = require('fs');

let cache_token;
module.exports = {
  PolicyHub: class PolicyHub {

    constructor (host, user, secret) {
      if (!host || !user || !secret) throw "Invalid config";
      this.host = `${host}`;
      this.user = user;
      this.secret = secret;
    }

    async auth () {
      // Get OPA Token
      if (!cache_token) {
        let auth;
        try {
          const params = new URLSearchParams()
          params.append('grant_type', 'client_credentials');
          params.append('client_id', this.user);
          params.append('client_secret', this.secret);

          auth = await axios.post(`${this.host}/opa-hub/api/12.2.20/auth`, params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        } catch (error) {
          console.log(error);
          throw { message: 'Error authenticating to hub'}
        }
        if (!auth.data || !auth.data.access_token) throw {message: "Error getting security token"}
        cache_token = auth.data.access_token;
      }
      return cache_token;
    }

    async getExample (policy_model) {
      const authToken = await this.auth();

      const response = await axios.get(`${this.host}/determinations-server/batch/12.2.20/policy-models/${policy_model}/assessor/example`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } 

    async getVersionHistory (policy_model) {
      const authToken = await this.auth();

      const response = await axios.get(`${this.host}/opa-hub/api/12.2.20/deployments/${policy_model}/versions`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
    async getDataModel (policy_model) {
      const authToken = await this.auth();

      const response = await axios.get(`${this.host}/determinations-server/batch/12.2.20/policy-models/${policy_model}/data-model`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } 

    async getDeployment (name) {
      const authToken = await this.auth();

      const response = await axios.get(`${this.host}/opa-hub/api/12.2.20/deployments/${name}`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } 

    async getLatestVersion (name) {
      const authToken = await this.auth();

      const response = await axios.get(`${this.host}/opa-hub/api/12.2.20/deployments/${name}/activeVersion`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } 

    async deleteDeployment(name) {
      const authToken = await this.auth();

      return await axios.delete(`${this.host}/opa-hub/api/12.2.20/deployments/${name}`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        }
      });
    }

    async createDeployment(name, snapshot, description = '', hasBatch = true, hasInterview = true) {
      const authToken = await this.auth();
      let response;
      try {
        // I think this needs a snapshot
        let services = [];
        if (hasBatch) services.push('webserviceAssess');
        if (hasInterview) services.push('webserviceInterview');

        const payload = {
          items: [{
            name: name,
            description: description,
            compatibilityMode: 'current',
            services: services,
            versions: {
              items: [{
                activeVersionFlag: true,
                description: 'Initial Release',
                snapshot: {
                  base64: snapshot
                }
              }]
            },
            workspace: 'Default Collection' // customer?
          }]
        };
        response = await axios.post(`${this.host}/opa-hub/api/12.2.20/deployments`, payload,{
          headers: {
            Authorization: 'Bearer ' + authToken,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error(error);
        throw {
          message: 'Error creating deployment'
        }
      }
      return response.data;
    }

    async getSnapshot(name, version = 'latest') {
      const authToken = await this.auth();
      let response;
      try {
        response = await axios.get(`${this.host}/opa-hub/api/12.2.20/deployments/${name}/versions/${version}/snapshot`, {
          headers: {
            Authorization: 'Bearer ' + authToken,
            Accept: 'application/zip'
          },
          responseType: 'stream'
        });
        return response.data;
      } catch (error) {
        console.error(error);
        throw {
          message: 'Error getting snapshost'
        }
      }
    }
    async createSnapshot(name, snapshot, description) {
      const authToken = await this.auth();
      let response;
      try {
        response = await axios.post(`${this.host}/opa-hub/api/12.2.20/deployments/${name}/versions`, {
          snapshot: {
            base64: snapshot
          },
          description: description || 'Decisively Portal Update',
          activeVersionFlag: true
        }, {
          headers: {
            Authorization: 'Bearer ' + authToken
          }
        });
        return response.data;
      } catch (error) {
        console.error(error);
        throw {
          message: 'Error getting snapshot'
        }
      }
    }

    async batchAssess (policy_model, input) {
      const authToken = await this.auth();
      try {
        const response = await axios.post(`${this.host}/determinations-server/batch/12.2.20/policy-models/${policy_model}/assessor`, input, {
          headers: {
            Authorization: 'Bearer ' + authToken,
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (error) {
        console.error(error);
        throw {
          message: 'Error running batch assessment'
        }
      }
    }
  }
};