
export type TimeEnum = 'LARANJA' | 'PRETO';
export type ResultadoEnum = 'LARANJA' | 'PRETO' | 'EMPATE';
export type TipoEvento = 'GOL' | 'SUBSTITUICAO';
export type StatusPartida = 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA';

export interface Jogador {
  id: number;
  nome: string;
  foto_url?: string;
  is_goleiro: boolean;
  total_minutos_jogados: number;
  vitorias_pessoais: number;
  empates_pessoais: number;
  derrotas_pessoais: number;
  apelido?: string;
  bio?: string;
  created_at: string;
}

export interface Domingo {
  id: number;
  data_domingo: string;
  created_at: string;
  token_moderacao?: string;
  vitorias_laranja_consecutivas?: number;
  vitorias_preto_consecutivas?: number;
  votacao_liberada?: boolean;
  craque_domingo_id?: number;
  partidas?: Partida[];
}

export interface Partida {
  id: number;
  domingo_id: number;
  time_laranja_gols: number;
  time_preto_gols: number;
  hora_inicio?: string;
  hora_fim?: string;
  vencedor?: ResultadoEnum;
  duracao_minutos?: number;
  status: StatusPartida;
  created_at: string;
  domingo?: Domingo;
  jogadores_por_partida?: JogadorPorPartida[];
  eventos_partida?: EventoPartida[];
}

export interface JogadorPorPartida {
  id: number;
  partida_id: number;
  jogador_id: number;
  time: TimeEnum;
  created_at: string;
  jogador?: Jogador;
}

export interface EventoPartida {
  id: number;
  partida_id: number;
  tipo_evento: TipoEvento;
  minuto_partida: number;
  jogador_gol_id?: number;
  jogador_assistencia_id?: number;
  jogador_sai_id?: number;
  jogador_entra_id?: number;
  is_gol_contra: boolean;
  time_marcador?: TimeEnum;
  created_at: string;
}

export interface VotoCraqueDomingo {
  id: number;
  domingo_id: number;
  votante_jogador_id: number;
  votado_jogador_id: number;
  created_at: string;
  votante?: Jogador;
  votado?: Jogador;
}

export interface Configuracao {
  id: number;
  chave: string;
  valor: string;
  descricao?: string;
  created_at: string;
}

export interface EstatisticasJogador extends Jogador {
  gols_marcados: number;
  assistencias: number;
  gols_sofridos: number;
  pontuacao_total: number;
}
