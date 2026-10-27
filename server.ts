import "dotenv/config";
import crypto from "crypto";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserRecord {
  id: number;
  username: string;
  passwordHash: string;
}

interface StoreRecord {
  id: number;
  name: string;
}

interface TagRecord {
  id: number;
  name: string;
  itemIds: number[];
}

interface ItemRecord {
  id: number;
  name: string;
  price: number;
  store_id: number;
}

interface TokenPayload {
  sub: string;
  jti: string;
  fresh: boolean;
  type: "access" | "refresh";
  is_admin: boolean;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev-only-change-me";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

function createToken(
  userId: number,
  fresh: boolean,
  type: "access" | "refresh"
): string {
  const payload: TokenPayload = {
    sub: String(userId),
    jti: crypto.randomUUID(),
    fresh,
    type,
    is_admin: userId === 1,
    exp: Date.now() + (type === "access" ? 3600_000 : 86400_000 * 7),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [encoded, signature] = parts;
  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encoded)
    .digest("base64url");
  if (signature !== expected) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as TokenPayload;
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const users: UserRecord[] = [
  {
    id: 1,
    username: "admin",
    passwordHash: hashPassword("admin123"),
  },
  {
    id: 2,
    username: "operator",
    passwordHash: hashPassword("operator123"),
  },
];

const stores: StoreRecord[] = [
  { id: 1, name: "Flagship Mercer St" },
  { id: 2, name: "Nordic Design Hub" },
  { id: 3, name: " Kyoto Logistics Annex" },
];

stores[2].name = "Kyoto Logistics Annex";

const items: ItemRecord[] = [
  { id: 1, name: "Aeron Task Chair", price: 1295.0, store_id: 1 },
  { id: 2, name: "Walnut Standing Desk", price: 890.5, store_id: 1 },
  { id: 3, name: "Anodized Desk Lamp", price: 245.0, store_id: 2 },
  { id: 4, name: "Acoustic Felt Partition", price: 410.0, store_id: 2 },
  { id: 5, name: "Modular Shelving Unit", price: 640.0, store_id: 3 },
];

const tags: TagRecord[] = [
  { id: 1, name: "Ergonomics", itemIds: [1, 2] },
  { id: 2, name: "Lighting", itemIds: [3] },
  { id: 3, name: "Architectural", itemIds: [2, 4, 5] },
  { id: 4, name: "Clearance", itemIds: [] },
];

const blocklist = new Set<string>();

let nextUserId = 3;
let nextStoreId = 4;
let nextItemId = 6;
let nextTagId = 5;

function serializeStoreBasic(store: StoreRecord) {
  return {
    id: store.id,
    name: store.name,
  };
}

function serializeTagBasic(tag: TagRecord) {
  return {
    id: tag.id,
    name: tag.name,
  };
}

function serializeItem(item: ItemRecord) {
  const store = stores.find((s) => s.id === item.store_id);
  const itemTags = tags
    .filter((t) => t.itemIds.includes(item.id))
    .map(serializeTagBasic);
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    store: store
      ? serializeStoreBasic(store)
      : { id: item.store_id, name: "Unknown" },
    tags: itemTags,
  };
}

function serializeStore(store: StoreRecord) {
  const storeItems = items
    .filter((i) => i.store_id === store.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      tags: tags
        .filter((t) => t.itemIds.includes(item.id))
        .map(serializeTagBasic),
    }));
  return {
    id: store.id,
    name: store.name,
    items: storeItems,
  };
}

function serializeTag(tag: TagRecord) {
  const tagItems = items
    .filter((i) => tag.itemIds.includes(i.id))
    .map((item) => {
      const store = stores.find((s) => s.id === item.store_id);
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        store: store
          ? serializeStoreBasic(store)
          : { id: item.store_id, name: "Unknown" },
      };
    });
  return {
    id: tag.id,
    name: tag.name,
    items: tagItems,
  };
}

interface AuthenticatedRequest extends Request {
  jwtPayload?: TokenPayload;
}

function requireJwt(
  options: { fresh?: boolean; refresh?: boolean } = {}
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        description: "Request does not contain an access token.",
        error: "authorization_required",
      });
      return;
    }
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        message: "Signature verification failed.",
        error: "invalid_token",
      });
      return;
    }
    if (blocklist.has(payload.jti)) {
      res.status(401).json({
        description: "The token has been revoked.",
        error: "token_revoked",
      });
      return;
    }
    if (options.refresh && payload.type !== "refresh") {
      res.status(401).json({
        message: "Refresh token required.",
        error: "invalid_token",
      });
      return;
    }
    if (!options.refresh && payload.type !== "access") {
      res.status(401).json({
        message: "Access token required.",
        error: "invalid_token",
      });
      return;
    }
    if (options.fresh && !payload.fresh) {
      res.status(401).json({
        description: "The token is not fresh.",
        error: "fresh_token_required",
      });
      return;
    }
    req.jwtPayload = payload;
    next();
  };
}

async function startServer(): Promise<void> {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));

  app.post("/register", (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      res.status(422).json({
        code: 422,
        status: "Unprocessable Entity",
        message: "Username and password are required.",
      });
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "A user with that username already exists.",
      });
      return;
    }
    const newUser: UserRecord = {
      id: nextUserId++,
      username: username.trim(),
      passwordHash: hashPassword(password),
    };
    users.push(newUser);
    res.status(201).json({ message: "User created successfully." });
  });

  app.post("/login", (req: Request, res: Response) => {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };
    const user = users.find(
      (u) => u.username.toLowerCase() === (username || "").toLowerCase()
    );
    if (!user || !password || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({
        code: 401,
        status: "Unauthorized",
        message: "Invalid credentials.",
      });
      return;
    }
    const accessToken = createToken(user.id, true, "access");
    const refreshToken = createToken(user.id, false, "refresh");
    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  });

  app.post(
    "/logout",
    requireJwt(),
    (req: AuthenticatedRequest, res: Response) => {
      if (req.jwtPayload) {
        blocklist.add(req.jwtPayload.jti);
      }
      res.status(200).json({ message: "Successfully logged out" });
    }
  );

  app.post(
    "/refresh",
    requireJwt({ refresh: true }),
    (req: AuthenticatedRequest, res: Response) => {
      const userId = Number(req.jwtPayload?.sub || 0);
      const newToken = createToken(userId, false, "access");
      res.status(200).json({ access_token: newToken });
    }
  );

  app.get("/user", (_req: Request, res: Response) => {
    res.status(200).json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
      }))
    );
  });

  app.get("/user/:userId", (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "User not found.",
      });
      return;
    }
    res.status(200).json({ id: user.id, username: user.username });
  });

  app.delete("/user/:userId", (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "User not found.",
      });
      return;
    }
    users.splice(index, 1);
    res.status(200).json({ message: "User deleted." });
  });

  app.get("/store", (_req: Request, res: Response) => {
    res.status(200).json(stores.map(serializeStore));
  });

  app.get("/store/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name);
    const store = stores.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (!store) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Store not found.",
      });
      return;
    }
    res.status(200).json(serializeStore(store));
  });

  app.post("/store/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name).trim();
    if (stores.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: `A store with name '${name}' already exists.`,
      });
      return;
    }
    const store: StoreRecord = { id: nextStoreId++, name };
    stores.push(store);
    res.status(201).json(serializeStore(store));
  });

  app.delete("/store/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name);
    const index = stores.findIndex(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (index === -1) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Store not found.",
      });
      return;
    }
    const removed = stores[index];
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].store_id === removed.id) {
        items.splice(i, 1);
      }
    }
    stores.splice(index, 1);
    res.status(200).json({ message: "Store deleted" });
  });

  app.get("/item", requireJwt(), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(items.map(serializeItem));
  });

  app.get(
    "/item/:name",
    requireJwt(),
    (req: AuthenticatedRequest, res: Response) => {
      const name = decodeURIComponent(req.params.name);
      const item = items.find(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );
      if (!item) {
        res.status(404).json({
          code: 404,
          status: "Not Found",
          message: "Item not found",
        });
        return;
      }
      res.status(200).json(serializeItem(item));
    }
  );

  app.post(
    "/item/:name",
    requireJwt({ fresh: true }),
    (req: AuthenticatedRequest, res: Response) => {
      const name = decodeURIComponent(req.params.name).trim();
      if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
        res.status(400).json({
          code: 400,
          status: "Bad Request",
          message: `An item with name '${name}' already exists.`,
        });
        return;
      }
      const { price, store_id } = req.body as {
        price?: number;
        store_id?: number;
      };
      if (typeof price !== "number" || typeof store_id !== "number") {
        res.status(422).json({
          code: 422,
          status: "Unprocessable Entity",
          message: "Valid price and store_id are required.",
        });
        return;
      }
      const newItem: ItemRecord = {
        id: nextItemId++,
        name,
        price,
        store_id,
      };
      items.push(newItem);
      res.status(201).json(serializeItem(newItem));
    }
  );

  app.put("/item/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name).trim();
    const { price, store_id } = req.body as {
      price?: number;
      store_id?: number;
    };
    if (typeof price !== "number") {
      res.status(422).json({
        code: 422,
        status: "Unprocessable Entity",
        message: "Valid price is required.",
      });
      return;
    }
    let item = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (item) {
      item.price = price;
      if (typeof store_id === "number") {
        item.store_id = store_id;
      }
    } else {
      item = {
        id: nextItemId++,
        name,
        price,
        store_id: typeof store_id === "number" ? store_id : stores[0]?.id || 1,
      };
      items.push(item);
    }
    res.status(200).json(serializeItem(item));
  });

  app.delete(
    "/item/:name",
    requireJwt(),
    (req: AuthenticatedRequest, res: Response) => {
      if (!req.jwtPayload?.is_admin) {
        res.status(401).json({
          code: 401,
          status: "Unauthorized",
          message: "Admin privilege required.",
        });
        return;
      }
      const name = decodeURIComponent(req.params.name);
      const index = items.findIndex(
        (i) => i.name.toLowerCase() === name.toLowerCase()
      );
      if (index === -1) {
        res.status(404).json({
          code: 404,
          status: "Not Found",
          message: "Item not found.",
        });
        return;
      }
      const removed = items[index];
      tags.forEach((t) => {
        t.itemIds = t.itemIds.filter((id) => id !== removed.id);
      });
      items.splice(index, 1);
      res.status(200).json({ message: "Item deleted." });
    }
  );

  app.get("/tag", (_req: Request, res: Response) => {
    res.status(200).json(tags.map(serializeTag));
  });

  app.get("/tag/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name);
    const tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Tag not found.",
      });
      return;
    }
    res.status(200).json(serializeTag(tag));
  });

  app.post("/tag/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name).trim();
    const { item_id } = (req.body || {}) as { item_id?: number };
    if (typeof item_id !== "number") {
      res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Missing required field 'item_id' in JSON body.",
      });
      return;
    }
    const item = items.find((i) => i.id === item_id);
    if (!item) {
      res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "An item with this item_id doesn't exist.",
      });
      return;
    }
    let tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      tag = { id: nextTagId++, name, itemIds: [] };
      tags.push(tag);
    }
    if (!tag.itemIds.includes(item.id)) {
      tag.itemIds.push(item.id);
    }
    res.status(201).json(serializeTag(tag));
  });

  app.delete("/tag/:name", (req: Request, res: Response) => {
    const name = decodeURIComponent(req.params.name);
    const tagIndex = tags.findIndex(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (tagIndex === -1) {
      res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "Tag not found.",
      });
      return;
    }
    const tag = tags[tagIndex];
    const body = (req.body || {}) as { item_id?: number };
    if (typeof body.item_id === "number") {
      const item = items.find((i) => i.id === body.item_id);
      if (!item || !tag.itemIds.includes(item.id)) {
        res.status(400).json({
          code: 400,
          status: "Bad Request",
          message: "Item is not associated with this tag.",
        });
        return;
      }
      tag.itemIds = tag.itemIds.filter((id) => id !== item.id);
      res.status(200).json({
        message: "Item removed from tag",
        item: serializeItem(item),
        tag: serializeTag(tag),
      });
      return;
    }
    if (tag.itemIds.length === 0) {
      tags.splice(tagIndex, 1);
      res.status(200).json({ message: "Tag deleted." });
      return;
    }
    res.status(400).json({
      code: 400,
      status: "Bad Request",
      message:
        "Could not delete tag. Make sure tag is not associated with any items, then try again.",
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
