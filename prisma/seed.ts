// Býr til fyrsta stjórnanda. Með `--demo` er einnig sett inn sýnigögn til að prófa kerfið.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SALE_CHECKLIST, DEFAULT_RENT_CHECKLIST } from "../src/lib/constants";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.is").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "breyttu-mer";
  const name = process.env.ADMIN_NAME ?? "Stjórnandi";

  const admin = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`✓ Stjórnandi: ${email}`);

  if (!process.argv.includes("--demo")) return;
  if ((await db.contact.count()) > 0) {
    console.log("Gögn eru þegar til – sleppi sýnigögnum.");
    return;
  }

  const day = (n: number, h = 12) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    d.setUTCHours(h, 0, 0, 0);
    return d;
  };
  const o = { ownerId: admin.id };

  const seljandi = await db.contact.create({ data: { ...o, name: "Guðrún Jónsdóttir", phone: "8601234", email: "gudrun@example.is", roles: "SELLER", source: "Meðmæli" } });
  const seljandi2 = await db.contact.create({ data: { ...o, name: "Fasteignafélagið Hamar ehf.", phone: "5551234", email: "hamar@example.is", company: "Hamar ehf.", roles: "LANDLORD", source: "Fyrri viðskipti" } });
  const kaupandi = await db.contact.create({
    data: { ...o, name: "Sigurður Ólafsson", phone: "6905555", email: "siggi@example.is", roles: "BUYER", source: "Opið hús",
      searchActive: true, searchListing: "SALE", searchTypes: "APARTMENT", searchPostcodes: "105,107,101", searchMinPrice: 60_000_000, searchMaxPrice: 85_000_000, searchMinSize: 70, searchMinRooms: 3 },
  });
  await db.contact.create({
    data: { ...o, name: "Anna og Björn", phone: "7712345", email: "annabjorn@example.is", roles: "BUYER,SELLER", source: "Vefur",
      searchActive: true, searchListing: "SALE", searchTypes: "DETACHED,ROW,SEMI", searchPostcodes: "210,220,221", searchMaxPrice: 140_000_000, searchMinSize: 150, searchMinRooms: 5 },
  });
  const leigutaki = await db.contact.create({
    data: { ...o, name: "Kaffihúsið Bolli ehf.", phone: "8887766", email: "bolli@example.is", company: "Bolli ehf.", roles: "TENANT", source: "Vefur",
      searchActive: true, searchListing: "RENT", searchTypes: "COMMERCIAL", searchPostcodes: "101,105", searchMaxPrice: 900_000, searchMinSize: 80, searchMaxSize: 200 },
  });

  const ibud = await db.property.create({
    data: { agentId: admin.id, sellerId: seljandi.id, address: "Laugavegur 100", postcode: "105", city: "Reykjavík", type: "APARTMENT", listing: "SALE", status: "ACTIVE",
      price: 74_900_000, size: 92.4, rooms: 3, bedrooms: 2, bathrooms: 1, yearBuilt: 1956, fasteignamat: 68_500_000, brunabotamat: 41_200_000, features: "Endurnýjað eldhús 2021, suðursvalir, nálægt Hlemmi" },
  });
  const atvinnu = await db.property.create({
    data: { agentId: admin.id, sellerId: seljandi2.id, address: "Skólavörðustígur 12", postcode: "101", city: "Reykjavík", type: "COMMERCIAL", listing: "RENT", status: "ACTIVE",
      price: 750_000, size: 120, yearBuilt: 1930, features: "Jarðhæð, stórir gluggar að götu, hentar fyrir verslun eða veitingar" },
  });
  await db.property.create({
    data: { agentId: admin.id, address: "Hraunbrún 5", postcode: "220", city: "Hafnarfjörður", type: "DETACHED", listing: "SALE", status: "VALUATION", size: 186, rooms: 6, garage: true },
  });

  await db.deal.create({
    data: { agentId: admin.id, title: "Laugavegur 100", listing: "SALE", stage: "MARKETING", propertyId: ibud.id, sellerId: seljandi.id, value: 74_900_000, commissionPct: 1.95,
      expectedClose: day(45), checklist: { create: DEFAULT_SALE_CHECKLIST.map((label, order) => ({ label, order, done: order < 6 })) } },
  });
  await db.deal.create({
    data: { agentId: admin.id, title: "Skólavörðustígur 12 – leiga", listing: "RENT", stage: "OFFER", propertyId: atvinnu.id, sellerId: seljandi2.id, buyerId: leigutaki.id,
      value: 9_000_000, commissionFlat: 750_000, checklist: { create: DEFAULT_RENT_CHECKLIST.map((label, order) => ({ label, order, done: order < 3 })) } },
  });
  await db.deal.create({
    data: { agentId: admin.id, title: "Ármúli 4 – leiga (Tækniþjónustan)", listing: "RENT", stage: "CLOSED", sellerId: seljandi2.id, value: 6_600_000, commissionFlat: 550_000,
      leaseStart: day(-700), leaseEnd: day(120), leaseMonthlyRent: 550_000, leaseIndexed: true, leaseIndexBase: "VNV janúar 2025", leaseNoticeMonths: 6 },
  });
  await db.deal.create({ data: { agentId: admin.id, title: "Verðmat – Hraunbrún 5", listing: "SALE", stage: "VALUATION", commissionPct: 1.8, value: 135_000_000 } });

  const sh = await db.showing.create({ data: { propertyId: ibud.id, kind: "OPEN_HOUSE", startsAt: day(2, 17), endsAt: day(2, 18) } });
  await db.showing.create({ data: { propertyId: atvinnu.id, kind: "PRIVATE", startsAt: day(1, 10) } });
  await db.showingAttendee.create({ data: { showingId: sh.id, contactId: kaupandi.id, interest: 4, feedback: "Hrifinn af eldhúsinu" } });

  await db.task.createMany({
    data: [
      { userId: admin.id, title: "Hringja í Sigurð varðandi Laugaveg", dueAt: day(0, 15), priority: 1, contactId: kaupandi.id, propertyId: ibud.id },
      { userId: admin.id, title: "Sækja veðbókarvottorð", dueAt: day(1), propertyId: ibud.id },
      { userId: admin.id, title: "Senda verðmat á Hraunbrún", dueAt: day(-1), priority: 1 },
    ],
  });
  await db.activity.createMany({
    data: [
      { userId: admin.id, type: "CALL", body: "Ræddum ásett verð, sátt við 74,9 m.kr.", contactId: seljandi.id, propertyId: ibud.id, occurredAt: day(-3, 11) },
      { userId: admin.id, type: "EMAIL", body: "Sendi söluyfirlit til samþykktar", contactId: seljandi.id, occurredAt: day(-2, 9) },
    ],
  });
  console.log("✓ Sýnigögn sett inn");
}

main().finally(() => db.$disconnect());
