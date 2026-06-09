import { apiRequest } from "../Client/apiClient.js";
import { ApiEndpoints } from "./Endpoints.js";

const TARGET = "core";

export const contactApi = Object.freeze({
  getAll(paging = {}) {
    const path = withQuery(ApiEndpoints.contacts.root(), {
      currentPage: paging.currentPage ?? 1,
      pageSize: paging.pageSize ?? 100
    });

    return apiRequest(TARGET, path, {
      auth: true
    });
  },

  getById(id) {
    validateGuid(id);

    return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
      auth: true
    });
  },

  create(requestBody) {
    return apiRequest(TARGET, ApiEndpoints.contacts.root(), {
      method: "POST",
      auth: true,
      body: requestBody
    });
  },

  update(id, requestBody) {
    validateGuid(id);

    return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
      method: "PUT",
      auth: true,
      body: requestBody
    });
  },

  delete(id) {
    validateGuid(id);

    return apiRequest(TARGET, ApiEndpoints.contacts.byId(id), {
      method: "DELETE",
      auth: true
    });
  }
});

function withQuery(path, query) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function validateGuid(id) {
  const guidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (typeof id !== "string" || !guidRegex.test(id)) {
    throw new Error("Id must be a valid UUID string.");
  }
}