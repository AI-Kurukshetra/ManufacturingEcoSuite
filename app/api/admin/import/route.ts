import { NextResponse } from "next/server";

import { type AdminEntityKey } from "@/lib/admin-config";
import { hasAdminSession } from "@/lib/admin-auth";
import { assertAdminEntity, getAdminTableName, normalizeAdminPayload } from "@/lib/admin-server";
import { parseCsvText } from "@/lib/csv";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const importableEntities = new Set<AdminEntityKey>(["energy", "equipment"]);

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "Admin session expired." }, { status: 401 });
    }

    const body = (await request.json()) as {
      entity?: string;
      csvText?: string;
    };

    const entity = assertAdminEntity(body.entity);
    if (!importableEntities.has(entity)) {
      throw new Error("CSV import is not enabled for this dataset.");
    }

    const rows = parseCsvText(body.csvText ?? "");
    if (rows.length === 0) {
      throw new Error("The uploaded CSV does not contain any data rows.");
    }

    const payload = rows.map((row) => normalizeAdminPayload(entity, row));
    const table = getAdminTableName(entity);
    const supabaseServer = createSupabaseServerClient();
    const { error } = await supabaseServer.from(table).insert(payload);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, inserted: payload.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import CSV." },
      { status: 400 },
    );
  }
}
