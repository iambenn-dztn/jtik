import axios from "axios";

export async function getShopeeAffiliateLink(
  url: string,
  affiliateId: string,
  subId: string,
): Promise<string | null> {
  try {
    if (!affiliateId || !subId) {
      return null;
    }
    const { headers } = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const redirectUrl = headers.location;

    // Check if it redirects to Shopee (either s.shopee.vn/an_redir or shopee.vn)
    if (redirectUrl?.includes("s.shopee.vn/an_redir")) {
      const urlObj = new URL(redirectUrl);
      // Replace affiliate_id and sub_id with ours
      urlObj.searchParams.set("affiliate_id", affiliateId);
      urlObj.searchParams.set("sub_id", subId);
      // Remove utm_medium if present
      urlObj.searchParams.delete("utm_medium");
      return urlObj.toString();
    } else if (redirectUrl?.includes("shopee.vn")) {
      // Direct shopee link, convert to affiliate link
      const encoded = encodeURIComponent(redirectUrl);
      return `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affiliateId}&sub_id=${subId}`;
    }
  } catch (e: any) {
    const redirectUrl = e.response?.headers.location;

    if (redirectUrl?.includes("s.shopee.vn/an_redir")) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set("affiliate_id", affiliateId);
      urlObj.searchParams.set("sub_id", subId);
      urlObj.searchParams.delete("utm_medium");
      return urlObj.toString();
    } else if (redirectUrl?.includes("shopee.vn")) {
      const encoded = encodeURIComponent(redirectUrl);
      return `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affiliateId}&sub_id=${subId}`;
    }
  }
  return null;
}
