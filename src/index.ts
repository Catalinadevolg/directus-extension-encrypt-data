import { defineHook } from "@directus/extensions-sdk";
import { createHash, createCipheriv, createDecipheriv } from "crypto";

interface I {
  index: number;
  field: string;
}

export default defineHook(
  ({ filter, action, init }, { env, services, getSchema }) => {
    const totalEncryptionFields: { [key: string]: string[] } = {};
    const encryptedFieldNameStart = env.DE_CRYPTO_FIELD_START ?? "encrypted_";
    const isDecrypted = env.DE_IS_DECRYPTED ?? "true";
    const encryptionMethod = "AES-256-CBC";

    init("app.after", async () => {
      const { ItemsService } = services;
      try {
        const itemService = new ItemsService("directus_fields", {
          schema: await getSchema(),
        });

        const items = await itemService.readByQuery({
          filter: {
            field: {
              _starts_with: encryptedFieldNameStart,
            },
          },
        });

        for (const item of items) {
          if (!totalEncryptionFields[item.collection])
            totalEncryptionFields[item.collection] = [];

          totalEncryptionFields[item.collection]?.push(item.field);
        }
      } catch (err) {
        console.log(err);
      }
    });

    filter("items.create", async (payload: Record<string, any>, meta) => {
      const { collection } = meta;

      if (
        totalEncryptionFields[collection] &&
        totalEncryptionFields[collection].length
      ) {
        totalEncryptionFields[collection].forEach((f) => {
          if (payload[f] && payload[f].length > 0) {
            payload[f] = encryptString(payload[f], encryptionMethod);
          }
        });
      }

      return payload;
    });

    filter("items.update", async (payload: Record<string, any>, meta) => {
      const { collection } = meta;

      if (
        totalEncryptionFields[collection] &&
        totalEncryptionFields[collection].length
      ) {
        totalEncryptionFields[collection].forEach((f) => {
          if (payload[f] && payload[f].length > 0) {
            payload[f] = encryptString(payload[f], encryptionMethod);
          }
        });
      }

      return payload;
    });

    action("items.read", async ({ payload, collection }) => {
      if (isDecrypted !== "true") return;

      const collectionWithEncryptedFields = totalEncryptionFields[collection];

      if (
        !collectionWithEncryptedFields ||
        !collectionWithEncryptedFields.length
      )
        return payload;

      const items = payload as Record<string, any>[];

      const encryptedFieldsInPayload: I[] = [];

      items.forEach((i, idx) => {
        const fields = collectionWithEncryptedFields.filter((f) =>
          Object.keys(i).includes(f)
        );

        const fieldsWithItemIdx = fields.map<I>((f) => ({
          index: idx,
          field: f,
        }));

        encryptedFieldsInPayload.push(...fieldsWithItemIdx);
      });

      if (!encryptedFieldsInPayload.length) return payload;

      encryptedFieldsInPayload.forEach((f) => {
        const value = payload[f.index][f.field];

        if (value !== null && value.length) {
          payload[f.index][f.field] = decryptString(value, encryptionMethod);
        }
      });

      return payload;
    });
  }
);

function encryptString(text: string, encryptionMethod: string): string {
  const secretKey = "fd85b494-aaaa";
  const secretIv = "smslt";
  const secret = createHash("sha512")
    .update(secretKey, "utf-8")
    .digest("hex")
    .substring(0, 32);
  const iv = createHash("sha512")
    .update(secretIv, "utf-8")
    .digest("hex")
    .substring(0, 16);

  const encryptor = createCipheriv(encryptionMethod, secret, iv);
  const aes_encrypted =
    encryptor.update(text, "utf8", "base64") + encryptor.final("base64");

  return `${Buffer.from(aes_encrypted).toString("base64")}:${secret}:${iv}`;
}

function decryptString(value: string, encryptionMethod: string) {
  const [encryptedString, secret, iv] = value.split(":");

  const buff = Buffer.from(encryptedString as string, "base64");
  const string = buff.toString("utf-8");
  const decryptor = createDecipheriv(
    encryptionMethod,
    secret as string,
    iv as string
  );

  return decryptor.update(string, "base64", "utf8") + decryptor.final("utf8");
}
