import { json } from "@remix-run/cloudflare";
import { PrismaClient } from "@prisma/client/edge";
import { useLoaderData } from "@remix-run/react";

import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import type { Log } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

interface AccelerateInfo {
  cacheStatus: "ttl" | "swr" | "miss" | "none";
  lastModified: Date;
  region: string;
  requestId: string;
  signature: string;
}

interface Env {
  DATABASE_URL: string;
  DIRECT_URL: string;
}

interface LoaderData {
  logs: Log[];
  info: AccelerateInfo | null;
}

export async function loader(props: LoaderFunctionArgs) {
  const env = props.context.env as Env;

  const prisma = new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
  }).$extends(withAccelerate());

  const logs = await prisma.log
    .findMany({
      cacheStrategy: { ttl: 60 },
    })
    .withAccelerateInfo();

  return json<LoaderData>({
    logs: logs.data,
    info: logs.info,
  });
}

export default function Index() {
  const props = useLoaderData<LoaderData>();

  return (
    <div className="max-w-5xl m-auto p-10">
      <h1 className="text-3xl font-bold w-4/5">
        Database access on the edge with Remix run, Cloudflare workers & Prisma
        accelerate
      </h1>

      <div className="pt-6">
        <h2 className="my-2 text-2xl">Query info:</h2>
        <div className="flex flex-col gap-2">
          <ul>
            Cache Status:
            {props.info?.cacheStatus}
          </ul>
          <ul>
            Last modified:
            {props.info?.lastModified}
          </ul>
          <ul>
            Region:
            {props.info?.region}
          </ul>
          <ul>
            RequestId:
            {props.info?.requestId}
          </ul>
          <ul>
            Signature:
            {props.info?.signature}
          </ul>
          <ul>
            Payload:
            {JSON.stringify(props.logs, null, 2)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};
