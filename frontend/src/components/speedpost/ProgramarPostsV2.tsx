import React, { useState, useRef } from 'react';
import { ConnectedAccount } from './types';
import { LuInstagram, LuUploadCloud, LuInfo, LuLock, LuVideo, LuAlertTriangle } from 'react-icons/lu';

interface ProgramarPostsV2Props {
  accounts: ConnectedAccount[];
  selectedAccount: ConnectedAccount | null;
  onSelectAccount: (acc: ConnectedAccount) => void;
  onNavigateToAccounts: () => void;
  onScheduleSingle: (payload: { video_url: string; caption: string; scheduled_at: string; publishNow: boolean }) => Promise<void>;
  isSubmitting: boolean;
}

export const ProgramarPostsV2: React.FC<ProgramarPostsV2Props> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onNavigateToAccounts,
  onScheduleSingle,
  isSubmitting
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [caption, setCaption] = useState("Meu Reels automático incrível! 🚀 #speedpost #instagram");
  const [trialReelMode, setTrialReelMode] = useState<'Desativado' | 'Manual (via App)' | 'Automática (Performance)'>('Desativado');
  const [scheduledDateTime, setScheduledDateTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));

  const processFile = async (file: File) => {
    setSelectedFileName(file.name);
    setIsUploading(true);
    const localBlob = URL.createObjectURL(file);
    setPreviewUrl(localBlob);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:7001/api/reels/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setVideoUrl(data.url);
        }
      }
    } catch (err) {
      console.log("Erro no upload CDN.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };


  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Programar Posts(V2)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Configure profile, destinos, mídia e agenda com clareza</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-[#13111C] border border-[#201C2F] text-xs text-gray-400 flex items-center gap-1.5">
          <LuLock className="text-purple-400" />
          <span className="font-semibold text-gray-300">Rápido</span>
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: STEPS */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* CARD 1: PROFILE SELECTION */}
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#201C2F] text-xs font-bold flex items-center justify-center text-gray-300">1</span>
                <h3 className="font-bold text-sm text-white">Selecionar Conta p/ Publicação</h3>
              </div>
              <button 
                onClick={onNavigateToAccounts}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                + Gerenciar Contas
              </button>
            </div>
            
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-400 block">Selecione qual perfil do Instagram vai postar:</label>
                <select
                  value={selectedAccount?.ig_user_id || ''}
                  onChange={(e) => {
                    const found = accounts.find(a => a.ig_user_id === e.target.value);
                    if (found) onSelectAccount(found);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-purple-500/40 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id || acc.ig_user_id} value={acc.ig_user_id}>
                      {acc.account_name} (ID: {acc.ig_user_id})
                    </option>
                  ))}
                </select>

                {selectedAccount && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <img 
                        src={selectedAccount.profile_picture_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150"} 
                        className="w-8 h-8 rounded-full object-cover border border-purple-500/50" 
                        alt="Profile"
                      />
                      <div>
                        <p className="font-bold text-xs text-white">{selectedAccount.account_name}</p>
                        <p className="text-[10px] text-purple-300 font-mono">Token Ativo: {selectedAccount.access_token.slice(0, 15)}...</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Ativa
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0D0B14] border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
                <span>Nenhuma conta conectada.</span>
                <button onClick={onNavigateToAccounts} className="text-purple-400 hover:underline font-bold">Conectar em Contas →</button>
              </div>
            )}
          </div>

          {/* CARD 2: ONDE PUBLICAR */}
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#201C2F] text-xs font-bold flex items-center justify-center text-gray-300">2</span>
              <h3 className="font-bold text-sm text-white">Onde publicar</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0B14] border border-purple-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs">
                  <LuInstagram />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instagram Reels</p>
                  <p className="text-[11px] text-gray-400">{selectedAccount ? selectedAccount.account_name : '@henriviniciuscasemiro'}</p>
                </div>
              </div>
              <input type="checkbox" checked readOnly className="w-4 h-4 accent-purple-600 rounded" />
            </div>
          </div>

          {/* CARD 3: TIPO DE PUBLICAÇÃO */}
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#201C2F] text-xs font-bold flex items-center justify-center text-gray-300">3</span>
              <h3 className="font-bold text-sm text-white">Tipo de Publicação</h3>
            </div>

            <div className="p-4 rounded-xl bg-purple-600/10 border-2 border-purple-500 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white text-lg">
                <LuVideo />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Reels</p>
                <p className="text-xs text-gray-400">Vídeos verticais de alta entrega</p>
              </div>
            </div>
          </div>

          {/* CARD: MODO TRIAL REEL */}
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <span>🚀</span>
              <h3 className="font-bold text-sm text-white">Modo Trial Reel (Reels de Teste)</h3>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Trial Reels são compartilhados inicialmente apenas com não-seguidores. Após graduação, ficam visíveis para todos.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <LuAlertTriangle className="text-amber-400" /> Atenção:
              </p>
              <p className="text-[11px] text-amber-300/90 leading-normal">
                Trial Reels só funcionam para contas com <strong>1k de seguidores</strong>. Se sua conta tiver menos de 1k de seguidores, o post será publicado sem os parâmetros de teste.
              </p>
            </div>

            {/* TOGGLES */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['Desativado', 'Manual (via App)', 'Automática (Performance)'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTrialReelMode(mode)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    trialReelMode === mode 
                      ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(109,40,217,0.3)]' 
                      : 'bg-[#0D0B14] text-gray-400 border-[#201C2F] hover:border-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium pt-1">
              <span>⚠️</span> Limite: 10 Reels de teste por dia por perfil conectado (Apenas Instagram).
            </p>
          </div>

          {/* CARD 4: UPLOAD & CONFIGURAÇÃO */}
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#201C2F] text-xs font-bold flex items-center justify-center text-gray-300">4</span>
              <h3 className="font-bold text-sm text-white">Upload & Mídia</h3>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/mov,video/webm,image/*"
              className="hidden"
            />

            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="p-8 rounded-2xl border-2 border-dashed border-purple-500/30 bg-[#0D0B14]/50 hover:bg-[#0D0B14] hover:border-purple-500 transition-all text-center space-y-2 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 flex items-center justify-center mx-auto text-xl transition-transform">
                  <LuUploadCloud />
                </div>

                {isUploading ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-400 flex items-center justify-center gap-2 animate-pulse">
                      <span>⚡</span> Enviando mídia para Cloud Storage CDN...
                    </p>
                    <p className="text-[11px] text-gray-400">Aguarde alguns segundos enquanto preparamos a URL da Meta API</p>
                  </div>
                ) : selectedFileName ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <span>✓</span> Mídia Selecionada: {selectedFileName}
                    </p>
                    <p className="text-[11px] text-purple-300">Clique para escolher outro arquivo</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-white">Arraste vídeos ou clique para selecionar</p>
                    <p className="text-[11px] text-gray-400">Formatos aceitos: MP4, MOV, WebM</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-gray-400">
              <p className="flex items-center gap-1.5 text-purple-300">
                <LuInfo /> Máximo de 150 mídias por agendamento. Para mais, faça outro lote.
              </p>
              <p className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span>⚠️</span> Somente vídeos 1080x1920 (9:16 vertical) são aceitos — padrão Instagram Reels
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RESUMO & DISPARO */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-4 sticky top-6">
            <h3 className="font-bold text-sm text-white">Resumo do Post</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#201C2F]">
                <span className="text-gray-400">Profile</span>
                <span className="font-semibold text-white">{selectedAccount ? selectedAccount.account_name : '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#201C2F]">
                <span className="text-gray-400">Destinos</span>
                <span className="font-semibold text-purple-400">1 selecionado</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#201C2F]">
                <span className="text-gray-400">Tipo</span>
                <span className="font-semibold text-white">Reels</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#201C2F]">
                <span className="text-gray-400">Mídias</span>
                <span className="font-semibold text-emerald-400">1 Mídia Pronta</span>
              </div>
            </div>

            {/* LEGENDA INPUT */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-300 block">Legenda do Post:</label>
              <textarea 
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Escreva a legenda e hashtags..."
              />
            </div>

            {/* DATA HORA AGENDAMENTO */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">Data e Hora de Disparo:</label>
              <input 
                type="datetime-local" 
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5 pt-3">
              <button
                onClick={() => onScheduleSingle({ video_url: videoUrl, caption, scheduled_at: new Date(scheduledDateTime).toISOString(), publishNow: false })}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] transition-all flex items-center justify-center gap-2 border border-purple-400/30 disabled:opacity-50"
              >
                <span>🚀</span>
                <span>{isSubmitting ? 'Agendando...' : 'Agendar Post'}</span>
              </button>

              <button
                onClick={() => onScheduleSingle({ video_url: videoUrl, caption, scheduled_at: new Date().toISOString(), publishNow: true })}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>⚡</span>
                <span>{isSubmitting ? 'Publicando...' : 'Publicar Agora no Instagram'}</span>
              </button>
            </div>

            {/* PREVIEW DA MÍDIA */}
            <div className="pt-4 border-t border-[#201C2F] space-y-2">
              <h4 className="font-semibold text-xs text-gray-300">Preview da Mídia</h4>
              <div className="aspect-[9/16] w-full max-h-60 rounded-xl bg-[#0D0B14] border border-[#201C2F] overflow-hidden flex items-center justify-center relative">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-white bg-purple-600/80 px-2 py-0.5 rounded w-fit">Reels Preview</span>
                  <p className="text-[10px] text-gray-200 line-clamp-2">{caption}</p>
                </div>
              </div>
            </div>

            {/* DICAS */}
            <div className="p-3 rounded-xl bg-[#0D0B14] text-[11px] text-gray-400 space-y-1">
              <p className="font-bold text-gray-300">💡 Dicas:</p>
              <p>• Selecione ao menos 1 destino</p>
              <p>• Faça upload da mídia antes de agendar</p>
              <p>• Vídeo vertical recomendado para Reels</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
