"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Sistema = "PRICE" | "SAC";

type TipoFinanciamento = "IMOVEL" | "VEICULO";

type Parcela = {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function calcularTabelaPrice(params: {
  principal: number;
  i: number;
  n: number;
}): Parcela[] {
  const { principal, i, n } = params;

  const tabela: Parcela[] = [];
  if (principal <= 0 || i <= 0 || n <= 0) return tabela;

  const fator = Math.pow(1 + i, n);
  const pmt = (principal * i * fator) / (fator - 1);

  let saldo = principal;
  for (let mes = 1; mes <= n; mes += 1) {
    const juros = saldo * i;
    const amortizacao = pmt - juros;
    saldo = Math.max(0, saldo - amortizacao);
    tabela.push({
      mes,
      parcela: pmt,
      juros,
      amortizacao,
      saldoDevedor: saldo,
    });
  }

  return tabela;
}

function calcularTabelaSac(params: {
  principal: number;
  i: number;
  n: number;
}): Parcela[] {
  const { principal, i, n } = params;

  const tabela: Parcela[] = [];
  if (principal <= 0 || i <= 0 || n <= 0) return tabela;

  const amortizacaoConstante = principal / n;
  let saldo = principal;

  for (let mes = 1; mes <= n; mes += 1) {
    const juros = saldo * i;
    const parcela = amortizacaoConstante + juros;
    saldo = Math.max(0, saldo - amortizacaoConstante);
    tabela.push({
      mes,
      parcela,
      juros,
      amortizacao: amortizacaoConstante,
      saldoDevedor: saldo,
    });
  }

  return tabela;
}

export default function Home() {
  const [tipo, setTipo] = useState<TipoFinanciamento>("IMOVEL");
  const [sistema, setSistema] = useState<Sistema>("PRICE");
  const [valorBem, setValorBem] = useState("300000");
  const [entrada, setEntrada] = useState("60000");
  const [taxaMensal, setTaxaMensal] = useState("1");
  const [prazoMeses, setPrazoMeses] = useState("360");
  const [tabela, setTabela] = useState<Parcela[]>([]);

  const principal = useMemo(() => {
    return Math.max(0, parseNumber(valorBem) - parseNumber(entrada));
  }, [valorBem, entrada]);

  const resumo = useMemo(() => {
    if (tabela.length === 0) {
      return {
        parcelaInicial: 0,
        parcelaFinal: 0,
        totalPago: 0,
        totalJuros: 0,
      };
    }

    const totalPago = tabela.reduce((acc, p) => acc + p.parcela, 0);
    const totalJuros = tabela.reduce((acc, p) => acc + p.juros, 0);

    return {
      parcelaInicial: tabela[0]?.parcela ?? 0,
      parcelaFinal: tabela[tabela.length - 1]?.parcela ?? 0,
      totalPago,
      totalJuros,
    };
  }, [tabela]);

  function calcular(): void {
    const i = parseNumber(taxaMensal) / 100;
    const n = Math.trunc(parseNumber(prazoMeses));

    if (principal <= 0 || i <= 0 || n <= 0) {
      window.alert(
        "Preencha valor do bem, entrada, taxa mensal e prazo com valores válidos."
      );
      return;
    }

    const novaTabela =
      sistema === "PRICE"
        ? calcularTabelaPrice({ principal, i, n })
        : calcularTabelaSac({ principal, i, n });
    setTabela(novaTabela);
  }

  function aplicarPreset(novoTipo: TipoFinanciamento): void {
    setTipo(novoTipo);
    setTabela([]);

    if (novoTipo === "IMOVEL") {
      setValorBem("300000");
      setEntrada("60000");
      setTaxaMensal("1");
      setPrazoMeses("360");
      return;
    }

    setValorBem("80000");
    setEntrada("10000");
    setTaxaMensal("1.5");
    setPrazoMeses("60");
  }

  const tabelaPreview = tabela.slice(0, 24);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Simulador de Financiamento
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-zinc-700">
            Compare os sistemas <strong>PRICE</strong> e <strong>SAC</strong>, veja o
            valor das parcelas, o total pago e a evolução do saldo devedor.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">Dados do financiamento</h2>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Tipo</span>
                <select
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  value={tipo}
                  onChange={(e) => aplicarPreset(e.target.value as TipoFinanciamento)}
                >
                  <option value="IMOVEL">Imóvel</option>
                  <option value="VEICULO">Veículo</option>
                </select>
                <span className="text-xs text-zinc-500">
                  Dica: Imóvel costuma usar prazos longos (ex: 360 meses). Veículo costuma
                  variar entre 12 e 72 meses.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Sistema</span>
                <select
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  value={sistema}
                  onChange={(e) => setSistema(e.target.value as Sistema)}
                >
                  <option value="PRICE">PRICE (parcelas fixas)</option>
                  <option value="SAC">SAC (amortização constante)</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Valor do bem (R$)</span>
                <input
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  type="number"
                  min={0}
                  step={0.01}
                  value={valorBem}
                  onChange={(e) => setValorBem(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Entrada (R$)</span>
                <input
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  type="number"
                  min={0}
                  step={0.01}
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                />
              </label>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <strong>Valor financiado:</strong> {formatarMoeda(principal)}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Taxa mensal (%)</span>
                <input
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  type="number"
                  min={0}
                  step={0.01}
                  value={taxaMensal}
                  onChange={(e) => setTaxaMensal(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Prazo (meses)</span>
                <input
                  className="h-12 rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  type="number"
                  min={1}
                  step={1}
                  value={prazoMeses}
                  onChange={(e) => setPrazoMeses(e.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={calcular}
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-sky-600 px-5 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                Simular
              </button>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Resumo</h2>

              {tabela.length === 0 ? (
                <p className="mt-3 text-zinc-700">
                  Preencha os dados e clique em <strong>Simular</strong>.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-sky-50 p-4">
                    <p className="text-sm text-zinc-700">Parcela inicial</p>
                    <p className="mt-1 text-xl font-bold text-sky-700">
                      {formatarMoeda(resumo.parcelaInicial)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-4">
                    <p className="text-sm text-zinc-700">Parcela final</p>
                    <p className="mt-1 text-xl font-bold text-indigo-700">
                      {formatarMoeda(resumo.parcelaFinal)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-zinc-700">Total em juros</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {formatarMoeda(resumo.totalJuros)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-4">
                    <p className="text-sm text-zinc-700">Total pago</p>
                    <p className="mt-1 text-xl font-bold text-violet-700">
                      {formatarMoeda(resumo.totalPago)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {tabela.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Evolução do saldo devedor
                </h2>
                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tabela} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                      <Tooltip
                        formatter={(value: unknown) => {
                          if (typeof value === "number") return formatarMoeda(value);
                          return String(value ?? "");
                        }}
                        labelFormatter={(label: unknown) => `Mês ${String(label ?? "")}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="saldoDevedor"
                        name="Saldo devedor"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        </div>

        {tabela.length > 0 && (
          <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Tabela (prévia)</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Mostrando os primeiros 24 meses. (Depois a gente pode adicionar paginação.)
                </p>
              </div>
              <p className="text-sm text-zinc-600">
                Sistema: <strong>{sistema}</strong>
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-zinc-700">
                    <th className="border-b border-zinc-200 py-3 pr-4">Mês</th>
                    <th className="border-b border-zinc-200 py-3 pr-4">Parcela</th>
                    <th className="border-b border-zinc-200 py-3 pr-4">Juros</th>
                    <th className="border-b border-zinc-200 py-3 pr-4">Amortização</th>
                    <th className="border-b border-zinc-200 py-3">Saldo devedor</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaPreview.map((p) => (
                    <tr key={p.mes} className="text-zinc-700">
                      <td className="border-b border-zinc-100 py-3 pr-4">{p.mes}</td>
                      <td className="border-b border-zinc-100 py-3 pr-4">{formatarMoeda(p.parcela)}</td>
                      <td className="border-b border-zinc-100 py-3 pr-4">{formatarMoeda(p.juros)}</td>
                      <td className="border-b border-zinc-100 py-3 pr-4">{formatarMoeda(p.amortizacao)}</td>
                      <td className="border-b border-zinc-100 py-3">{formatarMoeda(p.saldoDevedor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-10 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">PRICE vs SAC</h2>
          <p className="mt-3 text-zinc-700 leading-relaxed">
            No sistema <strong>PRICE</strong>, a parcela tende a ser mais constante (com
            juros maiores no início). No sistema <strong>SAC</strong>, a amortização é
            constante e as parcelas começam mais altas e diminuem com o tempo.
          </p>
          <p className="mt-3 text-zinc-700 leading-relaxed">
            Este simulador não inclui CET, seguros, tarifas e impostos. Para comparar
            propostas reais, considere esses custos.
          </p>
        </section>
      </div>
    </div>
  );
}
