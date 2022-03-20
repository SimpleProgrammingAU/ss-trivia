import type { NextApiRequest, NextApiResponse } from "next";
import GUN from "gun";

type Data = {
  error?: String;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const db = GUN();
  const { method, body } = req;

  switch (method) {
    case "GET":
      db.get("answers").once;
    case "POST":
      db.get("answers").put(body.answer, (ack) => {
        if ("err" in ack)
          res.status(500).json({ error: "Something went wrong posting your answer to the server. Please contact admin." });
      });
    default:
      res.status(400).json({ error: "Bad request. Answers endpoint only accepts GET and POST." });
  }

  res.status(500).json({ error: "Unknown error occurred. Please contact the administrator." });
}
