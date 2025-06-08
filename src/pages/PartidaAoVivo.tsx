import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePartidaAtual, useCreateDomingo, useCreatePartida, useIniciarPartida, useFinalizarPartida, useRegistrarEvento, useFilaEspera, useAdicionarFilaEspera, useJogadores, useAdicionarJogadorPartida, useAtualizarVitoriasConsecutivas } from "@/hooks/useNautico";
import { useToast } from "@/hooks/use-toast";
import Cronometro from "@/components/partida/Cronometro";
import PlacarPartida from "@/components/partida/PlacarPartida";
import { Plus, Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PartidaAoVivo = () => {
  const { data: partidaAtual, refetch } = usePartidaAtual();
  const createDomingo = useCreateDomingo();
  const createPartida = useCreatePartida();
  const iniciarPartida = useIniciarPartida();
  const finalizarPartida = useFinalizarPartida();
  const registrarEvento = useRegistrarEvento();
  const { toast } = useToast();
  const location = useLocation();
  const [isModerador, setIsModerador] = useState(false);

  const [tempoAtual, setTempoAtual] = useState(0);
  const [cronometroRodando, setCronometroRodando] = useState(false);
  const [modalGolOpen, setModalGolOpen] = useState<false | 'LARANJA' | 'PRETO'>(false);
  const [marcadorId, setMarcadorId] = useState<number | null>(null);
  const [assistenteId, setAssistenteId] = useState<number | null>(null);
  const [golContra, setGolContra] = useState(false);
  const [erroGol, setErroGol] = useState<string | null>(null);

  const domingoId = partidaAtual?.domingo?.id;
  const { data: filaEspera = [] } = useFilaEspera(domingoId);
  const { data: jogadores = [] } = useJogadores();
  const adicionarFila = useAdicionarFilaEspera();
  const [modalAddJogador, setModalAddJogador] = useState(false);
  const [jogadorSelecionado, setJogadorSelecionado] = useState<number | null>(null);
  const [erroAdd, setErroAdd] = useState<string | null>(null);

  // Jogadores já em times ou na fila
  const jogadoresEmTimes = new Set((partidaAtual?.jogadores_por_partida || []).map(jp => jp.jogador_id));
  const jogadoresNaFila = new Set(filaEspera.map(f => f.jogador_id));
  const jogadoresDisponiveis = jogadores.filter(j => !jogadoresEmTimes.has(j.id) && !jogadoresNaFila.has(j.id));

  const adicionarJogadorPartida = useAdicionarJogadorPartida();
  const [modalTimesOpen, setModalTimesOpen] = useState(false);
  const [timesSorteados, setTimesSorteados] = useState<{ laranja: any[]; preto: any[] }>({ laranja: [], preto: [] });
  const [filaRestante, setFilaRestante] = useState<any[]>([]);
  const [erroTimes, setErroTimes] = useState<string | null>(null);

  const atualizarVitoriasConsecutivas = useAtualizarVitoriasConsecutivas();
  const [modalParImpar, setModalParImpar] = useState(false);
  const [parImparVencedor, setParImparVencedor] = useState<'LARANJA' | 'PRETO' | null>(null);
  const [mensagemPosPartida, setMensagemPosPartida] = useState<string | null>(null);

  const handleTempoChange = useCallback((segundos: number) => {
    setTempoAtual(segundos);
  }, []);

  const handleStatusChange = useCallback((rodando: boolean) => {
    setCronometroRodando(rodando);
  }, []);

  const criarNovaPartida = async () => {
    try {
      // Primeiro criar o domingo de hoje se não existir
      const hoje = new Date().toISOString().split('T')[0];
      const domingo = await createDomingo.mutateAsync(hoje);
      
      // Depois criar a partida
      await createPartida.mutateAsync(domingo.id);
      
      toast({
        title: "Partida criada!",
        description: "Nova partida criada com sucesso",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleIniciarPartida = async () => {
    if (!partidaAtual) return;
    
    try {
      await iniciarPartida.mutateAsync(partidaAtual.id);
      toast({
        title: "Partida iniciada!",
        description: "A partida foi iniciada com sucesso",
      });
      refetch();
    } catch (error) {
      console.error('Erro ao iniciar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizarPartida = async () => {
    if (!partidaAtual) return;
    
    try {
      const duracaoMinutos = Math.floor(tempoAtual / 60);
      let vencedor = 'EMPATE';
      
      if (partidaAtual.time_laranja_gols > partidaAtual.time_preto_gols) {
        vencedor = 'LARANJA';
      } else if (partidaAtual.time_preto_gols > partidaAtual.time_laranja_gols) {
        vencedor = 'PRETO';
      }
      
      await finalizarPartida.mutateAsync({
        partida_id: partidaAtual.id,
        duracao_minutos: duracaoMinutos,
        vencedor
      });
      
      toast({
        title: "Partida finalizada!",
        description: "A partida foi finalizada com sucesso",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const jogadoresLaranja = partidaAtual?.jogadores_por_partida?.filter(jp => jp.time === 'LARANJA').map(jp => jp.jogador).filter(Boolean) || [];
  const jogadoresPreto = partidaAtual?.jogadores_por_partida?.filter(jp => jp.time === 'PRETO').map(jp => jp.jogador).filter(Boolean) || [];

  const abrirModalGol = (time: 'LARANJA' | 'PRETO') => {
    setModalGolOpen(time);
    setMarcadorId(null);
    setAssistenteId(null);
    setGolContra(false);
    setErroGol(null);
  };

  const handleRegistrarGol = async () => {
    if (!partidaAtual || !modalGolOpen) return;
    if (!golContra && !marcadorId) {
      setErroGol('Selecione o marcador ou marque gol contra.');
      return;
    }
    try {
      await registrarEvento.mutateAsync({
        partida_id: partidaAtual.id,
        tipo_evento: 'GOL',
        minuto_partida: Math.floor(tempoAtual / 60),
        jogador_gol_id: golContra ? null : marcadorId,
        jogador_assistencia_id: golContra ? null : assistenteId,
        is_gol_contra: golContra,
        time_marcador: modalGolOpen
      });
      setModalGolOpen(false);
      toast({ title: 'Gol registrado!' });
    } catch (err: any) {
      setErroGol(err.message || 'Erro ao registrar gol');
    }
  };

  const handleAddJogadorFila = async () => {
    if (!domingoId || !jogadorSelecionado) {
      setErroAdd('Selecione um jogador.');
      return;
    }
    try {
      await adicionarFila.mutateAsync({
        domingo_id: domingoId,
        jogador_id: jogadorSelecionado,
        ordem: filaEspera.length + 1
      });
      setModalAddJogador(false);
      setJogadorSelecionado(null);
      setErroAdd(null);
      toast({ title: 'Jogador adicionado à fila!' });
    } catch (err: any) {
      setErroAdd(err.message || 'Erro ao adicionar jogador');
    }
  };

  // Função para sortear times conforme regra
  const sortearTimes = () => {
    const goleiros = filaEspera.filter(f => f.jogador?.is_goleiro);
    const linha = filaEspera.filter(f => !f.jogador?.is_goleiro);
    if (goleiros.length < 2 || linha.length < 8) return;
    const [goleiroLaranja, goleiroPreto] = goleiros;
    const linhaSorteada = [...linha.slice(0, 8)].sort(() => Math.random() - 0.5);
    setTimesSorteados({
      laranja: [goleiroLaranja, ...linhaSorteada.slice(0, 4)],
      preto: [goleiroPreto, ...linhaSorteada.slice(4, 8)]
    });
    setFilaRestante([...goleiros.slice(2), ...linha.slice(8)]);
    setModalTimesOpen(true);
    setErroTimes(null);
  };

  // Funções para mover jogadores entre times/fila
  const moverParaTime = (jogador, time) => {
    setTimesSorteados(prev => {
      const outroTime = time === 'laranja' ? 'preto' : 'laranja';
      return {
        ...prev,
        [time]: [...prev[time], jogador],
        [outroTime]: prev[outroTime].filter(j => j.jogador_id !== jogador.jogador_id)
      };
    });
    setFilaRestante(prev => prev.filter(j => j.jogador_id !== jogador.jogador_id));
  };
  const removerDoTime = (jogador, time) => {
    setTimesSorteados(prev => ({
      ...prev,
      [time]: prev[time].filter(j => j.jogador_id !== jogador.jogador_id)
    }));
    setFilaRestante(prev => [...prev, jogador]);
  };

  // Validação antes de confirmar
  const validarTimes = () => {
    const goleirosL = timesSorteados.laranja.filter(j => j.jogador?.is_goleiro).length;
    const goleirosP = timesSorteados.preto.filter(j => j.jogador?.is_goleiro).length;
    if (timesSorteados.laranja.length !== 5 || timesSorteados.preto.length !== 5) {
      setErroTimes('Cada time deve ter 5 jogadores.');
      return false;
    }
    if (goleirosL < 1 || goleirosP < 1) {
      setErroTimes('Cada time deve ter pelo menos 1 goleiro.');
      return false;
    }
    setErroTimes(null);
    return true;
  };

  // Confirmação: atualiza banco/fila/times
  const confirmarTimes = async () => {
    if (!validarTimes() || !partidaAtual) return;
    try {
      // Adiciona jogadores aos times
      for (const j of timesSorteados.laranja) {
        await adicionarJogadorPartida.mutateAsync({ partida_id: partidaAtual.id, jogador_id: j.jogador_id, time: 'LARANJA' });
      }
      for (const j of timesSorteados.preto) {
        await adicionarJogadorPartida.mutateAsync({ partida_id: partidaAtual.id, jogador_id: j.jogador_id, time: 'PRETO' });
      }
      setModalTimesOpen(false);
      toast({ title: 'Times confirmados!' });
      refetch();
    } catch (err: any) {
      setErroTimes(err.message || 'Erro ao confirmar times');
    }
  };

  // Função para lógica pós-partida
  const logicaPosPartida = async (resultado: 'LARANJA' | 'PRETO' | 'EMPATE') => {
    if (!partidaAtual || !partidaAtual.domingo) return;
    const domingo = partidaAtual.domingo;
    const jogadoresLaranja = (partidaAtual.jogadores_por_partida || []).filter(jp => jp.time === 'LARANJA');
    const jogadoresPreto = (partidaAtual.jogadores_por_partida || []).filter(jp => jp.time === 'PRETO');
    const totalJogadores = (partidaAtual.jogadores_por_partida || []).length;
    const isQuatroTimes = totalJogadores >= 20; // 4 times = 20 jogadores (16 linha + 4 goleiros)
    let vitoriasL = domingo.vitorias_laranja_consecutivas || 0;
    let vitoriasP = domingo.vitorias_preto_consecutivas || 0;
    let timeSai = [];
    let timeFica = [];
    let prioridadeFila = null;
    let mensagem = '';

    // Empate
    if (resultado === 'EMPATE') {
      if (isQuatroTimes) {
        timeSai = [...jogadoresLaranja, ...jogadoresPreto];
        mensagem = 'Empate: ambos os times saem para dar lugar aos próximos.';
      } else {
        setModalParImpar(true);
        return; // Modal decidirá quem sai
      }
      vitoriasL = 0;
      vitoriasP = 0;
    } else {
      // Vitória/Derrota
      if (resultado === 'LARANJA') {
        vitoriasL += 1;
        vitoriasP = 0;
        if (vitoriasL === 3) {
          timeSai = [...jogadoresLaranja, ...jogadoresPreto];
          prioridadeFila = 'LARANJA';
          mensagem = 'Laranja venceu a 3ª seguida: ambos os times saem, Laranja tem prioridade na fila.';
          vitoriasL = 0;
        } else {
          timeSai = jogadoresPreto;
          timeFica = jogadoresLaranja;
          mensagem = 'Laranja venceu: Preto vai para a fila, Laranja permanece.';
        }
      } else if (resultado === 'PRETO') {
        vitoriasP += 1;
        vitoriasL = 0;
        if (vitoriasP === 3) {
          timeSai = [...jogadoresLaranja, ...jogadoresPreto];
          prioridadeFila = 'PRETO';
          mensagem = 'Preto venceu a 3ª seguida: ambos os times saem, Preto tem prioridade na fila.';
          vitoriasP = 0;
        } else {
          timeSai = jogadoresLaranja;
          timeFica = jogadoresPreto;
          mensagem = 'Preto venceu: Laranja vai para a fila, Preto permanece.';
        }
      }
    }
    // Atualizar vitórias consecutivas
    await atualizarVitoriasConsecutivas.mutateAsync({ domingo_id: domingo.id, cor: 'LARANJA', valor: vitoriasL });
    await atualizarVitoriasConsecutivas.mutateAsync({ domingo_id: domingo.id, cor: 'PRETO', valor: vitoriasP });
    // Atualizar fila: adicionar timeSai ao final (prioridade se aplicável)
    // ... (aqui entraria a lógica de atualizar a fila no banco)
    setMensagemPosPartida(mensagem);
    // Atualizar interface (refetch etc)
    refetch();
  };

  // Handler para decisão de par ou ímpar
  const decidirParImpar = (vencedor: 'LARANJA' | 'PRETO') => {
    setParImparVencedor(vencedor);
    setModalParImpar(false);
    // O time que perder o par ou ímpar sai
    logicaPosPartida(vencedor === 'LARANJA' ? 'PRETO' : 'LARANJA');
  };

  useEffect(() => {
    if (!partidaAtual?.domingo?.token_moderacao) {
      setIsModerador(false);
      return;
    }
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    setIsModerador(token === partidaAtual.domingo.token_moderacao);
  }, [location.search, partidaAtual?.domingo?.token_moderacao]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Partida Ao Vivo</h1>
        <p className="text-gray-600">Acompanhe e gerencie a partida em tempo real</p>
        {!isModerador && (
          <p className="text-sm text-orange-500 mt-2">Modo somente leitura. Para moderar, acesse com o token de moderação.</p>
        )}
      </div>

      {!partidaAtual ? (
        /* Criar Nova Partida */
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Nenhuma partida ativa</h3>
            <p className="text-gray-600 mb-6">Crie uma nova partida para começar</p>
            <Button 
              onClick={criarNovaPartida}
              disabled={createDomingo.isPending || createPartida.isPending}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Partida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Placar */}
          <PlacarPartida 
            golsLaranja={partidaAtual.time_laranja_gols}
            golsPreto={partidaAtual.time_preto_gols}
            status={partidaAtual.status}
          />

          {/* Cronômetro */}
          <Cronometro 
            onTempoChange={handleTempoChange}
            onStatusChange={handleStatusChange}
            isPartidaAtiva={partidaAtual.status !== 'FINALIZADA'}
          />

          {/* Controles da Partida */}
          <Card>
            <CardHeader>
              <CardTitle>Controles da Partida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-4">
                {partidaAtual.status === 'AGENDADA' && isModerador && (
                  <Button 
                    onClick={handleIniciarPartida}
                    disabled={iniciarPartida.isPending}
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Partida
                  </Button>
                )}
                {partidaAtual.status === 'EM_ANDAMENTO' && isModerador && (
                  <Button 
                    onClick={handleFinalizarPartida}
                    disabled={finalizarPartida.isPending}
                    variant="destructive"
                    size="lg"
                  >
                    Encerrar Partida
                  </Button>
                )}
                {partidaAtual.status === 'FINALIZADA' && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">Partida Finalizada</p>
                    <p className="text-gray-600">Duração: {partidaAtual.duracao_minutos} minutos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Partida */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Partida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Data:</p>
                  <p>{partidaAtual.domingo?.data_domingo && 
                    new Date(partidaAtual.domingo.data_domingo).toLocaleDateString('pt-BR')
                  }</p>
                </div>
                <div>
                  <p className="font-semibold">Status:</p>
                  <p>{partidaAtual.status}</p>
                </div>
                {partidaAtual.hora_inicio && (
                  <div>
                    <p className="font-semibold">Início:</p>
                    <p>{new Date(partidaAtual.hora_inicio).toLocaleTimeString('pt-BR')}</p>
                  </div>
                )}
                {partidaAtual.hora_fim && (
                  <div>
                    <p className="font-semibold">Fim:</p>
                    <p>{new Date(partidaAtual.hora_fim).toLocaleTimeString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {partidaAtual && isModerador && partidaAtual.status === 'EM_ANDAMENTO' && (
            <div className="flex justify-center gap-4 mb-4">
              <Button style={{ background: '#ff9800', color: '#fff' }} onClick={() => abrirModalGol('LARANJA')}>
                Marcar Gol Laranja
              </Button>
              <Button style={{ background: '#222', color: '#fff' }} onClick={() => abrirModalGol('PRETO')}>
                Marcar Gol Preto
              </Button>
            </div>
          )}

          {/* Fila de Espera */}
          {partidaAtual && (
            <Card className="border-2 border-dashed border-blue-400 bg-blue-50">
              <CardHeader>
                <CardTitle>Fila de Espera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  {filaEspera.length === 0 && <span className="text-gray-500">Nenhum jogador na fila de espera</span>}
                  {filaEspera.map((f, idx) => (
                    <span key={f.jogador_id} className="px-3 py-1 rounded-full bg-blue-200 text-blue-900 font-semibold border border-blue-400">
                      {idx + 1}. {f.jogador?.nome || 'Desconhecido'}
                    </span>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setModalAddJogador(true)}>
                  Adicionar Jogador
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Botão Sortear Times */}
          {isModerador && filaEspera.filter(f => f.jogador?.is_goleiro).length >= 2 && filaEspera.filter(f => !f.jogador?.is_goleiro).length >= 8 && (
            <Button className="mb-4" onClick={sortearTimes} variant="secondary">Sortear Times</Button>
          )}
        </div>
      )}

      <Dialog open={!!modalGolOpen} onOpenChange={setModalGolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Gol {modalGolOpen === 'LARANJA' ? 'Laranja' : 'Preto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Checkbox checked={golContra} onCheckedChange={setGolContra} id="gol-contra" />
            <label htmlFor="gol-contra" className="ml-2">Gol Contra</label>
            {!golContra && (
              <>
                <div>
                  <label className="block mb-1">Marcador</label>
                  <Select value={marcadorId?.toString() || ''} onValueChange={v => setMarcadorId(Number(v))}>
                    <option value="">Selecione</option>
                    {(modalGolOpen === 'LARANJA' ? jogadoresLaranja : jogadoresPreto).map(j => (
                      <option key={j.id} value={j.id}>{j.nome}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block mb-1">Assistente (opcional)</label>
                  <Select value={assistenteId?.toString() || ''} onValueChange={v => setAssistenteId(Number(v))}>
                    <option value="">Nenhum</option>
                    {(modalGolOpen === 'LARANJA' ? jogadoresLaranja : jogadoresPreto).map(j => (
                      <option key={j.id} value={j.id}>{j.nome}</option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {erroGol && <div className="text-red-600 text-sm">{erroGol}</div>}
            <Button onClick={handleRegistrarGol} disabled={registrarEvento.isPending}>
              {registrarEvento.isPending ? 'Registrando...' : 'Registrar Gol'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Jogador */}
      <Dialog open={modalAddJogador} onOpenChange={setModalAddJogador}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Jogador à Fila</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={jogadorSelecionado?.toString() || ''} onValueChange={v => setJogadorSelecionado(Number(v))}>
              <option value="">Selecione um jogador</option>
              {jogadoresDisponiveis.map(j => (
                <option key={j.id} value={j.id}>{j.nome}</option>
              ))}
            </Select>
            {erroAdd && <div className="text-red-600 text-sm">{erroAdd}</div>}
            <Button onClick={handleAddJogadorFila} disabled={adicionarFila.isPending}>
              {adicionarFila.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Montagem dos Times */}
      <Dialog open={modalTimesOpen} onOpenChange={setModalTimesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Montagem dos Times</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-orange-600 mb-2">Laranja</h3>
              {timesSorteados.laranja.map(j => (
                <div key={j.jogador_id} className="flex items-center gap-2 mb-1">
                  <span>{j.jogador?.nome}</span>
                  <Button size="xs" variant="outline" onClick={() => removerDoTime(j, 'laranja')}>Remover</Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => {}} disabled>Adicionar</Button>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-black mb-2">Preto</h3>
              {timesSorteados.preto.map(j => (
                <div key={j.jogador_id} className="flex items-center gap-2 mb-1">
                  <span>{j.jogador?.nome}</span>
                  <Button size="xs" variant="outline" onClick={() => removerDoTime(j, 'preto')}>Remover</Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => {}} disabled>Adicionar</Button>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-600 mb-2">Fila de Espera</h3>
              {filaRestante.map(j => (
                <div key={j.jogador_id} className="flex items-center gap-2 mb-1">
                  <span>{j.jogador?.nome}</span>
                  <Button size="xs" variant="outline" onClick={() => moverParaTime(j, timesSorteados.laranja.length < 5 ? 'laranja' : 'preto')}>Colocar em {timesSorteados.laranja.length < 5 ? 'Laranja' : 'Preto'}</Button>
                </div>
              ))}
            </div>
          </div>
          {erroTimes && <div className="text-red-600 text-sm mt-2">{erroTimes}</div>}
          <Button onClick={confirmarTimes} disabled={adicionarJogadorPartida.isPending} className="mt-4 w-full">
            {adicionarJogadorPartida.isPending ? 'Confirmando...' : 'Confirmar Times'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal Par ou Ímpar */}
      <Dialog open={modalParImpar} onOpenChange={setModalParImpar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empate: Par ou Ímpar dos Goleiros</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Selecione qual time venceu o par ou ímpar:</p>
            <Button onClick={() => decidirParImpar('LARANJA')}>Laranja</Button>
            <Button onClick={() => decidirParImpar('PRETO')}>Preto</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mensagem Pós-Partida */}
      {mensagemPosPartida && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent>
            <span className="text-green-900 font-bold">{mensagemPosPartida}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartidaAoVivo;
