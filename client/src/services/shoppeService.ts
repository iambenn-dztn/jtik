import axios from "axios";

const BASE_URL = "http://localhost:3001/api/shopee";

export const transformLink = async (link: string): Promise<string> => {
  const url = `${BASE_URL}/transform-link`;

  let config = {
    method: "post",
    url,
    data: {
      link: link,
    },
  };

  const res = await axios.request(config);
  if (res.status === 200) {
    return res.data.data.batchCustomLink[0].shortLink;
  }

  return "";
};

export const saveInfo = async (info: any): Promise<string> => {
  const url = `${BASE_URL}/save-info`;

  let config = {
    method: "post",
    url,
    data: {
      info: info,
    },
  };

  const res = await axios.request(config);
  if (res.status === 200) {
    return res.data.message;
  }

  return "Failed to save info";
};
