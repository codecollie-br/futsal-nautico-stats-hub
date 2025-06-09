
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePartidas, useDomingoDetalhes, useJogadores, useRegistrarVotoCraque, useVotosCraqueDomingo, useCalcularCraqueDomingo, useLiberarVotacaoCraque } from "@/hooks/useNautico";
import { Calendar, Trophy, Star } from "lucide-react";
import PlacarPartida from "@/components/partida/PlacarPartida";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateCraqueCandidates, calculateTeamOfTheDay } from "@/utils/craqueCalculations";
import { generateWhatsAppSummary } from "@/utils/summaryGenerator";
import { Domingo, Partida } from "@/types/nautico";

const Historico = () => {
  const { data: partidas, isLoading } = usePartidas();
  const { toast } = useToast();

  const partidasFinalizadas = partidas?.filter(p => p.status === 'FINALIZADA') || [];

  // States for voting modal
  const [modalVotoOpen, setModalVotoOpen] = useState(false);
  const [currentDomingoId, setCurrentDomingoId] = useState<number | null>(null);
  const [votanteId, setVotanteId] = useState<number | null>(null);
  const [votadoId, setVotadoId] = useState<number | null>(null);
  const [erroVoto, setErroVoto] = useState<string | null>(null);

  // Hooks for data
  const { data: jogadores } = useJogadores();

  // Mutations for voting
  const registrarVoto = useRegistrarVotoCraque();
  const calcularCraque = useCalcularCraqueDomingo();
  const liberarVotacao = useLiberarVotacaoCraque();

  // Helper to check if current user is moderator
  const location = window.location;
  const isModerador = new URLSearchParams(location.search).get("token") === "MODERATOR_TOKEN_HERE"; 

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div>Carregando histórico...</div>
      </div>
    );
  }

  // Group partidas by domingo_id for easier processing
  const partidasByDomingo = partidasFinalizadas.reduce((acc, partida) => {
    if (!acc[partida.domingo_id]) {
      acc[partida.domingo_id] = {
        domingo: partida.domingo!,
        partidas: [],
      };
    }
    acc[partida.domingo_id].partidas.push(partida);
    return acc;
  }, {} as Record<number, { domingo: Domingo; partidas: Partida[] }>);

  const uniqueDomingoIds = Object.keys(partidasByDomingo).map(Number);

  const handleOpenVotoModal = (dId: number) => {
    setCurrentDomingoId(dId);
    setVotanteId(null);
    setVotadoId(null);
    setErroVoto(null);
    setModalVotoOpen(true);
  };

  const handleRegistrarVoto = async () => {
    if (!currentDomingoId || !votanteId || !votadoId) {
      setErroVoto("Selecione o votante e o jogador votado.");
      return;
    }
    
    try {
      await registrarVoto.mutateAsync({
        domingo_id: currentDomingoId,
        votante_jogador_id: votanteId,
        votado_jogador_id: votadoId,
      });
      toast({ title: "Voto registrado com sucesso!" });
      setModalVotoOpen(false);
    } catch (error: any) {
      setErroVoto(error.message || "Erro ao registrar voto.");
    }
  };

  const handleCalcularCraque = async (dId: number) => {
    try {
      await calcularCraque.mutateAsync(dId);
      toast({ title: "Craque do domingo calculado!" });
    } catch (error: any) {
      toast({ title: "Erro ao calcular craque.", description: error.message, variant: "destructive" });
    }
  };

  const handleLiberarVotacao = async (dId: number) => {
    try {
      await liberarVotacao.mutateAsync(dId);
      toast({ title: "Votação liberada!" });
    } catch (error: any) {
      toast({ title: "Erro ao liberar votação.", description: error.message, variant: "destructive" });
    }
  };

  const handleCopySummary = (domingoDetalhes: Domingo) => {
    if (domingoDetalhes && jogadores) {
      const summaryText = generateWhatsAppSummary(domingoDetalhes, jogadores);
      navigator.clipboard.writeText(summaryText);
      toast({ title: "Resumo copiado para o WhatsApp!" });
    } else {
      toast({ title: "Erro ao gerar resumo", description: "Dados do domingo ou jogadores não disponíveis.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Histórico de Partidas</h1>
        <p className="text-gray-600">Reviva todos os grandes momentos</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{partidasFinalizadas.length}</div>
            <div className="text-gray-600">Partidas Jogadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {partidasFinalizadas.filter(p => p.vencedor === 'LARANJA').length}
            </div>
            <div className="text-gray-600">Vitórias Laranja</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">
              {partidasFinalizadas.filter(p => p.vencedor === 'PRETO').length}
            </div>
            <div className="text-gray-600">Vitórias Preto</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Domingos e suas Partidas/Votação */}
      <div className="space-y-4">
        {uniqueDomingoIds.length > 0 ? (
          uniqueDomingoIds.sort((a, b) => {
            const dateA = new Date(partidasByDomingo[a].domingo.data_domingo!).getTime();
            const dateB = new Date(partidasByDomingo[b].domingo.data_domingo!).getTime();
            return dateB - dateA;
          }).map(domingoId => {
            const domingoData = partidasByDomingo[domingoId].domingo;
            const { data: domingoDetalhes, isLoading: isLoadingDomingoDetalhes } = useDomingoDetalhes(domingoId);
            const { data: votosDoDomingo } = useVotosCraqueDomingo(domingoId);

            // Calcula os candidatos a craque se os detalhes do domingo estiverem carregados
            const craqueCandidates = domingoDetalhes ? calculateCraqueCandidates(domingoDetalhes) : [];
            const craqueDomingo = domingoDetalhes?.craque_domingo_id ? jogadores?.find(j => j.id === domingoDetalhes.craque_domingo_id) : null;
            const teamOfTheDay = domingoDetalhes && domingoDetalhes.craque_domingo_id ? calculateTeamOfTheDay(domingoDetalhes) : [];

            return (
              <Card key={domingoId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {domingoData.data_domingo &&
                        new Date(domingoData.data_domingo).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDomingoDetalhes ? (
                    <div className="text-center py-4">Carregando detalhes do domingo...</div>
                  ) : (
                    <>
                      {/* Partidas do Domingo */}
                      {partidasByDomingo[domingoId].partidas.map(partida => (
                        <div key={partida.id} className="mb-4 last:mb-0 border-b pb-4 last:border-b-0">
                          <PlacarPartida
                            golsLaranja={partida.time_laranja_gols}
                            golsPreto={partida.time_preto_gols}
                            status={partida.status}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                            <div>
                              <strong>Duração:</strong> {partida.duracao_minutos} minutos
                            </div>
                            {partida.hora_inicio && (
                              <div>
                                <strong>Início:</strong> {new Date(partida.hora_inicio).toLocaleTimeString('pt-BR')}
                              </div>
                            )}
                            {partida.hora_fim && (
                              <div>
                                <strong>Fim:</strong> {new Date(partida.hora_fim).toLocaleTimeString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Votação Craque do Domingo */}
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                          <Star className="w-6 h-6 text-yellow-500" />
                          Craque do Domingo
                        </h3>

                        {domingoDetalhes?.craque_domingo_id ? (
                          <div className="text-lg font-bold text-green-700 flex items-center gap-2">
                            <span>Craque Eleito: {craqueDomingo?.nome}</span>
                          </div>
                        ) : domingoDetalhes?.votacao_liberada ? (
                          <div className="space-y-4">
                            <p className="text-gray-700">Vote no Craque do Domingo!</p>
                            {isModerador && (
                                <Button
                                  onClick={() => handleCalcularCraque(domingoId)}
                                  disabled={calcularCraque.isPending}
                                  variant="outline"
                                >
                                  {calcularCraque.isPending ? "Calculando..." : "Calcular Craque"}
                                </Button>
                              )}
                            <Button onClick={() => handleOpenVotoModal(domingoId)} disabled={craqueCandidates.length === 0 || registrarVoto.isPending || votosDoDomingo?.some(v => v.votante_jogador_id === votanteId)}>
                              {registrarVoto.isPending ? "Abrindo votação..." : "Votar no Craque"}
                            </Button>

                            {craqueCandidates.length > 0 && (
                              <div className="mt-4">
                                <p className="font-semibold text-gray-800">Candidatos a Craque:</p>
                                <ul className="list-disc pl-5">
                                  {craqueCandidates.map(candidate => (
                                    <li key={candidate.jogador.id}>{candidate.jogador.nome} ({candidate.pontuacao_total.toFixed(1)} pts)</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-500">Votação para Craque do Domingo ainda não liberada.</div>
                        )}

                        {isModerador && !domingoDetalhes?.votacao_liberada && !domingoDetalhes?.craque_domingo_id && (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleLiberarVotacao(domingoId)}
                              disabled={liberarVotacao.isPending}
                            >
                              Liberar Votação
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Team do Domingo */}
                      {domingoDetalhes?.craque_domingo_id && teamOfTheDay.length > 0 && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-blue-500" />
                            Time do Domingo
                          </h3>
                          <div className="relative w-[375px] h-[450px] mx-auto">
                            <img src="/images/Quadra.png" alt="Quadra de Futsal" className="absolute inset-0 w-full h-full object-contain" />
                            {teamOfTheDay.map(player => (
                              <div 
                                key={player.jogador.id} 
                                className="absolute flex flex-col items-center justify-center"
                                style={{
                                  left: player.x + 'px',
                                  top: player.y + 'px',
                                  transform: 'translate(-50%, -50%)',
                                  width: '40px',
                                  height: '40px',
                                }}
                              >
                                <img 
                                  src={player.jogador.foto_url || 'https://via.placeholder.com/40'}
                                  alt={player.jogador.nome}
                                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                                />
                                <span className="text-[10px] font-semibold text-gray-800 mt-1 text-center whitespace-nowrap overflow-hidden text-ellipsis w-max max-w-[60px]">
                                  {player.jogador.nome.split(' ')[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botão Copiar Resumo para WhatsApp */}
                      {domingoDetalhes?.craque_domingo_id && (
                        <div className="mt-6 border-t pt-4 text-center">
                          <Button onClick={() => handleCopySummary(domingoDetalhes)} className="w-full md:w-auto">
                            Copiar Resumo para WhatsApp
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma partida finalizada encontrada</p>
              <p className="text-sm text-gray-400 mt-2">As partidas aparecerão aqui após serem finalizadas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Votação */}
      <Dialog open={modalVotoOpen} onOpenChange={setModalVotoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votar no Craque do Domingo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Seu Nome (Votante)</label>
              <Select value={votanteId?.toString() || ''} onValueChange={v => setVotanteId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nome" />
                </SelectTrigger>
                <SelectContent>
                  {jogadores?.map(j => (
                    <SelectItem key={j.id} value={j.id.toString()}>{j.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">Jogador Votado (Craque)</label>
              <Select value={votadoId?.toString() || ''} onValueChange={v => setVotadoId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o craque" />
                </SelectTrigger>
                <SelectContent>
                  {currentDomingoId && craqueCandidates.map(candidate => (
                    <SelectItem key={candidate.jogador.id} value={candidate.jogador.id.toString()}>{candidate.jogador.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {erroVoto && <div className="text-red-600 text-sm">{erroVoto}</div>}
            <Button onClick={handleRegistrarVoto} disabled={registrarVoto.isPending || !votanteId || !votadoId}>
              {registrarVoto.isPending ? 'Registrando Voto...' : 'Votar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Historico;
