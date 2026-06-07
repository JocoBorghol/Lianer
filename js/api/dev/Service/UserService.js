import { userApi } from "../Endpoints/userApi";

export class UserService {
    constructor(api = userApi) 
    {
        this.api = api;
        this.users = new Map();
    }

    async init() 
    {
        await this.loadUsers();
    }

    async loadUsers() 
    {
        const response = await this.api.getAll();
        const data = Array.isArray(response) ? response : [];

        this.users.clear();

        data.forEach(user => {
            const id = getUserId(user);
            if (!id) return;

            this.users.set(id, user);
        });

        return this.getUsers();
    }

    getUsers() 
    {
        return Array.from(this.users.values());
    }



    getUserFullName(id) 
    {
        const user = this.getUserById(id);
        if (!user) return null;

        return user.fullName
            ?? [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
            ?? null;
    }


    getPeopleNames(includeUnassigned = true) 
    {
        const names = this.getUsers()
            .map(user =>
                user.fullName
                ?? [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
            )
            .filter(Boolean);

        return includeUnassigned ? ["Ingen", ...names] : names;
    }


    getUserById(id) 
    {
        if (!id) return null;
        return this.users.get(id) ?? null;
    }

    /*
        All function calls to the backend
    */
    async getById(id) 
    {
        const user = await this.api.getById(id);
        const userId = getUserId(user);

        if (userId) {
            this.users.set(userId, user);
        }

        return user;
    }

    async createUser(requestBody)
    {   
        const createdId = await this.api.create(requestBody);
        if (createdId) {
            try {
                const createdUser = await this.api.getById(createdId);
                const userId = getUserId(createdUser);
                if (userId) this.users.set(userId, createdUser);
                return createdUser;
            } catch {
                return createdId;
            }
        }

        return createdId;
    }

    async updateUser(id, requestBody)
    {
        await this.api.update(id, requestBody);
        const updatedUser = await this.api.getById(id);
        const userId = getUserId(updatedUser);

        if (userId) 
        {
            this.users.set(userId, updatedUser);
        }
        return updatedUser;
    }

    async deleteUser(id) 
    {
        await this.api.delete(id);
        this.users.delete(id);
        return true;
    }
 
    clearCache() {
        this.activities.clear();
    }
}

function getUserId(user) {
    return user?.userId ?? user?.id ?? null;
}