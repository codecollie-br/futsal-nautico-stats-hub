import { Domingo, Jogador } from "@/types/nautico";
import { calculateCraqueCandidates, calculateTeamOfTheDay } from "./craqueCalculations";
import { aggregatePlayerStats } from "./craqueCalculations"; // Importar a função auxiliar

export const generateWhatsAppSummary = (domingoDetalhes: Domingo, allJogadores: Jogador[]): string => {
  if (!domingoDetalhes || !domingoDetalhes.partidas || domingoDetalhes.partidas.length === 0) {
    return "Não há dados de partidas finalizadas para este domingo.";
  }

  const { domingo, partidas } = domingoDetalhes;
  const dataDomingo = new Date(domingo.data_domingo!).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let summary = `*⚽ Resumo do Domingo Futsal - ${dataDomingo} ⚽*

`;

  // 1. Resumo das Partidas
  summary += `*Resultados das Partidas:*
`;
  partidas.forEach((partida, index) => {
    const inicio = partida.hora_inicio ? new Date(partida.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    const fim = partida.hora_fim ? new Date(partida.hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    summary += `
*Partida ${index + 1}:* ${partida.time_laranja_gols} x ${partida.time_preto_gols}
(Início: ${inicio} | Fim: ${fim})
`;
  });

  // Estatísticas gerais
  const totalGolsLaranja = partidas.reduce((sum, p) => sum + p.time_laranja_gols, 0);
  const totalGolsPreto = partidas.reduce((sum, p) => sum + p.time_preto_gols, 0);
  const totalPartidasJogadas = partidas.length;
  const vitoriasLaranja = partidas.filter(p => p.vencedor === 'LARANJA').length;
  const vitoriasPreto = partidas.filter(p => p.vencedor === 'PRETO').length;
  const empates = partidas.filter(p => p.vencedor === 'EMPATE').length;

  summary += `
*Estatísticas do Dia:*
- Partidas Jogadas: ${totalPartidasJogadas}
- Gols Laranja: ${totalGolsLaranja}
- Gols Preto: ${totalGolsPreto}
- Vitórias Laranja: ${vitoriasLaranja}
- Vitórias Preto: ${vitoriasPreto}
- Empates: ${empates}
`;

  // 2. Artilheiros e Assistentes
  const playerStatsMap = aggregatePlayerStats(domingoDetalhes);
  const allPlayerStats = Array.from(playerStatsMap.values());

  const topScorers = [...allPlayerStats].sort((a, b) => b.gols_marcados - a.gols_marcados).slice(0, 3);
  const topAssisters = [...allPlayerStats].sort((a, b) => b.assistencias - a.assistencias).slice(0, 3);

  if (topScorers.length > 0) {
    summary += `
*Artilheiros:*
`;
    topScorers.forEach((s, index) => {
      summary += `${index + 1}. ${s.jogador.nome} (${s.gols_marcados} gols)\n`;
    });
  }

  if (topAssisters.length > 0) {
    summary += `
*Maiores Assistentes:*
`;
    topAssisters.forEach((s, index) => {
      summary += `${index + 1}. ${s.jogador.nome} (${s.assistencias} assistências)\n`;
    });
  }

  // 3. Craque do Domingo (se eleito)
  const craqueDomingo = domingoDetalhes.craque_domingo_id ? allJogadores.find(j => j.id === domingoDetalhes.craque_domingo_id) : null;
  if (craqueDomingo) {
    summary += `
*⭐ Craque do Domingo: ${craqueDomingo.nome} ⭐*
`;
  }

  // 4. Time do Domingo (se selecionado)
  const teamOfTheDay = calculateTeamOfTheDay(domingoDetalhes);
  if (teamOfTheDay.length > 0) {
    summary += `
*🏆 Time do Domingo:*
`;
    teamOfTheDay.forEach(p => {
      summary += `- ${p.jogador.nome}\n`;
    });
  }

  summary += `
_Para mais detalhes e estatísticas, acesse nosso site!_`;

  return summary;
}; 