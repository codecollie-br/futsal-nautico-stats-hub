
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Jogador } from "@/types/nautico";

interface JogadorCardProps {
  jogador: Jogador;
  showStats?: boolean;
}

const JogadorCard = ({ jogador, showStats = true }: JogadorCardProps) => {
  const getWinRate = () => {
    const totalJogos = jogador.vitorias_pessoais + jogador.empates_pessoais + jogador.derrotas_pessoais;
    if (totalJogos === 0) return 0;
    return Math.round((jogador.vitorias_pessoais / totalJogos) * 100);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Foto do Jogador */}
          <div className="relative">
            {jogador.foto_url ? (
              <img
                src={jogador.foto_url}
                alt={jogador.nome}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {jogador.is_goleiro && (
              <Badge className="absolute -bottom-1 -right-1 bg-yellow-500 text-xs px-1 py-0">
                GOL
              </Badge>
            )}
          </div>

          {/* Informações do Jogador */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{jogador.nome}</h3>
            {jogador.apelido && (
              <p className="text-sm text-gray-600">"{jogador.apelido}"</p>
            )}
            {jogador.bio && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{jogador.bio}</p>
            )}

            {/* Estatísticas */}
            {showStats && (
              <div className="flex space-x-4 mt-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{jogador.vitorias_pessoais}</div>
                  <div className="text-gray-500">V</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{jogador.empates_pessoais}</div>
                  <div className="text-gray-500">E</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{jogador.derrotas_pessoais}</div>
                  <div className="text-gray-500">D</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{getWinRate()}%</div>
                  <div className="text-gray-500">Win</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JogadorCard;
