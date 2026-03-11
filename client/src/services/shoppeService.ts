import axios from "axios";
import config from "../config/api";

const BASE_URL = config.apiUrl + "/api/shopee";

export const transformLink = async (links: string[]): Promise<any> => {
  const url = config.endpoints.transformLink;

  const axiosConfig = {
    method: "post",
    url,
    data: {
      links: links,
    },
  };

  const res = await axios.request(axiosConfig);
  if (res.status === 200) {
    return res.data;
  }

  throw new Error("Failed to transform links");
};

export const transformText = async (text: string): Promise<any> => {
  const url = config.endpoints.transformText;

  const axiosConfig = {
    method: "post",
    url,
    data: {
      text: text,
    },
  };

  const res = await axios.request(axiosConfig);
  if (res.status === 200) {
    return res.data;
  }

  throw new Error("Failed to transform text");
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
