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

  try {
    const res = await axios.request(axiosConfig);
    if (res.status === 200) {
      return res.data.message;
    }
    return "Failed to save info";
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to save info");
  }
};
