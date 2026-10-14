import { CanDeactivateFn } from '@angular/router';
import type { PostagemFormComponent } from '../pages/postagem-form/postagem-form.component';

/**
 * Ao sair da tela de escrever com um rascunho não publicado, pergunta antes (numa janela da própria tela). A resposta
 * vem do componente: sem alterações a saída é livre.
 */
export const saidaDoFormulario: CanDeactivateFn<PostagemFormComponent> = componente => componente.podeSair();
