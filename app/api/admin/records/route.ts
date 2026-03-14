import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";
import {
  assertAdminEntity,
  getAdminTableName,
  normalizeAdminPayload,
} from "@/lib/admin-server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "Admin session expired." }, { status: 401 });
    }

    const body = (await request.json()) as {
      entity?: string;
      action?: "upsert" | "delete";
      id?: string;
      payload?: Record<string, unknown>;
    };

    const entity = assertAdminEntity(body.entity);
    const table = getAdminTableName(entity);
    const supabaseServer = createSupabaseServerClient();

    if (body.action === "delete") {
      if (!body.id) {
        throw new Error("Record id is required.");
      }

      const { error } = await supabaseServer.from(table).delete().eq("id", body.id);
      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ ok: true });
    }

    const payload = normalizeAdminPayload(entity, body.payload ?? {});
    const recordId =
      typeof body.payload?.id === "string" && body.payload.id.trim()
        ? body.payload.id.trim()
        : null;

    if (recordId) {
      const { error } = await supabaseServer.from(table).update(payload).eq("id", recordId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabaseServer.from(table).insert(payload);
      if (error) {
        throw new Error(error.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save record." },
      { status: 400 },
    );
  }
}
