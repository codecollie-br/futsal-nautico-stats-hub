import { Domingo, Partida, Jogador, EventoPartida, TimeEnum } from "@/types/nautico";

interface PlayerStats {
  jogador: Jogador;
  gols_marcados: number;
  assistencias: number;
  vitorias_pessoais: number;
  partidas_jogadas: number;
  gols_sofridos_goleiro: number; // Apenas para goleiros
  gols_sofridos_time_geral: number; // Para desempate de jogadores de linha, soma dos gols sofridos pelo time em que atuou
  pontuacao_total: number;
}

// Função auxiliar para agregar estatísticas básicas dos jogadores
const aggregatePlayerStats = (domingoDetalhes: Domingo): Map<number, PlayerStats> => {
  const playerStatsMap = new Map<number, PlayerStats>();

  for (const partida of domingoDetalhes.partidas) {
    const golsLaranjaNaPartida = partida.time_laranja_gols;
    const golsPretoNaPartida = partida.time_preto_gols;

    // Garante que todos os jogadores que participaram da partida estejam no mapa
    for (const jpp of partida.jogadores_por_partida || []) {
      if (!playerStatsMap.has(jpp.jogador_id)) {
        playerStatsMap.set(jpp.jogador_id, {
          jogador: jpp.jogador!,
          gols_marcados: 0,
          assistencias: 0,
          vitorias_pessoais: 0,
          partidas_jogadas: 0,
          gols_sofridos_goleiro: 0,
          gols_sofridos_time_geral: 0,
          pontuacao_total: 0,
        });
      }
    }

    for (const jpp of partida.jogadores_por_partida || []) {
      const stats = playerStatsMap.get(jpp.jogador_id);
      if (stats) {
        stats.partidas_jogadas++;

        if (partida.vencedor === jpp.time) {
          stats.vitorias_pessoais++;
        }

        if (jpp.time === 'LARANJA') {
          stats.gols_sofridos_time_geral += golsPretoNaPartida;
        } else if (jpp.time === 'PRETO') {
          stats.gols_sofridos_time_geral += golsLaranjaNaPartida;
        }

        if (jpp.jogador?.is_goleiro) {
          if (jpp.time === 'LARANJA') {
            stats.gols_sofridos_goleiro += golsPretoNaPartida;
          } else if (jpp.time === 'PRETO') {
            stats.gols_sofridos_goleiro += golsLaranjaNaPartida;
          }
        }
      }
    }

    for (const evento of partida.eventos_partida || []) {
      if (evento.tipo_evento === 'GOL') {
        if (evento.jogador_gol_id && playerStatsMap.has(evento.jogador_gol_id)) {
          playerStatsMap.get(evento.jogador_gol_id)!.gols_marcados++;
        }
        if (evento.jogador_assistencia_id && playerStatsMap.has(evento.jogador_assistencia_id)) {
          playerStatsMap.get(evento.jogador_assistencia_id)!.assistencias++;
        }
      }
    }
  }
  return playerStatsMap;
};

export const calculateCraqueCandidates = (domingoDetalhes: Domingo): PlayerStats[] => {
  if (!domingoDetalhes || !domingoDetalhes.partidas || domingoDetalhes.partidas.length === 0) {
    return [];
  }

  const playerStatsMap = aggregatePlayerStats(domingoDetalhes);

  // Encontrar o goleiro com menos gols sofridos para o bônus
  let minGolsSofridosGoleiro = Infinity;
  let craqueGoleiroCandidateId: number | null = null;
  const goleiros = Array.from(playerStatsMap.values()).filter(s => s.jogador.is_goleiro);

  if (goleiros.length > 0) {
    for (const goalieStats of goleiros) {
      // Prioriza menos gols sofridos, depois menos partidas, depois menos gols sofridos pelo time geral
      // Esta lógica é para o craque, pode ser diferente para o time do dia.
      if (goalieStats.gols_sofridos_goleiro < minGolsSofridosGoleiro) {
        minGolsSofridosGoleiro = goalieStats.gols_sofridos_goleiro;
        craqueGoleiroCandidateId = goalieStats.jogador.id;
      } else if (goalieStats.gols_sofridos_goleiro === minGolsSofridosGoleiro) {
        const currentBestGoalieStats = playerStatsMap.get(craqueGoleiroCandidateId!);
        if (currentBestGoalieStats && (
          goalieStats.partidas_jogadas < currentBestGoalieStats.partidas_jogadas ||
          (goalieStats.partidas_jogadas === currentBestGoalieStats.partidas_jogadas && 
           goalieStats.gols_sofridos_time_geral < currentBestGoalieStats.gols_sofridos_time_geral)
        )) {
          craqueGoleiroCandidateId = goalieStats.jogador.id;
        }
      }
    }
  }

  // Calcular a pontuação total para todos os jogadores
  const allPlayerStats = Array.from(playerStatsMap.values()).map(stats => {
    let pontuacao = 0;
    pontuacao += stats.gols_marcados * 1; // +1 por gol
    pontuacao += stats.assistencias * 0.5; // +0.5 por assistência
    pontuacao += stats.vitorias_pessoais * 0.5; // +0.5 por vitória pessoal

    // Adicionar bônus de goleiro para o goleiro com melhor desempenho
    if (stats.jogador.id === craqueGoleiroCandidateId) {
      pontuacao += 4; // +4 para o goleiro com menos gols sofridos
    }

    return { ...stats, pontuacao_total: pontuacao };
  });

  // Ordenar jogadores pela pontuação total e depois pelos critérios de desempate
  allPlayerStats.sort((a, b) => {
    // 1. Pontuação Total (descrescente)
    if (b.pontuacao_total !== a.pontuacao_total) {
      return b.pontuacao_total - a.pontuacao_total;
    }
    // 2. Menos Partidas Jogadas (crescente)
    if (a.partidas_jogadas !== b.partidas_jogadas) {
      return a.partidas_jogadas - b.partidas_jogadas;
    }
    // 3. Menos Gols Sofridos pelo Time Geral (crescente)
    return a.gols_sofridos_time_geral - b.gols_sofridos_time_geral;
  });

  return allPlayerStats.slice(0, 3); // Retorna os 3 melhores candidatos
};

export const calculateTeamOfTheDay = (domingoDetalhes: Domingo): Array<PlayerStats & { x: number; y: number }> => {
  if (!domingoDetalhes || !domingoDetalhes.partidas || domingoDetalhes.partidas.length === 0) {
    return [];
  }

  const playerStatsMap = aggregatePlayerStats(domingoDetalhes);

  // Calcular a pontuação base para todos os jogadores
  const allPlayerStatsWithScores = Array.from(playerStatsMap.values()).map(stats => {
    let pontuacao = 0;
    pontuacao += stats.gols_marcados * 1;
    pontuacao += stats.assistencias * 0.5;
    pontuacao += stats.vitorias_pessoais * 0.5;
    return { ...stats, pontuacao_total: pontuacao };
  });

  // 1. Selecionar o goleiro com menos gols sofridos
  const goleirosCandidatos = allPlayerStatsWithScores.filter(s => s.jogador.is_goleiro);
  goleirosCandidatos.sort((a, b) => {
    // Menos gols sofridos como goleiro (crescente)
    if (a.gols_sofridos_goleiro !== b.gols_sofridos_goleiro) {
      return a.gols_sofridos_goleiro - b.gols_sofridos_goleiro;
    }
    // Desempate: Mais partidas jogadas (decrescente)
    return b.partidas_jogadas - a.partidas_jogadas;
  });
  const selectedGoalkeeper = goleirosCandidatos.length > 0 ? goleirosCandidatos[0] : null;

  // 2. Selecionar os 4 jogadores de linha com maior pontuação
  const jogadoresDeLinhaCandidatos = allPlayerStatsWithScores.filter(s => 
    !s.jogador.is_goleiro && s.jogador.id !== selectedGoalkeeper?.jogador.id
  );

  jogadoresDeLinhaCandidatos.sort((a, b) => {
    // Maior pontuação total (decrescente)
    if (b.pontuacao_total !== a.pontuacao_total) {
      return b.pontuacao_total - a.pontuacao_total;
    }
    // Desempate 1: Menos gols sofridos pelo time geral (crescente)
    if (a.gols_sofridos_time_geral !== b.gols_sofridos_time_geral) {
      return a.gols_sofridos_time_geral - b.gols_sofridos_time_geral;
    }
    // Desempate 2: Mais partidas jogadas (decrescente)
    return b.partidas_jogadas - a.partidas_jogadas;
  });

  const selectedOutfieldPlayers = jogadoresDeLinhaCandidatos.slice(0, 4);

  const teamOfTheDay: Array<PlayerStats & { x: number; y: number }> = [];

  // Adicionar goleiro (posição 5)
  if (selectedGoalkeeper) {
    teamOfTheDay.push({ ...selectedGoalkeeper, x: 145, y: 372 });
  }

  // Adicionar jogadores de linha (posições 1 a 4)
  // Posição 1: Maior Pontuador - superior
  if (selectedOutfieldPlayers[0]) {
    teamOfTheDay.push({ ...selectedOutfieldPlayers[0], x: 60, y: 230 });
  }
  // Posição 2: Segundo Maior Pontuador - superior
  if (selectedOutfieldPlayers[1]) {
    teamOfTheDay.push({ ...selectedOutfieldPlayers[1], x: 225, y: 230 });
  }
  // Posição 3: Jogador de linha que menos sofreu gols e que mais pontuou.
  // Precisa de uma ordenação específica aqui entre os jogadores de linha selecionados
  // Re-ordenar os jogadores de linha para as posições 3 e 4 com os critérios específicos
  const sortedForPos3And4 = [...selectedOutfieldPlayers].sort((a, b) => {
    // Menos gols sofridos pelo time (crescente)
    if (a.gols_sofridos_time_geral !== b.gols_sofridos_time_geral) {
      return a.gols_sofridos_time_geral - b.gols_sofridos_time_geral;
    }
    // Mais pontuou (decrescente)
    return b.pontuacao_total - a.pontuacao_total;
  });

  if (sortedForPos3And4[0] && sortedForPos3And4[0].jogador.id !== teamOfTheDay[1]?.jogador.id && sortedForPos3And4[0].jogador.id !== teamOfTheDay[2]?.jogador.id) {
    teamOfTheDay.push({ ...sortedForPos3And4[0], x: 60, y: 305 }); // Posição 3
  } else if (sortedForPos3And4[1] && sortedForPos3And4[1].jogador.id !== teamOfTheDay[1]?.jogador.id && sortedForPos3And4[1].jogador.id !== teamOfTheDay[2]?.jogador.id) {
    teamOfTheDay.push({ ...sortedForPos3And4[1], x: 60, y: 305 }); // Posição 3 (se o primeiro já foi pego nas pos 1 ou 2)
  }

  // Find the remaining player for position 4, ensuring uniqueness
  const pos3PlayerId = teamOfTheDay.find(p => p.x === 60 && p.y === 305)?.jogador.id;
  const pos1PlayerId = teamOfTheDay.find(p => p.x === 60 && p.y === 230)?.jogador.id;
  const pos2PlayerId = teamOfTheDay.find(p => p.x === 225 && p.y === 230)?.jogador.id;

  if (selectedOutfieldPlayers[2] && selectedOutfieldPlayers[2].jogador.id !== pos1PlayerId && selectedOutfieldPlayers[2].jogador.id !== pos2PlayerId && selectedOutfieldPlayers[2].jogador.id !== pos3PlayerId) {
    teamOfTheDay.push({ ...selectedOutfieldPlayers[2], x: 225, y: 305 }); // Posição 4
  } else if (selectedOutfieldPlayers[3] && selectedOutfieldPlayers[3].jogador.id !== pos1PlayerId && selectedOutfieldPlayers[3].jogador.id !== pos2PlayerId && selectedOutfieldPlayers[3].jogador.id !== pos3PlayerId) {
    teamOfTheDay.push({ ...selectedOutfieldPlayers[3], x: 225, y: 305 }); // Posição 4
  }

  // Sort the final teamOfTheDay by position to ensure consistent output order
  teamOfTheDay.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y; // Y-coordinate first
    return a.x - b.x; // Then X-coordinate
  });

  return teamOfTheDay;
}; 