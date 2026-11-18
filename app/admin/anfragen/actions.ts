"use server"

import { revalidatePath } from "next/cache"
import { getAdmin, logAudit } from "@/lib/halo/admin"
import type { ServiceRequestStatus } from "@/lib/supabase/halo.types"

const STATUSES: ServiceRequestStatus[] = ["new", "contacted", "offer", "won", "lost"]

export async function setRequestStatus(formData: FormData): Promise<void> {
  const admin = await getAdmin()
  if (!admin) return
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "") as ServiceRequestStatus
  if (!id || !STATUSES.includes(status)) return
  const { error } = await admin.service.from("service_requests").update({ status }).eq("id", id)
  if (error) {
    console.error("[admin] service_requests update failed:", error.message)
    return
  }
  await logAudit(admin, "service_request.status", { type: "service_request", id }, { status })
  revalidatePath("/admin/anfragen")
}
