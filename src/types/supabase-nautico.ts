
export interface Database {
  nautico: {
    Tables: {
      jogadores: {
        Row: {
          id: number;
          nome: string;
          foto_url: string | null;
          is_goleiro: boolean;
          total_minutos_jogados: number;
          vitorias_pessoais: number;
          empates_pessoais: number;
          derrotas_pessoais: number;
          apelido: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          nome: string;
          foto_url?: string | null;
          is_goleiro?: boolean;
          total_minutos_jogados?: number;
          vitorias_pessoais?: number;
          empates_pessoais?: number;
          derrotas_pessoais?: number;
          apelido?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          nome?: string;
          foto_url?: string | null;
          is_goleiro?: boolean;
          total_minutos_jogados?: number;
          vitorias_pessoais?: number;
          empates_pessoais?: number;
          derrotas_pessoais?: number;
          apelido?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      domingos: {
        Row: {
          id: number;
          data_domingo: string;
          created_at: string;
          token_moderacao: string | null;
          vitorias_laranja_consecutivas: number | null;
          vitorias_preto_consecutivas: number | null;
          votacao_liberada: boolean | null;
          craque_domingo_id: number | null;
        };
        Insert: {
          id?: number;
          data_domingo: string;
          created_at?: string;
          token_moderacao?: string | null;
          vitorias_laranja_consecutivas?: number | null;
          vitorias_preto_consecutivas?: number | null;
          votacao_liberada?: boolean | null;
          craque_domingo_id?: number | null;
        };
        Update: {
          id?: number;
          data_domingo?: string;
          created_at?: string;
          token_moderacao?: string | null;
          vitorias_laranja_consecutivas?: number | null;
          vitorias_preto_consecutivas?: number | null;
          votacao_liberada?: boolean | null;
          craque_domingo_id?: number | null;
        };
      };
      partidas: {
        Row: {
          id: number;
          domingo_id: number;
          time_laranja_gols: number;
          time_preto_gols: number;
          hora_inicio: string | null;
          hora_fim: string | null;
          vencedor: string | null;
          duracao_minutos: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          domingo_id: number;
          time_laranja_gols?: number;
          time_preto_gols?: number;
          hora_inicio?: string | null;
          hora_fim?: string | null;
          vencedor?: string | null;
          duracao_minutos?: number | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          domingo_id?: number;
          time_laranja_gols?: number;
          time_preto_gols?: number;
          hora_inicio?: string | null;
          hora_fim?: string | null;
          vencedor?: string | null;
          duracao_minutos?: number | null;
          status?: string;
          created_at?: string;
        };
      };
      jogadores_por_partida: {
        Row: {
          id: number;
          partida_id: number;
          jogador_id: number;
          time: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          partida_id: number;
          jogador_id: number;
          time: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          partida_id?: number;
          jogador_id?: number;
          time?: string;
          created_at?: string;
        };
      };
      eventos_partida: {
        Row: {
          id: number;
          partida_id: number;
          tipo_evento: string;
          minuto_partida: number;
          jogador_gol_id: number | null;
          jogador_assistencia_id: number | null;
          jogador_sai_id: number | null;
          jogador_entra_id: number | null;
          is_gol_contra: boolean;
          time_marcador: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          partida_id: number;
          tipo_evento: string;
          minuto_partida: number;
          jogador_gol_id?: number | null;
          jogador_assistencia_id?: number | null;
          jogador_sai_id?: number | null;
          jogador_entra_id?: number | null;
          is_gol_contra?: boolean;
          time_marcador?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          partida_id?: number;
          tipo_evento?: string;
          minuto_partida?: number;
          jogador_gol_id?: number | null;
          jogador_assistencia_id?: number | null;
          jogador_sai_id?: number | null;
          jogador_entra_id?: number | null;
          is_gol_contra?: boolean;
          time_marcador?: string | null;
          created_at?: string;
        };
      };
      fila_espera: {
        Row: {
          id: number;
          domingo_id: number;
          jogador_id: number;
          ordem: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          domingo_id: number;
          jogador_id: number;
          ordem: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          domingo_id?: number;
          jogador_id?: number;
          ordem?: number;
          created_at?: string;
        };
      };
      votos_craque_domingo: {
        Row: {
          id: number;
          domingo_id: number;
          votante_jogador_id: number;
          votado_jogador_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          domingo_id: number;
          votante_jogador_id: number;
          votado_jogador_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          domingo_id?: number;
          votante_jogador_id?: number;
          votado_jogador_id?: number;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
