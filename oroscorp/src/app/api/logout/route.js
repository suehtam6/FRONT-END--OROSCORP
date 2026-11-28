import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout realizado com sucesso." });

  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("usuario", "", { path: "/", maxAge: 0 });

  return res;
}