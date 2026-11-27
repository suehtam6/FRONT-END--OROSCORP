import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

async function carregarImagemBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPdfOcorrencia({
  ocorrencia,
  idFormatado,
  data,
  hora,
  infos,
  listaEpis,
  nomeResponsavel,
  emailResponsavel,
  porcentagemIA,
  urlEvidencia,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 15;

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, larguraPagina, 32, "F");

  doc.setFillColor(255, 149, 0);
  doc.rect(0, 0, larguraPagina, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("OROSCORP · RELATÓRIO DE OCORRÊNCIA", margem, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(180, 185, 192);
  doc.text(`Registro #${idFormatado}  |  Emitido em ${new Date().toLocaleString("pt-BR")}`, margem, 23);

  const statusTexto = String(ocorrencia.Status_ocorrencia || "ABERTA").toUpperCase();
  doc.setFillColor(255, 149, 0);
  doc.roundedRect(larguraPagina - margem - 36, 10, 36, 11, 2, 2, "F");
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(statusTexto, larguraPagina - margem - 18, 17, { align: "center" });

  let y = 42;

  doc.setTextColor(224, 106, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("1. INFORMAÇÕES DA OCORRÊNCIA", margem, y);
  y += 4;

  const linhasTabela = [
    ["Origem", ocorrencia.origem_ocorrencia || "-"],
    ["Prioridade", ocorrencia.prioridade_ocorrencia || "-"],
    ...infos.map((i) => [i.rotulo, String(i.valor)]),
  ];

  if (listaEpis.length > 1) {
    linhasTabela.push([
      "EPIs Vinculados",
      listaEpis.map((e) => `${e.nome}${e.cor ? ` (${e.cor})` : ""}`).join(", "),
    ]);
  }

  if (porcentagemIA !== null) {
    linhasTabela.push(["Confiança da IA", `${porcentagemIA}%`]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: 3.5,
      textColor: [30, 34, 40],
      lineColor: [220, 224, 230],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [245, 247, 250], cellWidth: 52 },
      1: { fillColor: [255, 255, 255] },
    },
    body: linhasTabela,
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(224, 106, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("2. FUNCIONÁRIO E RESPONSÁVEL", margem, y);
  y += 4;

  const funcTexto = ocorrencia.ID_funcionario
    ? `${ocorrencia.Nome_funcionario} (Mat. ${String(ocorrencia.ID_funcionario).padStart(5, "0")})${
        ocorrencia.Cargo_funcionario ? ` · ${ocorrencia.Cargo_funcionario}` : ""
      }`
    : "Não identificado";

  const respTexto = nomeResponsavel
    ? `${nomeResponsavel}${emailResponsavel ? ` (${emailResponsavel})` : ""}`
    : "Não atribuído";

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: 3.5,
      textColor: [30, 34, 40],
      lineColor: [220, 224, 230],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [245, 247, 250], cellWidth: 52 },
    },
    body: [
      ["Funcionário", funcTexto],
      ["CPF / E-mail", [ocorrencia.CPF_funcionario, ocorrencia.Email_funcionario].filter(Boolean).join(" · ") || "-"],
      ["Responsável", respTexto],
    ],
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setTextColor(224, 106, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("3. DESCRIÇÃO DETALHADA", margem, y);
  y += 5;

  const descricao = ocorrencia.Descricao_Ocorrencia || "Sem descrição registrada.";
  const linhasDesc = doc.splitTextToSize(descricao, larguraPagina - margem * 2 - 6);
  const alturaBoxDesc = linhasDesc.length * 5 + 6;

  if (y + alturaBoxDesc > alturaPagina - 20) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(220, 224, 230);
  doc.roundedRect(margem, y, larguraPagina - margem * 2, alturaBoxDesc, 2, 2, "FD");

  doc.setTextColor(40, 44, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(linhasDesc, margem + 3, y + 5.5);

  y += alturaBoxDesc + 10;

  if (urlEvidencia) {
    const imgBase64 = await carregarImagemBase64(urlEvidencia);
    if (imgBase64) {
      if (y + 85 > alturaPagina - 18) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(224, 106, 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("4. EVIDÊNCIA CAPTURADA", margem, y);
      y += 4;

      const props = doc.getImageProperties(imgBase64);
      const maxLargura = larguraPagina - margem * 2;
      const maxAltura = 85;
      const ratio = Math.min(maxLargura / props.width, maxAltura / props.height);
      const imgW = props.width * ratio;
      const imgH = props.height * ratio;

      doc.addImage(imgBase64, "JPEG", margem, y, imgW, imgH);
    }
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 152);
    doc.text(
      `Oroscorp · Monitoramento de Segurança do Trabalho (EPI) — Página ${i} de ${totalPaginas}`,
      larguraPagina / 2,
      alturaPagina - 8,
      { align: "center" }
    );
  }

  doc.save(`ocorrencia-${idFormatado}.pdf`);
}