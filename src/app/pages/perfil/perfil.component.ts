import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HumorDoDiaComponent } from '../../components/humor-do-dia/humor-do-dia.component';
import { CompositorComentarioComponent } from '../../components/compositor-comentario/compositor-comentario.component';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';
import { LayoutBlogComponent } from '../../components/layout-blog/layout-blog.component';
import { NoMomentoComponent } from '../../components/no-momento/no-momento.component';
import { LIMITE_BIO, Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { TAMANHO_MAXIMO_FOTO, TIPOS_FOTO_PERMITIDOS } from '../../shared/foto';
import { IconComponent } from '../../shared/icon/icon.component';
import { mesValido, nomeDoMesDaChave } from '../../shared/arquivo';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * A página da pessoa: foto, nome, bio, quantidade de postagens e as postagens dela. É pública. Quando o
 * perfil é o de quem está logado, a mesma página vira o lugar de editar: troca de foto, edição da bio,
 * atalho para um rascunho novo, caixa de rabisco e o menu de três pontinhos em cada postagem.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    LayoutBlogComponent,
    NoMomentoComponent,
    FeedPostagensComponent,
    CompositorComentarioComponent,
    HumorDoDiaComponent,
    IconComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);

  readonly fotoPadrao = 'assets/img/sem-foto.svg';
  readonly limiteBio = LIMITE_BIO;
  readonly tiposDeFoto = TIPOS_FOTO_PERMITIDOS.join(',');

  // mesmo limite validado pela API (BioRequestDTO); texto vazio apaga a bio
  readonly bio = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_BIO)] });
  // o <form> precisa de um FormGroup: é ele que faz o Angular impedir o envio nativo (recarregar a página)
  readonly bioForm = new FormGroup({ bio: this.bio });

  perfil: Perfil | null = null;
  /** O mês aberto pelo arquivo ("aaaa-mm", ?mes= na barra de endereço), ou nulo para todas as postagens. */
  mes: string | null = null;
  carregando = true;
  mensagemErro: string | null = null;

  editandoBio = false;
  salvandoBio = false;
  erroBio: string | null = null;

  enviandoFoto = false;
  erroFoto: string | null = null;

  /** Visitante não tem mural para voltar: o link de erro leva ao início. */
  get logado(): boolean {
    return this.authService.isLoggedIn();
  }

  /** O perfil aberto é o de quem está logado: aparecem as ações de edição. */
  get ehOProprioPerfil(): boolean {
    return this.perfil !== null && this.authService.isLoggedIn() && this.authService.getUsuario()?.id === this.perfil.id;
  }

  /** O e-mail não vem do perfil público (é dado pessoal); só a própria pessoa o vê, da sessão. */
  get emailDaSessao(): string | null {
    return this.ehOProprioPerfil ? (this.authService.getUsuario()?.email ?? null) : null;
  }

  /** A seção "no momento" do topo (celular) existe se há algo a mostrar ou se a dona pode preencher. */
  get mostrarNoMomento(): boolean {
    return !!(this.perfil && (this.perfil.musicaAtual || this.perfil.livroAtual || this.ehOProprioPerfil));
  }

  /** Depois de salvar música e livro: o perfil da tela recebe os novos valores. */
  aoAtualizarNoMomento(perfil: Perfil): void {
    this.perfil = { ...this.perfil!, ...perfil, totalPostagens: this.perfil!.totalPostagens };
  }

  get mensagemDeListaVazia(): string {
    return this.ehOProprioPerfil
      ? 'Você ainda não publicou nada. Faça um rabisco acima ou escreva um rascunho.'
      : 'Esta pessoa ainda não publicou nada.';
  }

  /** "outubro 2026", para avisar que a lista está filtrada. */
  get nomeDoMes(): string {
    return nomeDoMesDaChave(this.mes);
  }

  /** Depois de salvar o humor do dia: o perfil da tela recebe o novo valor. */
  aoAtualizarHumor(humor: string | null): void {
    this.perfil = { ...this.perfil!, humor };
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.carregar(Number(params.get('id'))));
    // o mês vem da barra de endereço (qualquer pessoa pode digitar qualquer coisa): só vale o formato aaaa-mm
    this.route.queryParamMap.subscribe(params => (this.mes = mesValido(params.get('mes'))));
  }

  carregar(id: number): void {
    this.perfil = null;
    this.mensagemErro = null;
    this.editandoBio = false;
    this.erroFoto = null;

    if (!Number.isInteger(id) || id <= 0) {
      this.carregando = false;
      this.mensagemErro = 'Perfil não encontrado.';
      return;
    }

    this.carregando = true;
    this.perfilService.getPerfil(id).subscribe({
      next: perfil => {
        this.perfil = perfil;
        this.carregando = false;
      },
      error: erro => {
        this.mensagemErro = erro?.status === 404 ? 'Perfil não encontrado.' : mensagemDeErro(erro, 'Não foi possível carregar o perfil.');
        this.carregando = false;
      }
    });
  }

  // ---- contagem de postagens (acompanha o que a pessoa publica e apaga nesta mesma página)

  aoPublicar(): void {
    this.somarPostagens(1);
  }

  aoRemover(): void {
    this.somarPostagens(-1);
  }

  private somarPostagens(delta: number): void {
    if (this.perfil) {
      this.perfil = { ...this.perfil, totalPostagens: Math.max(0, this.perfil.totalPostagens + delta) };
    }
  }

  // ---- bio

  editarBio(): void {
    this.bio.setValue(this.perfil?.bio ?? '');
    this.erroBio = null;
    this.editandoBio = true;
  }

  cancelarBio(): void {
    this.editandoBio = false;
    this.erroBio = null;
  }

  salvarBio(): void {
    if (!this.perfil || this.bio.invalid || this.salvandoBio) {
      return;
    }

    this.salvandoBio = true;
    this.erroBio = null;

    this.perfilService.atualizarBio(this.perfil.id, this.bio.value).subscribe({
      next: perfil => {
        this.perfil = { ...this.perfil!, bio: perfil.bio ?? null };
        this.editandoBio = false;
        this.salvandoBio = false;
      },
      error: erro => {
        this.erroBio = mensagemDeErro(erro, 'Não foi possível salvar a bio. Tente novamente.');
        this.salvandoBio = false;
      }
    });
  }

  // ---- foto

  onFileSelected(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    entrada.value = ''; // permite escolher o mesmo arquivo de novo depois de um erro
    this.erroFoto = null;

    if (!arquivo || !this.perfil) {
      return;
    }
    if (!TIPOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
      this.erroFoto = 'Formato não suportado. Envie JPG, PNG, WEBP, GIF ou AVIF.';
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.erroFoto = 'Arquivo muito grande. O tamanho máximo permitido é 5MB.';
      return;
    }

    this.enviandoFoto = true;
    this.authService.atualizarFoto(this.perfil.id, arquivo).subscribe({
      next: resposta => {
        this.perfil = { ...this.perfil!, foto: resposta.foto };
        this.authService.updateUsuario({ foto: resposta.foto });
        this.enviandoFoto = false;
      },
      error: erro => {
        this.erroFoto = mensagemDeErro(erro, 'Não foi possível atualizar a foto. Tente novamente.');
        this.enviandoFoto = false;
      }
    });
  }
}
