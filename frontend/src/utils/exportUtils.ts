import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (filename: string, headers: string[], data: any[][]) => {
  const csvContent = [
    headers.join(","),
    ...data.map(row => row.map(item => `"${String(item ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (filename: string, title: string, headers: string[], data: any[][]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: data,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] }, // Primary blue color matching Tailwind bg-blue-500
  });

  doc.save(`${filename}.pdf`);
};
