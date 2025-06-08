
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlacarPartidaProps {
  golsLaranja: number;
  golsPreto: number;
  status: string;
}

const PlacarPartida = ({ golsLaranja, golsPreto, status }: PlacarPartidaProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return <Badge className="bg-green-500">AO VIVO</Badge>;
      case 'FINALIZADA':
        return <Badge className="bg-gray-500">FINALIZADA</Badge>;
      default:
        return <Badge className="bg-blue-500">AGENDADA</Badge>;
    }
  };

  const getVencedor = () => {
    if (golsLaranja > golsPreto) return 'LARANJA';
    if (golsPreto > golsLaranja) return 'PRETO';
    return 'EMPATE';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <span>Placar</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center space-x-8">
          {/* Time Laranja */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
              getVencedor() === 'LARANJA' ? 'bg-orange-600 ring-4 ring-orange-300' : 'bg-orange-500'
            }`}>
              {golsLaranja}
            </div>
            <p className="mt-2 font-semibold text-orange-600">LARANJA</p>
          </div>

          {/* VS */}
          <div className="text-2xl font-bold text-gray-400">
            VS
          </div>

          {/* Time Preto */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
              getVencedor() === 'PRETO' ? 'bg-gray-800 ring-4 ring-gray-500' : 'bg-gray-700'
            }`}>
              {golsPreto}
            </div>
            <p className="mt-2 font-semibold text-gray-700">PRETO</p>
          </div>
        </div>

        {status === 'FINALIZADA' && (
          <div className="text-center mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {getVencedor() === 'EMPATE' ? 'EMPATE' : `VITÓRIA ${getVencedor()}`}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlacarPartida;
