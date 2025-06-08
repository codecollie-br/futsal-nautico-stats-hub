
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePartidas } from "@/hooks/useNautico";
import { Calendar, Trophy } from "lucide-react";
import PlacarPartida from "@/components/partida/PlacarPartida";

const Historico = () => {
  const { data: partidas, isLoading } = usePartidas();

  const partidasFinalizadas = partidas?.filter(p => p.status === 'FINALIZADA') || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div>Carregando histórico...</div>
      </div>
    );
  }

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

      {/* Lista de Partidas */}
      <div className="space-y-4">
        {partidasFinalizadas.length > 0 ? (
          partidasFinalizadas.map((partida) => (
            <Card key={partida.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {partida.domingo?.data_domingo && 
                      new Date(partida.domingo.data_domingo).toLocaleDateString('pt-BR', {
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
                <PlacarPartida 
                  golsLaranja={partida.time_laranja_gols}
                  golsPreto={partida.time_preto_gols}
                  status={partida.status}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
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
              </CardContent>
            </Card>
          ))
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
    </div>
  );
};

export default Historico;
