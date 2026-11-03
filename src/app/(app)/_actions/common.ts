"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dt, int, req, str } from "@/lib/forms";
import { assertCanAccess } from "./guard";

function links(fd: FormData) {
  return {
    contactId: str(fd, "contactId"),
    propertyId: str(fd, "propertyId"),
    dealId: str(fd, "dealId"),
  };
}

function back(fd: FormData) {
  const p = str(fd, "back");
  if (p) revalidatePath(p);
  revalidatePath("/");
}

export async function addActivity(fd: FormData) {
  const s = await requireUser();
  await db.activity.create({
    data: {
      type: req(fd, "type"),
      body: req(fd, "body"),
      occurredAt: dt(fd, "occurredAt") ?? new Date(),
      userId: s.userId,
      ...links(fd),
    },
  });
  // Valkvætt: búa til eftirfylgniverkefni um leið
  const followUp = str(fd, "followUp");
  if (followUp) {
    await db.task.create({
      data: { title: followUp, dueAt: dt(fd, "followUpAt"), userId: s.userId, ...links(fd) },
    });
  }
  back(fd);
}

export async function deleteActivity(id: string, backPath: string) {
  const s = await requireUser();
  const a = await db.activity.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, a.userId);
  await db.activity.delete({ where: { id } });
  revalidatePath(backPath);
}

export async function addTask(fd: FormData) {
  const s = await requireUser();
  await db.task.create({
    data: {
      title: req(fd, "title"),
      dueAt: dt(fd, "dueAt"),
      priority: int(fd, "priority") ?? 2,
      userId: s.userId,
      ...links(fd),
    },
  });
  back(fd);
  revalidatePath("/verkefni");
}

export async function toggleTask(id: string, backPath: string) {
  const s = await requireUser();
  const t = await db.task.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, t.userId);
  await db.task.update({ where: { id }, data: { done: !t.done, doneAt: t.done ? null : new Date() } });
  revalidatePath(backPath);
  revalidatePath("/");
  revalidatePath("/verkefni");
}

export async function deleteTask(id: string, backPath: string) {
  const s = await requireUser();
  const t = await db.task.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, t.userId);
  await db.task.delete({ where: { id } });
  revalidatePath(backPath);
  revalidatePath("/verkefni");
}
