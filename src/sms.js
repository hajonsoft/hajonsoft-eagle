const axios = require("axios");
const defaultSMSAPIKeyMustOverride = "88fd2e1A3f4d327740A9408c12872A39";

async function runGetSMSNumber() {
  // Must read api key from data.json
  let api_key = defaultSMSAPIKeyMustOverride;

  const balance = await getSMSBalance(api_key);
  if (balance < 1) {
    return {
      error: "No SMS balance",
    };
  }
  await getPrices(api_key);
  // const existingActivation = getExistingActivation(api_key)
  // if (existingActivation){
  //     await cancelActivation(api_key, existingActivation.split(":")[1]);
  // }
  // TODO: check status proceed only if status is 0
//   const result = await getSMSNumber(api_key);
//   if (result.error) {
//     return {
//       error: result.error,
//     };
//   }
//   return result;
}

async function getSMSNumber(api_key, country = "0") {
  //https://api.sms-activate.org/stubs/handler_api.php?api_key=$api_key&action=getPrices
  const numberInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getNumber&service=ot&country=${country}&freePrice=true&maxPrice=1`
  );

  if (numberInquiry.status === 200) {
    return numberInquiry.data?.split(":")?.[1];
  }
  return { error: numberInquiry.data };
}

async function getSMSBalance(api_key) {
  const balanceInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getBalance`
  );
  if (balanceInquiry.status === 200) {
    return balanceInquiry?.data?.split(":")?.[1];
  }
}

async function getPrices(api_key) {
    // Study how to trat obejct like an array to filter by available count and cheapest price
  const pricesInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getPrices`
  );

  for (const [key,value] of Object.entries(pricesInquiry.data)) {
      console.log('%c 🍪 value: ', 'font-size:20px;background-color: #FCA650;color:#fff;', value);
      console.log('%c 🥧 key: ', 'font-size:20px;background-color: #7F2B82;color:#fff;', key);
  }
}

async function cancelActivation(api_key, id) {
  const cancelInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=8&id=${id}`
  );
  if (cancelInquiry.status === 200) {
    console.log(cancelInquiry.data);
  }
}

async function getActivationSMSCode(api_key, id) {
  const codeInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=1&id=${id}`
  );
  if (codeInquiry.status === 200) {
    console.log(codeInquiry.data);
    return codeInquiry.data;
  }
}

async function completeActivationSMSCode(api_key, id, code) {
  const completeInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=6&id=${id}&code=${code}`
  );
  if (completeInquiry.status === 200) {
    console.log(completeInquiry.data);
  }
}

module.exports = { runGetSMSNumber };
