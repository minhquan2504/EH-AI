import axiosClient from "@/api/axiosClient";
import { unwrap, unwrapList } from "@/api/response";

const EQUIPMENT_ENDPOINTS = {
  LIST: "/api/equipments",
  DETAIL: (id: string) => `/api/equipments/${id}`,
  CREATE: "/api/equipments",
  UPDATE: (id: string) => `/api/equipments/${id}`,
  DELETE: (id: string) => `/api/equipments/${id}`,
};

export const equipmentService = {
  getList: async (params?: any) => {
    const res = await axiosClient.get(EQUIPMENT_ENDPOINTS.LIST, { params });
    return unwrapList(res);
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(EQUIPMENT_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },

  create: async (data: any) => {
    const res = await axiosClient.post(EQUIPMENT_ENDPOINTS.CREATE, data);
    return unwrap(res);
  },

  update: async (id: string, data: any) => {
    const res = await axiosClient.put(EQUIPMENT_ENDPOINTS.UPDATE(id), data);
    return unwrap(res);
  },

  delete: async (id: string) => {
    const res = await axiosClient.delete(EQUIPMENT_ENDPOINTS.DELETE(id));
    return unwrap(res);
  },
};
