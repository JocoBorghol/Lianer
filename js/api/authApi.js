import { apiRequest } from "./apiClient.js";
// tillfälliga
export async function createUser(firstName, lastName, email, password) {
    return await apiRequest("core", "/api/v1/users", { //todo
        method: "POST",
        auth: true,
        body: {
            firstName,
            lastName,
            email,
            password
        }
    });
}

export async function updateUser(id, firstName, lastName, email) {
    return await apiRequest("core", `/api/v1/users/${id}`, {
        method: "PUT",
        auth: true,
        body: {
            id,
            firstName,
            lastName,
            email
        }
    });
}