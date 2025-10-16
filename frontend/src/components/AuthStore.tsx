import type { User } from "./Navbar";
import {create} from "zustand"
interface UserState {
    user: User | null;
    setUser: (user:User) => void;
    clearUser:()=>void;
}
export const useUserStore= create<UserState>((set)=>({
    user: null,
    setUser:(user)=>set({user}),
    clearUser:()=>set({user: null})
}))