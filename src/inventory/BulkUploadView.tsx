"use client";

import { useState } from "react";
import { useInventory } from "./lib";
import { Download, Upload, CheckCircle, AlertCircle } from "@/components/icons";

type Row = { name: string; category: string; unit: string; cost: string; price: string; stock: string; error?: string };

const TEMPLATE = "name,category,unit,cost_price,selling_price,starting_stock\nAnkara Gown,Fashion & Apparel,Pieces,9000,18250,10\n";

export default function BulkUploadView() {
  const { db, addProduct, logAudit } = useInventory();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [skipDupes, setSkipDupes] = useState(true);
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brikoh-product-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseFile = (file: File) => {
    if (file.size > 1_000_000) { alert("File too large. Max 1MB / 500 rows."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed: Row[] = [];
      lines.slice(1).forEach((line) => {
        const [name, category = db.categories[0], unit = db.units[0], cost, price, stock] = line.split(",").map((s) => s.trim());
        const err = !name ? "Missing product name"
          : !Number(price) || Number(price) <= 0 ? "Invalid selling price"
          : db.products.some((p) => p.name.toLowerCase() === name.toLowerCase()) ? "Duplicate product name"
          : undefined;
        parsed.push({ name: name ?? "", category, unit, cost, price, stock, error: err });
      });
      if (parsed.length > 500) { alert("Max 500 rows per file."); return; }
      setRows(parsed);
      setFileName(file.name);
      setStage("preview");
    };
    reader.readAsText(file);
  };

  const confirm = () => {
    let ok = 0, sk = 0;
    rows.forEach((r) => {
      if (r.error) { sk++; return; }
      if (skipDupes && db.products.some((p) => p.name.toLowerCase() === r.name.toLowerCase())) { sk++; return; }
      addProduct({ name: r.name, description: "", category: r.category || db.categories[0], unit: r.unit || db.units[0], costPrice: r.cost ? Number(r.cost) : null, sellingPrice: Number(r.price), discountPrice: null, threshold: 10, expiry: null, emoji: "📦", images: ["📦"], variants: [], status: "active" }, Number(r.stock) || 0);
      ok++;
    });
    setImported(ok);
    setSkipped(sk);
    setStage("done");
    logAudit("bulk_upload", `Imported ${ok} products, skipped ${sk}`);
  };

  const valid = rows.filter((r) => !r.error).length;
  const errors = rows.filter((r) => r.error);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Bulk upload products</h2>
        <p className="mt-1 text-sm text-muted">Download the template, fill it in, upload and preview before importing. Max 500 rows per file.</p>
      </div>

      {stage === "upload" && (
        <div className="rounded-3xl border-2 border-dashed border-ink/15 bg-white p-10 text-center">
          <Upload className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-4 font-display text-lg font-bold text-ink">Drop your CSV here</p>
          <p className="mt-1 text-sm text-muted">Accepts .csv and .xlsx files · max 500 rows</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <label className="cursor-pointer rounded-full bg-gradient-to-br from-brand-light to-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25">
              Choose file
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </label>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
              <Download className="h-4 w-4" /> Download template
            </button>
          </div>
        </div>
      )}

      {stage === "preview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-leaf/10 p-4 text-center"><p className="font-display text-2xl font-extrabold text-forest">{valid}</p><p className="text-xs font-semibold text-muted">Ready to import</p></div>
            <div className="rounded-2xl bg-red-50 p-4 text-center"><p className="font-display text-2xl font-extrabold text-red-500">{errors.length}</p><p className="text-xs font-semibold text-muted">With errors</p></div>
            <div className="rounded-2xl bg-cream p-4 text-center"><p className="font-display text-2xl font-extrabold text-ink">{rows.length}</p><p className="text-xs font-semibold text-muted">Total rows · {fileName}</p></div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm">
            <input type="checkbox" checked={skipDupes} onChange={(e) => setSkipDupes(e.target.checked)} className="h-4 w-4 accent-brand" />
            Skip rows with duplicate product names (recommended)
          </label>

          <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">#</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted">{r.category}</td>
                      <td className="px-4 py-2.5 text-muted">{r.price}</td>
                      <td className="px-4 py-2.5 text-muted">{r.stock}</td>
                      <td className="px-4 py-2.5">
                        {r.error ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500"><AlertCircle className="h-3 w-3" /> {r.error}</span> : <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2.5 py-1 text-[11px] font-bold text-leaf"><CheckCircle className="h-3 w-3" /> OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setStage("upload")} className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-brand">Upload another file</button>
            <button onClick={confirm} disabled={valid === 0} className="rounded-full bg-gradient-to-br from-brand-light to-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-50">
              Import {valid} valid product{valid === 1 ? "" : "s"}
            </button>
          </div>
        </>
      )}

      {stage === "done" && (
        <div className="flex flex-col items-center rounded-3xl border border-ink/5 bg-white p-12 text-center">
          <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-leaf/15 text-leaf"><CheckCircle className="h-8 w-8" /></span>
          <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">Import complete 🎉</h3>
          <p className="mt-2 text-sm text-muted">
            {imported} product{imported === 1 ? "" : "s"} imported{skipped > 0 ? ` · ${skipped} skipped (duplicates/errors)` : ""}. Opening stock was logged to history.
          </p>
          <button onClick={() => { setRows([]); setStage("upload"); setImported(0); setSkipped(0); }} className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white">Upload another file</button>
        </div>
      )}
    </div>
  );
}
