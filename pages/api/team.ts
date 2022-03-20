import type { NextApiRequest, NextApiResponse } from "next";
import GUN from "gun";

type Data = {
  name: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const teamName: string = req.body.teamName;
  const db = GUN();

  res.status(200).json({ name: "John Doe" });
}
