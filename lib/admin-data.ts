import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { modelFor, type RecordData } from "@/lib/admin-registry";
export interface DataDelegate {
  findMany(args?: object): Promise<RecordData[]>;
  findUnique(args: object): Promise<RecordData | null>;
  create(args: object): Promise<RecordData>;
  update(args: object): Promise<RecordData>;
  delete(args: object): Promise<RecordData>;
  count(args?: object): Promise<number>;
}
export function dataDelegate(name: string, client: Prisma.TransactionClient = db): DataDelegate {
  modelFor(name);
  const key = name[0].toLowerCase() + name.slice(1);
  return (client as unknown as Record<string, DataDelegate>)[key];
}
export function sanitized(row: RecordData | null) {
  if (!row) return null;
  const { passwordHash: _secret, ...data } = row;
  void _secret;
  return data;
}
