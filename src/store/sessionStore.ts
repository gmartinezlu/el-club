import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { AppRole } from "../shared/auth/roles";
import { fetchAppRoleByUserId } from "../services/supabase/profile";
import { getSupabaseClient } from "../services/supabase/client";

type SessionStatus = "loading" | "unauthenticated" | "authenticated";

type SessionState = {
  initialized: boolean;
  status: SessionStatus;
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  fullName: string | null;
  avatarUrl: string | null;
  init: () => Promise<void>;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

let unsubscribe: (() => void) | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  initialized: false,
  status: "loading",
  session: null,
  user: null,
  role: null,
  fullName: null,
  avatarUrl: null,

  init: async () => {
    if (get().initialized) return;

    set({ status: "loading" });

    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();

      const session = data.session ?? null;
      const user = session?.user ?? null;

      set({
        session,
        user,
        status: user ? "authenticated" : "unauthenticated",
      });

      if (user) {
        await get().refreshRole();
      } else {
        set({ role: null, fullName: null, avatarUrl: null });
      }

      if (!unsubscribe) {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (_event, nextSession) => {
            const nextUser = nextSession?.user ?? null;
            set({
              session: nextSession ?? null,
              user: nextUser,
              status: nextUser ? "authenticated" : "unauthenticated",
            });

            if (nextUser) {
              try {
                await get().refreshRole();
              } catch {
                set({
                  role: null,
                  fullName: null,
                  avatarUrl: null,
                });
              }
            } else {
              set({
                role: null,
                fullName: null,
                avatarUrl: null,
              });
            }
          },
        );

        unsubscribe = () => subscription.unsubscribe();
      }

      set({ initialized: true });
    } catch (e) {
      // Si falla el init (env, red, tabla no lista), mantenemos la UI estable.
      set({
        initialized: true,
        status: "unauthenticated",
        session: null,
        user: null,
        role: null,
        fullName: null,
        avatarUrl: null,
      });
      console.error("Auth init failed", e);
    }
  },

  refreshRole: async () => {
    const user = get().user;
    if (!user) return;

    const profile = await fetchAppRoleByUserId(user.id);
    if (!profile) {
      set({ role: null, fullName: null, avatarUrl: null });
      return;
    }

    set({
      role: profile.role,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      role: null,
      fullName: null,
      avatarUrl: null,
      status: "unauthenticated",
    });
  },
}));
