/**
 * Wochenbrief an/aus über den signierten Link aus der Mail (ohne Login).
 */

import { createHaloServiceClient } from "../supabase/halo"
import { verifyUnsubscribeToken } from "./mail"

export async function setBriefByToken(userId: string, token: string, on: boolean): Promise<boolean> {
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) return false
  const { error } = await createHaloServiceClient().from("app_users").update({ weekly_brief: on }).eq("id", userId)
  return !error
}
