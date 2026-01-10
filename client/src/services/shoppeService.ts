import axios from "axios";
import config from "../config/api";

const BASE_URL = config.apiUrl + "/api/shopee";

export const transformLink = async (link: string): Promise<string> => {
  const url = config.endpoints.transformLink;

  const axiosConfig = {
    method: "post",
    url,
    data: {
      link: link,
    },
  };

  const res = await axios.request(axiosConfig);
  if (res.status === 200) {
    return res.data.data.batchCustomLink[0].shortLink;
  }

  return "";
};

export const saveInfo = async (info: any): Promise<string> => {
  const url = config.endpoints.saveInfo;

  const axiosConfig = {
    method: "post",
    url,
    data: {
      info: info,
    },
  };

  const res = await axios.request(axiosConfig);
  if (res.status === 200) {
    return res.data.message;
  }

  return "Failed to save info";
};
