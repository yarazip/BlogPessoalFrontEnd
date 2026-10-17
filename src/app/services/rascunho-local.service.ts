import { Injectable } from '@angular/core';
import { FONTES, FontePostagem } from '../models/Fonte';
import { CORES_DO_POSTIT, LadoDosPostits, MAXIMO_DE_POSTITS, Postit } from '../models/Postit';

/** O que a tela de escrever guarda no navegador enquanto a pessoa digita. */
export interface RascunhoSalvo {
  titulo: string;
  texto: string;
  temaId: number | null;
  fonte: FontePostagem | null;
  /** Só quando há post-its (ou o lado não é o padrão): quem não usa post-its guarda o mesmo de antes. */
  postits?: Postit[];
  ladoDosPostits?: LadoDosPostits;
  /** Quando foi guardado (ISO), para avisar "salvo às 14:32". */
  salvoEm: string;
}

/**
 * Guarda no navegador (localStorage) o rascunho que ainda não foi publicado, para não se perder se a aba fechar, a
 * sessão cair ou a pessoa sair sem querer. Fica só no aparelho: não vai para a API. Cada pessoa e cada postagem têm a
 * própria chave, então duas contas no mesmo navegador não veem o texto uma da outra. Se o navegador não deixar usar o
 * armazenamento (modo privado, bloqueio), tudo funciona normalmente, só sem o salvamento.
 */
@Injectable({ providedIn: 'root' })
export class RascunhoLocalService {
  /** Chave de uma pessoa e de uma postagem (nulo = um rascunho novo, ainda sem id). */
  chave(usuarioId: number | undefined, postagemId: number | null): string {
    return `rasura:rascunho:${usuarioId ?? 'anonimo'}:${postagemId ?? 'novo'}`;
  }

  carregar(chave: string): RascunhoSalvo | null {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? this.validar(JSON.parse(bruto)) : null;
    } catch {
      return null;
    }
  }

  salvar(chave: string, dados: Omit<RascunhoSalvo, 'salvoEm'>): void {
    try {
      const salvo: RascunhoSalvo = { ...dados, salvoEm: new Date().toISOString() };
      localStorage.setItem(chave, JSON.stringify(salvo));
    } catch {
      // armazenamento indisponível ou cheio: segue sem o salvamento automático
    }
  }

  limpar(chave: string): void {
    try {
      localStorage.removeItem(chave);
    } catch {
      // idem
    }
  }

  /** Só aceita o formato esperado: o que estiver no navegador pode ter sido alterado ou ser de uma versão antiga. */
  private validar(valor: unknown): RascunhoSalvo | null {
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const v = valor as Record<string, unknown>;
    const fonteValida = v['fonte'] === null || FONTES.some(f => f.id === v['fonte']);
    const temaValido = v['temaId'] === null || Number.isInteger(v['temaId']);
    if (
      typeof v['titulo'] !== 'string' ||
      typeof v['texto'] !== 'string' ||
      typeof v['salvoEm'] !== 'string' ||
      !fonteValida ||
      !temaValido
    ) {
      return null;
    }
    const postits = v['postits'] === undefined ? undefined : this.validarPostits(v['postits']);
    const lado = v['ladoDosPostits'];
    if (postits === null || (lado !== undefined && lado !== 'ESQUERDA' && lado !== 'DIREITA')) {
      return null;
    }
    return {
      titulo: v['titulo'],
      texto: v['texto'],
      temaId: v['temaId'] as number | null,
      fonte: v['fonte'] as FontePostagem | null,
      ...(postits !== undefined && { postits }),
      ...(lado !== undefined && { ladoDosPostits: lado as LadoDosPostits }),
      salvoEm: v['salvoEm']
    };
  }

  /** Os post-its guardados: até 3, de tipo e cor conhecidos e foto só em https. Qualquer outra coisa invalida tudo. */
  private validarPostits(valor: unknown): Postit[] | null {
    if (!Array.isArray(valor) || valor.length > MAXIMO_DE_POSTITS) {
      return null;
    }
    const postits: Postit[] = [];
    for (const item of valor) {
      const p = item as Record<string, unknown> | null;
      const textoValido = p?.['texto'] === undefined || p?.['texto'] === null || typeof p?.['texto'] === 'string';
      const fotoValida = p?.['fotoUrl'] === undefined || p?.['fotoUrl'] === null || (typeof p?.['fotoUrl'] === 'string' && p['fotoUrl'].startsWith('https://'));
      const corValida = CORES_DO_POSTIT.some(c => c.id === p?.['cor']);
      if (!p || (p['tipo'] !== 'NOTA' && p['tipo'] !== 'FOTO') || !textoValido || !fotoValida || !corValida) {
        return null;
      }
      postits.push({ tipo: p['tipo'], texto: (p['texto'] as string | null | undefined) ?? null, fotoUrl: (p['fotoUrl'] as string | null | undefined) ?? null, cor: p['cor'] as Postit['cor'] });
    }
    return postits;
  }
}
