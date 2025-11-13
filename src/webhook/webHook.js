const SmeeClient = require("smee-client");

function activeWebHook() {
  const smee = new SmeeClient({
    source: "https://smee.io/0i8GA7gPviRZp4k7",
    target: "http://localhost:3000/confirm-payment",
    logger: console,
  });

  const events = smee.start();

  console.log("Web hook running!");
}

module.exports = activeWebHook();
