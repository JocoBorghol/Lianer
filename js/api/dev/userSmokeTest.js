import { userApi } from "./Endpoints/userApi.js";
//TODO TA BORT
export async function smokeTestCreateUser() {
    const unique = Date.now();

    const request = {
        firstName: "test",
        lastName: "testsson",
        email: `test.test.${unique}@example.com`,
        password: "test123123!"
    };
    const createdUserId = await userApi.create(request);
    console.log("Test passed.");
    console.log("Created user id:", createdUserId);
    return createdUserId;
}