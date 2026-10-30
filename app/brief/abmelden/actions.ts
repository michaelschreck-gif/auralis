"use server"

import { setBriefByToken } from "@/lib/halo/brief-prefs"

export async function setBrief(userId: string, token: string, on: boolean): Promise<{ ok: boolean }> {
  return { ok: await setBriefByToken(userId, token, on) }
}
