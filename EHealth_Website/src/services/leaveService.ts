import axiosClient from "@/api/axiosClient";
import { LEAVE_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export const leaveService = {
  getList: async (params?: any) => {
    const res = await axiosClient.get(LEAVE_ENDPOINTS.LIST, { params });
    return unwrapList(res);
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(LEAVE_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },

  approve: async (id: string, data?: any) => {
    const res = await axiosClient.put(LEAVE_ENDPOINTS.APPROVE(id), data);
    return unwrap(res);
  },

  reject: async (id: string, data?: any) => {
    const res = await axiosClient.put(LEAVE_ENDPOINTS.REJECT(id), data);
    return unwrap(res);
  },
};
