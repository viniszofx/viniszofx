// O editor e o arquivo XLSX só entendem os nomes de função em inglês, como o Excel grava por dentro.
// Quem digita como no Excel em português (=SOMA(A1;A2)) tem a fórmula traduzida antes de gravar.
const NAMES: Record<string, string> = {
  SOMA: "SUM", SOMASE: "SUMIF", SOMASES: "SUMIFS", SOMARPRODUTO: "SUMPRODUCT", PRODUTO: "PRODUCT",
  "MÉDIA": "AVERAGE", "MÉDIASE": "AVERAGEIF", "MÉDIASES": "AVERAGEIFS", MED: "MEDIAN", MODO: "MODE",
  "MÁXIMO": "MAX", "MÍNIMO": "MIN", MAIOR: "LARGE", MENOR: "SMALL", ORDEM: "RANK", DESVPAD: "STDEV",
  "CONT.SE": "COUNTIF", "CONT.SES": "COUNTIFS", "CONT.VALORES": "COUNTA", "CONT.NÚM": "COUNT", "CONTAR.VAZIO": "COUNTBLANK",
  SE: "IF", SES: "IFS", E: "AND", OU: "OR", "NÃO": "NOT", SEERRO: "IFERROR", "SENÃODISP": "IFNA",
  "ÉERROS": "ISERROR", "ÉCÉL.VAZIA": "ISBLANK", "ÉNÚM": "ISNUMBER", "ÉTEXTO": "ISTEXT",
  VERDADEIRO: "TRUE", FALSO: "FALSE",
  PROCV: "VLOOKUP", PROCH: "HLOOKUP", PROCX: "XLOOKUP", "ÍNDICE": "INDEX", CORRESP: "MATCH", ESCOLHER: "CHOOSE",
  DESLOC: "OFFSET", INDIRETO: "INDIRECT", LIN: "ROW", COL: "COLUMN", LINS: "ROWS", COLS: "COLUMNS", TRANSPOR: "TRANSPOSE",
  "ÚNICO": "UNIQUE", FILTRO: "FILTER", CLASSIFICAR: "SORT",
  ARRED: "ROUND", "ARREDONDAR.PARA.CIMA": "ROUNDUP", "ARREDONDAR.PARA.BAIXO": "ROUNDDOWN", TRUNCAR: "TRUNC",
  RAIZ: "SQRT", "POTÊNCIA": "POWER", "ALEATÓRIO": "RAND", "ALEATÓRIOENTRE": "RANDBETWEEN",
  HOJE: "TODAY", AGORA: "NOW", DATA: "DATE", ANO: "YEAR", "MÊS": "MONTH", DIA: "DAY", "DIA.DA.SEMANA": "WEEKDAY",
  DIAS: "DAYS", DATAM: "EDATE", "FIMMÊS": "EOMONTH", DIATRABALHOTOTAL: "NETWORKDAYS", HORA: "HOUR", MINUTO: "MINUTE", SEGUNDO: "SECOND",
  CONCATENAR: "CONCATENATE", ESQUERDA: "LEFT", DIREITA: "RIGHT", "EXT.TEXTO": "MID", "NÚM.CARACT": "LEN",
  "MAIÚSCULA": "UPPER", "MINÚSCULA": "LOWER", "PRI.MAIÚSCULA": "PROPER", ARRUMAR: "TRIM", SUBSTITUIR: "SUBSTITUTE",
  MUDAR: "REPLACE", PROCURAR: "FIND", LOCALIZAR: "SEARCH", TEXTO: "TEXT", VALOR: "VALUE",
  PGTO: "PMT", VP: "PV", VF: "FV", TAXA: "RATE", VPL: "NPV", TIR: "IRR",
};
// Aceita também sem acento (MEDIA, MAXIMO), como muita gente digita.
const plain = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "");
const LOOKUP = new Map<string, string>();
for (const [name, english] of Object.entries(NAMES)) {
  LOOKUP.set(name, english);
  LOOKUP.set(plain(name), english);
}
const BOOLEANS = new Set(["TRUE", "FALSE"]);
const IDENTIFIER = /[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*/y;

export function toExcelFormula(input: string) {
  if (!input.startsWith("=")) return input;
  // Ponto e vírgula fora de texto indica o padrão brasileiro: vírgula é decimal e ponto e vírgula separa argumentos.
  const brazilian = /;/.test(input.replace(/"[^"]*"|'[^']*'/g, ""));
  let output = "";
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (char === '"' || char === "'") {
      const end = input.indexOf(char, index + 1);
      const stop = end === -1 ? input.length : end + 1;
      output += input.slice(index, stop);
      index = stop;
      continue;
    }
    IDENTIFIER.lastIndex = index;
    const match = IDENTIFIER.exec(input);
    if (match) {
      const word = match[0];
      const after = input[index + word.length];
      const english = LOOKUP.get(word.toUpperCase());
      // Só troca nome de função (seguido de parêntese) ou VERDADEIRO/FALSO; referências como A1 ficam intactas.
      output += english && (after === "(" || BOOLEANS.has(english)) ? english : word;
      index += word.length;
      continue;
    }
    output += brazilian && char === "," ? "." : brazilian && char === ";" ? "," : char;
    index++;
  }
  return output;
}
