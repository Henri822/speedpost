import React from 'react';
import { ScheduledPostItem } from './types';
import { LuClock, LuCheckCircle2, LuTrendingUp, LuCalendar, LuPlusCircle, LuAlertTriangle, LuInfo } from 'react-icons/lu';

interface DashboardViewProps {
  posts: ScheduledPostItem[];
  publishedCount: number;
  onNavigateToSchedule: () => void;
  onPublishNow: (id: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  posts,
  publishedCount,
  onNavigateToSchedule,
  onPublishNow
}) => {
  const pendingPosts = posts.filter(p => p.status === 'PENDING');

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* HEADER METRICS */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h2>
        <p className="text-xs text-gray-400 mt-0.5">Visão geral dos agendamentos</p>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-4 flex items-center justify-between hover:border-purple-500/40 transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-400">Tempo economizado</p>
            <p className="text-xl font-extrabold text-white mt-1">45 min economizados</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Tempo economizado • 0 publicações este mês</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg">
            <LuClock />
          </div>
        </div>

        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-400">Publicados</p>
            <p className="text-xl font-extrabold text-white mt-1">{publishedCount}</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">+1 hoje</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
            <LuCheckCircle2 />
          </div>
        </div>

        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/40 transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-400">Agendados</p>
            <p className="text-xl font-extrabold text-white mt-1">{pendingPosts.length}</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">+0 hoje</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
            <LuCalendar />
          </div>
        </div>

        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-4 flex items-center justify-between hover:border-purple-500/40 transition-all">
          <div>
            <p className="text-xs font-semibold text-gray-400">Taxa de sucesso</p>
            <p className="text-xl font-extrabold text-white mt-1">100%</p>
            <p className="text-[10px] text-purple-400 font-semibold mt-0.5">Taxa de sucesso Meta API</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg">
            <LuTrendingUp />
          </div>
        </div>

      </div>

      {/* BANNER NOTÍCIA */}
      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
        <span>🔥</span>
        <span>Hoje o SpeedPost já publicou <strong className="text-white">{publishedCount} conteúdos</strong> para você.</span>
      </div>

      {/* GRID SECUNDÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Próximas publicações</h3>
            <button onClick={onNavigateToSchedule} className="text-xs text-purple-400 font-bold hover:underline">Agendar agora →</button>
          </div>
          <p className="text-xs text-gray-400">
            {pendingPosts.length > 0 
              ? `${pendingPosts.length} post(s) na fila de envio.`
              : "Você ainda não tem posts agendados."}
          </p>
        </div>

        <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Status da operação</h3>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">✓ TUDO CERTO</span>
          </div>
          <p className="text-xs text-gray-400">Nenhuma ação necessária no momento. Conexão Meta ativa.</p>
        </div>

      </div>

      {/* TABELA POSTS RECENTES */}
      <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-xs text-white uppercase tracking-wider">Posts Recentes</h3>
        
        {posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0D0B14] text-gray-500 flex items-center justify-center mx-auto text-xl">
              <LuPlusCircle />
            </div>
            <p className="text-xs font-bold text-white">Nenhum post ainda</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Comece agendando seu primeiro post. Seus posts serão publicados conforme programado.
            </p>
            <button onClick={onNavigateToSchedule} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(109,40,217,0.4)]">
              Agendar post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#201C2F]">
            {posts.map((p) => (
              <div key={p.id} className="py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={p.video_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100"} className="w-10 h-10 rounded-lg object-cover border border-[#201C2F]" alt="Thumbnail" />
                    <div className="text-xs">
                      <p className="font-bold text-white max-w-md truncate">{p.caption || 'Sem legenda'}</p>
                      <p className="text-[10px] text-gray-400">{new Date(p.scheduled_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      p.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 
                      p.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {p.status}
                    </span>

                    {p.status === 'PENDING' && (
                      <button onClick={() => onPublishNow(p.id)} className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px]">
                        Disparar Agora
                      </button>
                    )}
                  </div>
                </div>

                {p.status === 'FAILED' && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2 mt-1">
                    <div>
                      <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                        <LuAlertTriangle /> Ocorreu um erro no envio para o Instagram
                      </p>
                      <p className="text-[11px] text-red-300/80 mt-1">{p.error_log || 'Erro desconhecido.'}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-[#13111C] border border-[#201C2F] mt-2">
                      <p className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mb-2">
                        <LuInfo className="text-purple-400" /> Como resolver:
                      </p>
                      <ul className="text-[10px] text-gray-400 space-y-1.5 list-disc pl-4">
                        <li><strong>Token Expirado ou Inválido:</strong> O Instagram desconectou sua conta por segurança. Vá na tela de <strong>Gerenciar Contas</strong>, remova a conta e conecte-a novamente.</li>
                        <li><strong>Formato Inválido:</strong> O Instagram Reels só aceita vídeos verticais (9:16), em formato MP4 ou MOV, e com no máximo 15 minutos.</li>
                        <li><strong>Conta Profissional:</strong> Certifique-se de que sua conta do Instagram é uma Conta Profissional / Business e está vinculada a uma página do Facebook.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
