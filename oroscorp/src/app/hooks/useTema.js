"use client";

import { useEffect, useState } from "react";

export function useTema() {
  const [tema, setTema] = useState("dark");

  useEffect(() => {
    const salvo = localStorage.getItem("oroscorp_tema") || "dark";
    setTema(salvo);
    document.documentElement.setAttribute("data-theme", salvo);
  }, []);

  function alternarTema() {
    const proximo = tema === "dark" ? "light" : "dark";
    setTema(proximo);
    localStorage.setItem("oroscorp_tema", proximo);
    document.documentElement.setAttribute("data-theme", proximo);
  }

  return { tema, alternarTema };
}