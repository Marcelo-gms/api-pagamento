const { default: axios } = require("axios");

const { MODE, ASSAS_ACCESS_TOKEN, ASSAS_ACCESS_TOKEN_DEV } = process.env;

const instance = axios.create({
  baseURL:
    MODE == "dev"
      ? "https://api-sandbox.asaas.com/v3/"
      : "https://api.asaas.com/v3/",
  timeout: 4000,
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    access_token: MODE == "dev" ? ASSAS_ACCESS_TOKEN_DEV : ASSAS_ACCESS_TOKEN,
  },
});

module.exports = instance;
