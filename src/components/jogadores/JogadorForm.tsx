
import React, { useState, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nauticoSupabase } from "@/integrations/supabase/nautico-client";
import { Jogador } from "@/types/nautico";

interface JogadorFormProps {
  jogador?: Partial<Jogador>;
  onSave: (dados: any) => void;
}

const JogadorForm: React.FC<JogadorFormProps> = ({ jogador, onSave }) => {
  console.log("JogadorForm: jogador prop recebida", jogador);
  const [nome, setNome] = useState(jogador?.nome || "");
  const [apelido, setApelido] = useState(jogador?.apelido || "");
  const [bio, setBio] = useState(jogador?.bio || "");
  const [isGoleiro, setIsGoleiro] = useState(jogador?.is_goleiro || false);
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(jogador?.foto_url);
  const [image, setImage] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropping, setCropping] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
      setCropping(true);
    }
  };

  const getCroppedImg = async (imageSrc: File, crop: any) => {
    return new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageSrc);
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = crop.width;
          canvas.height = crop.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject();
          ctx.drawImage(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
          );
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject();
          }, "image/jpeg");
        };
      };
      reader.onerror = reject;
    });
  };

  const handleCropSave = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!image || !croppedAreaPixels) return;
      const croppedImg = await getCroppedImg(image, croppedAreaPixels);
      const fileName = `jogadores/${Date.now()}_${image.name}`;
      const { data, error } = await nauticoSupabase.storage
        .from("fotos-jogadores")
        .upload(fileName, croppedImg, { contentType: "image/jpeg" });
      if (!error) {
        const { data: publicUrl } = nauticoSupabase.storage
          .from("fotos-jogadores")
          .getPublicUrl(fileName);
        setFotoUrl(publicUrl.publicUrl);
        setCropping(false);
      } else {
        setError("Erro ao fazer upload da imagem");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        id: jogador?.id,
        nome,
        apelido,
        bio,
        is_goleiro: isGoleiro,
        foto_url: fotoUrl,
      };
      console.log("JogadorForm: Payload para onSave", payload);
      await onSave(payload);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar jogador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Nome</label>
        <Input value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div>
        <label className="block font-medium mb-1">Apelido</label>
        <Input value={apelido} onChange={e => setApelido(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium mb-1">Biografia</label>
        <Input value={bio} onChange={e => setBio(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium mb-1">Foto</label>
        {fotoUrl && (
          <img src={fotoUrl} alt="Foto do jogador" className="w-24 h-24 rounded-full object-cover mb-2" />
        )}
        <Input type="file" accept="image/*" onChange={handleImageChange} ref={inputFileRef} />
        {cropping && image && (
          <div className="relative w-full h-64 bg-gray-200 mt-2">
            <Cropper
              image={URL.createObjectURL(image)}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <Button type="button" onClick={handleCropSave} className="mt-2">Salvar Corte</Button>
          </div>
        )}
      </div>
      <div>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={isGoleiro} onChange={e => setIsGoleiro(e.target.checked)} />
          <span className="ml-2">Goleiro</span>
        </label>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
    </form>
  );
};

export default JogadorForm;
