import { Injectable } from '@angular/core';
import { FONTES, FontePostagem } from '../models/Fonte';

/** O que a tela de escrever guarda no navegador enquanto a pessoa digita. */
export interface RascunhoSalvo {
  titulo: string;
  texto: string;
  temaId: number | null;
  fonte: FontePostagem | null;
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
    return {
      titulo: v['titulo'],
      texto: v['texto'],
      temaId: v['temaId'] as number | null,
      fonte: v['fonte'] as FontePostagem | null,
      salvoEm: v['salvoEm']
    };
  }
}
