/** Chave de um mês como a API espera no filtro `mes`: "aaaa-mm" (por exemplo, "2026-10"). */
export function chaveDoMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

/** "aaaa-mm" válido (mês de 01 a 12), ou nulo. Vem da barra de endereço, então nunca se confia no formato. */
export function mesValido(texto: string | null | undefined): string | null {
  const achado = /^(\d{4})-(\d{2})$/.exec(texto ?? '');
  if (!achado) {
    return null;
  }
  const mes = Number(achado[2]);
  return mes >= 1 && mes <= 12 ? achado[0] : null;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "outubro 2026" (arquivo) a partir do ano e do mês (1 a 12). */
export function nomeDoMes(ano: number, mes: number): string {
  return `${MESES[mes - 1] ?? ''} ${ano}`.trim();
}

/** "outubro 2026" a partir de uma chave "aaaa-mm" válida; vazio se não for válida. */
export function nomeDoMesDaChave(chave: string | null): string {
  const valida = mesValido(chave);
  return valida ? nomeDoMes(Number(valida.slice(0, 4)), Number(valida.slice(5))) : '';
}
