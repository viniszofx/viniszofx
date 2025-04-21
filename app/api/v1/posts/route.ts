import { NextResponse } from "next/server";

const posts = [
  { id: 1, title: "Post 1", content: "Content of Post 1" },
  { id: 2, title: "Post 2", content: "Content of Post 2" },
  { id: 3, title: "Post 3", content: "Content of Post 3" },
];

export async function GET(request: Request) {
  return NextResponse.json(posts);
}
