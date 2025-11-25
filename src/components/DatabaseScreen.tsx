import { useEffect, useState } from "react";
import { api } from "../api/http";
import { Button } from "./ui/button";

type SchemaResponse = Record<string, string[]>;

export function DatabaseScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api.API_URL}/debug/tables`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error);
        const data = await res.json();
        const map: SchemaResponse = {};
        (data?.tables || []).forEach((t: string) => { map[t] = (data?.columns?.[t] || []); });
        setSchema(map);
        (data?.counts && (window as any).DB_COUNTS !== undefined) && ((window as any).DB_COUNTS = data.counts);
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar schema");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#800000] pb-24">
      <div className="bg-gradient-to-b from-[#4A0D12] to-[#6B0F12] pt-12 pb-8 px-6 text-center">
        <h1 className="text-[#F7EFE6] text-2xl">Banco de Dados</h1>
        <p className="text-[#CDA15D] mt-1">Tabelas e colunas atuais</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={onBack} className="bg-[#6B0F12] hover:bg-[#4A0D12] text-white">Voltar</Button>
        </div>
      </div>

      <div className="px-6 mt-[-2rem]">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {loading && <div className="text-[#6B6B6B]">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && schema && (
            <div className="space-y-6">
              {Object.entries(schema).map(([table, cols]) => (
                <div key={table} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#6B0F12] text-lg">{table}</h3>
                    <span className="text-xs text-[#6B6B6B]">{cols.length} colunas{(window as any).DB_COUNTS?.[table] != null ? ` · ${((window as any).DB_COUNTS?.[table])} registros` : ''}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cols.map((c) => (
                      <span key={c} className="px-2 py-1 bg-[#F7EFE6] text-[#4C1C1C] rounded-md text-xs border border-[#CDA15D]/40">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
