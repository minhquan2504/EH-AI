import axiosClient from "@/api/axiosClient";
import { BRANCH_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export const branchService = {
  getList: async (params?: any) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.LIST, { params });
    return unwrapList(res);
  },

  getDropdown: async (params?: any) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.DROPDOWN, { params });
    return unwrapList(res);
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },

  updateStatus: async (id: string, data: any) => {
    const res = await axiosClient.put(BRANCH_ENDPOINTS.STATUS(id), data);
    return unwrap(res);
  },
};
