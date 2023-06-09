import { NextRequest } from "next/server";

export const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
// const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;
const BASE_URL = "http://127.0.0.1:5000/";

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController();
  const authValue = req.headers.get("Authorization") ?? "";
  const openaiPath = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/openai/",
    "",
  );

  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  if (process.env.OPENAI_BASE_URL) {
    baseUrl = process.env.OPENAI_BASE_URL;
  }

  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);

  if (process.env.OPENAI_ORG_ID) {
    console.log("[Org ID]", process.env.OPENAI_ORG_ID);
  }

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10 * 60 * 1000);

  const fetchUrl = `${baseUrl}/${openaiPath}`;
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: authValue,
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }),
      ...(process.env.BUSINESS && {
        Business: process.env.BUSINESS,
      }),
      ...(process.env.SECRET && {
        Secret: process.env.SECRET,
      }),
    },
    cache: "no-store",
    method: req.method,
    body: req.body,
    signal: controller.signal,
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    if (res.status === 401) {
      // to prevent browser prompt for credentials
      res.headers.delete("www-authenticate");
    }

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function request(req: NextRequest) {
  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }
  const authValue = req.headers.get("Authorization") ?? "";
  const uri = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/",
    "",
  );
  // console.log(`url = ${baseUrl}/${uri}`)
  return fetch(`${baseUrl}/${uri}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authValue,
    },
    cache: "no-store",
    method: req.method,
    body: req.body,
  });
}

export interface Response<T> {
  code: number;

  message: string;

  data: T;
}
