const config = require("../config/config");

exports.fetchApp2 = (link, request = {}) => {
  const API_KEY = config.HEKA_NEW.api_key;
  const API_URL = config.HEKA_NEW.api_url;

  const headers = new Headers();
  headers.append("Api-Key", API_KEY);
  headers.append("Content-Type", "application/json");
  const defaultRequest = {
    method: "GET"
  }

  return {
    send: async () => {
      const finalRequest = Object.assign(defaultRequest, request);
      finalRequest.headers = headers;

      return fetch(`${API_URL}${link}`, finalRequest)
      .then(d => d.json())
      .catch(e => {
        return {
          error: true,
          message: e.message,
          response: null
        }
      });
    },
    appendHeader: function(key, value) {
      headers.append(key, value);
      return this;
    },
    deleteHeader: function(key) {
      headers.delete(key);
      return this;
    }
  }    
}