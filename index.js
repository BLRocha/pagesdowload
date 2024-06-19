import { config } from "dotenv";
config();
const __dirname = import.meta.dirname;

import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { WritableStream } from "node:stream/web";

import express from "express";
import { URL } from "node:url";
import path from "node:path";

import { mimeTypesJson } from "./mime.js";

const DOWNLOAD_MODE = !!process.env.DOWNLOAD_MODE || false;
console.log("DOWNLOAD MODE:", DOWNLOAD_MODE);
const fileDownLoad = async (url) => {
  url = `${process.env.BASE_URL}${url}`;
  return new Promise(async (accept) => {
    const stntUrl = new URL(url);
    const filePath = stntUrl.pathname;
    const pathFolder = filePath.replace(/\/[A-Za-z0-9-]+\..*/g, "");

    try {
      mkdirSync(path.join(__dirname, "public", pathFolder), {
        recursive: true,
      });
    } catch (err) {
      //console.log("Error: ", err.message);
    }

    if (!existsSync(path.join(__dirname, "public", filePath))) {
      const response = await fetch(url, {
        credentials: "omit",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
          Accept: "image/avif,image/webp,*/*",
          "Accept-Language": "pt-BR",
        },
        referrer: "https://cdn.hypetech.games",
        method: "GET",
        mode: "cors",
      });
      const dwlWs = createWriteStream(path.join(__dirname, "public", filePath));
      const stream = new WritableStream({
        write(chk) {
          dwlWs.write(chk);
        },
      });

      await response.body.pipeTo(stream);
      return accept(true);
    }
  });
};

const app = express();

app.use(express.json());
//app.use(express.urlencoded({ urlencoded: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get(`${process.env.INDEX_PATH || ""}`, async (_, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (DOWNLOAD_MODE)
  app.get("/*?", async (req, res) => {
    const ext = path.extname(req.url);
    const ctt = mimeTypesJson[ext];
    await fileDownLoad(req.url);
    if (ctt) {
      res.setHeader("Content-Type", mimeTypesJson[ext]);
    }
    return res.sendFile(path.join(__dirname, "public", req.url));
  });

app.listen(3000, () => console.log("Server on 3000"));
