const axios = require("axios");

const AFFILIATE_ID = "12345";
const SUB_ID = "justj";

async function getShopeeAffiliateLink(url) {
  try {
    const { headers } = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 10000,
    });

    const redirectUrl = headers.location;
    if (redirectUrl?.includes("s.shopee.vn/an_redir?origin_link=")) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set("affiliate_id", AFFILIATE_ID);
      urlObj.searchParams.set("sub_id", SUB_ID);
      return urlObj.toString();
    }
  } catch (e) {
    const redirectUrl = e.response?.headers.location;
    if (redirectUrl?.includes("s.shopee.vn/an_redir?origin_link=")) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set("affiliate_id", AFFILIATE_ID);
      urlObj.searchParams.set("sub_id", SUB_ID);
      return urlObj.toString();
    }
  }
  return null;
}

getShopeeAffiliateLink("https://mikichan.mobi/A0du").then(console.log);
