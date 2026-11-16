import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../src/db", () => ({ pool: { query } }));

import app from "../src/app";

process.env.JWT_SECRET = "test-secret";

const token = jwt.sign({ id: "user-1", role: "user" }, process.env.JWT_SECRET);

describe("POST /api/auth/register validation", () => {
  beforeEach(() => query.mockReset());

  it("rejects missing registration fields", async () => {
    const response = await request(app).post("/api/auth/register").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Izpolnite vsa polja.");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      displayName: "Ana", email: "not-an-email", password: "password1", passwordConfirm: "password1",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Epoštni naslov ni veljaven.");
  });

  it("rejects a password shorter than eight characters", async () => {
    const response = await request(app).post("/api/auth/register").send({
      displayName: "Ana", email: "ana@example.com", password: "short", passwordConfirm: "short",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Geslo mora imeti vsaj 8 znakov.");
  });

  it("rejects passwords that do not match", async () => {
    const response = await request(app).post("/api/auth/register").send({
      displayName: "Ana", email: "ana@example.com", password: "password1", passwordConfirm: "password2",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Gesli se ne ujemata.");
  });

  it("returns unauthorized for an unknown login", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com", password: "password1",
    });
    expect(response.status).toBe(401);
  });
});

describe("Event API validation", () => {
  it("returns 404 for an invalid event UUID", async () => {
    const response = await request(app).get("/api/events/not-a-uuid");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Dogodek ne obstaja.");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects creation when event fields are missing", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Cookie", `token=${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Izpolnite vsa polja.");
    expect(query).not.toHaveBeenCalled();
  });

  it("requires authentication to create an event", async () => {
    const response = await request(app).post("/api/events").send({});
    expect(response.status).toBe(401);
  });

  it("rejects an event that starts in the past", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Cookie", `token=${token}`)
      .send(validEvent({ startsAt: "2020-01-01T10:00:00.000Z", endsAt: "2020-01-01T11:00:00.000Z" }));
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Začetek dogodka ne sme biti v preteklosti.");
  });

  it("rejects an event whose end is before its start", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Cookie", `token=${token}`)
      .send(validEvent({ startsAt: "2035-01-01T12:00:00.000Z", endsAt: "2035-01-01T11:00:00.000Z" }));
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Konec dogodka mora biti po začetku.");
  });

  it("rejects a capacity below one", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Cookie", `token=${token}`)
      .send(validEvent({ capacity: -1 }));
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Število udeležencev mora biti vsaj 1.");
  });

  it("rejects an unsupported event difficulty", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Cookie", `token=${token}`)
      .send(validEvent({ difficulty: "nemogoče" }));
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Neveljavna težavnost.");
  });
});

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    title: "Pohod", description: "Kratek pohod", categoryId: "category-1",
    locationName: "Ljubljana", region: "Osrednjeslovenska",
    startsAt: "2035-01-01T10:00:00.000Z", endsAt: "2035-01-01T12:00:00.000Z",
    difficulty: "lahko", capacity: 10, ...overrides,
  };
}
