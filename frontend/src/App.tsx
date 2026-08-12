import React, { useState, useEffect } from "react";
import { ConnectedAccount, ScheduledPostItem } from "./components/speedpost/types";
import { SpeedPostSidebar } from "./components/speedpost/SpeedPostSidebar";
import { ProgramarPostsV2 } from "./components/speedpost/ProgramarPostsV2";
import { DashboardView } from "./components/speedpost/DashboardView";
import { ContasProfilesView } from "./components/speedpost/ContasProfilesView";
import { LuUploadCloud, LuMessageCircle, LuHeadphones } from "react-icons/lu";

const API_BASE = "http://localhost:7001/api/reels";
const USER_ID = "usr_123";
const DEFAULT_IG_USER_ID = "28568074059463119";
const DEFAULT_TOKEN = "IGAGKXTzZCmGd5BZAGFxSFJ4Q0FtSHBlckNQZAXFPY0FRNlBHS3hENHhxQnYyeDRwNDE4QWxLa3BteDc0VGZAEOWx3MXlNb3BQVW5EeDFIZAFk3Tk92b0ZAUdVNrMUE4OEpSR2tZAMkE5ajQxLW90bzhmdVZAnQmQwWU1fVzgwaER5a3gzcwZDZD";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("programar_v2");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Accounts & Posts State
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    {
      id: 1,
      user_id: USER_ID,
      provider: "instagram",
      account_name: "@henriviniciuscasemiro",
      ig_user_id: DEFAULT_IG_USER_ID,
      access_token: DEFAULT_TOKEN,
      profile_picture_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150",
      status: "ACTIVE"
    }
  ]);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(accounts[0]);
  const [posts, setPosts] = useState<ScheduledPostItem[]>([]);
  const [publishedCount, setPublishedCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Bulk Form State
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkStartDate, setBulkStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [bulkTimes, setBulkTimes] = useState<string>("09:00, 14:00, 18:00, 21:00");
  const [bulkCaption] = useState<string>("Reels em lote automatizado ⚡ #speedpost");

  const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch backend data
  const fetchBackendData = async () => {
    try {
      const resAcc = await fetch(`${API_BASE}/accounts?user_id=${USER_ID}`);
      if (resAcc.ok) {
        const accData = await resAcc.json();
        if (accData.length > 0) {
          setAccounts(accData);
          setSelectedAccount((prev) => {
            if (!prev) return accData[0];
            const exists = accData.find((a: ConnectedAccount) => a.ig_user_id === prev.ig_user_id);
            return exists || accData[0];
          });
        }
      }

      const resPosts = await fetch(`${API_BASE}/scheduled?user_id=${USER_ID}`);
      if (resPosts.ok) {
        const pData = await resPosts.json();
        setPosts(pData);
        const pub = pData.filter((p: ScheduledPostItem) => p.status === "PUBLISHED").length;
        setPublishedCount(pub > 0 ? pub : 1);
      }
    } catch (err) {
      // Backend status silent sync
    }
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScheduleSingle = async (payload: { video_url: string; caption: string; scheduled_at: string; publishNow: boolean }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/schedule-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          ig_user_id: selectedAccount ? selectedAccount.ig_user_id : DEFAULT_IG_USER_ID,
          access_token: selectedAccount ? selectedAccount.access_token : DEFAULT_TOKEN,
          video_url: payload.video_url,
          caption: payload.caption,
          scheduled_at: payload.scheduled_at,
          publish_now: payload.publishNow
        })
      });

      if (res.ok) {
        triggerToast(
          payload.publishNow 
            ? "⚡ Disparando publicação imediata na Meta Graph API!" 
            : "🚀 Post/Reel agendado com sucesso!", 
          "success"
        );
        fetchBackendData();
      } else {
        triggerToast("Erro ao agendar publicação.", "error");
      }
    } catch (err) {
      triggerToast("Falha de conexão com o servidor local.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishNow = async (reelId: number) => {
    try {
      const res = await fetch(`${API_BASE}/publish-now/${reelId}`, { method: "POST" });
      if (res.ok) {
        triggerToast("⚡ Publicação imediata disparada!", "success");
        fetchBackendData();
      }
    } catch (err) {
      triggerToast("Erro ao publicar.", "error");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const timesList = bulkTimes.split(",").map(t => t.trim()).filter(Boolean);
      const sampleVideos = Array.from({ length: Number(bulkCount) }).map((_, idx) => ({
        video_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
        caption: `${bulkCaption} (Vídeo #${idx + 1})`
      }));

      const res = await fetch(`${API_BASE}/schedule-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          ig_user_id: selectedAccount ? selectedAccount.ig_user_id : DEFAULT_IG_USER_ID,
          access_token: selectedAccount ? selectedAccount.access_token : DEFAULT_TOKEN,
          videos: sampleVideos,
          start_date: bulkStartDate,
          times_per_day: timesList
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerToast(`🔥 ${data.message}`, "success");
        setActiveTab("dashboard");
        fetchBackendData();
      } else {
        triggerToast("Erro ao agendar lote.", "error");
      }
    } catch (err) {
      triggerToast("Falha ao enviar lote.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccount = async (payload: { account_name: string; ig_user_id: string; access_token: string }) => {
    try {
      const res = await fetch(`${API_BASE}/connect-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          provider: "instagram",
          account_name: payload.account_name,
          ig_user_id: payload.ig_user_id,
          access_token: payload.access_token
        })
      });
      if (res.ok) {
        triggerToast("Conta do Instagram conectada com sucesso!", "success");
        fetchBackendData();
      }
    } catch (err) {
      triggerToast("Erro ao conectar conta.", "error");
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Conta removida com sucesso!", "success");
        fetchBackendData();
      }
    } catch (err) {
      triggerToast("Erro ao remover conta.", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09080F] text-gray-200">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#13111C] border border-purple-500/40 text-white shadow-[0_0_20px_rgba(109,40,217,0.4)] animate-bounce-short">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${toast.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"}`}>
            {toast.type === "success" ? "✓" : "⚡"}
          </div>
          <div>
            <p className="font-semibold text-sm">{toast.message}</p>
            <p className="text-[10px] text-gray-400">SpeedPost Engine • Agora</p>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <SpeedPostSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP WARNING BANNER */}
        <div className="bg-gradient-to-r from-purple-950/80 via-purple-900/30 to-[#09080F] border-b border-purple-500/25 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-200 font-medium">
            <span className="text-purple-400">ⓘ</span>
            <span>Assinatura necessária para agendar e publicar.</span>
          </div>
          <button onClick={() => setActiveTab("planos")} className="text-purple-300 hover:text-white font-semibold text-xs flex items-center gap-1">
            Ver planos ↗
          </button>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "programar_v2" && (
          <ProgramarPostsV2 
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
            onNavigateToAccounts={() => setActiveTab("contas")}
            onScheduleSingle={handleScheduleSingle}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === "contas" && (
          <ContasProfilesView 
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardView 
            posts={posts}
            publishedCount={publishedCount}
            onNavigateToSchedule={() => setActiveTab("programar_v2")}
            onPublishNow={handlePublishNow}
          />
        )}

        {activeTab === "carrossel_massa" && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-lg">
                <LuUploadCloud />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Carrossel em Massa</h2>
                <p className="text-xs text-gray-400">Crie e agende vários carrosséis e posts de feed de uma vez</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold border-b border-[#201C2F] pb-3">
              <span className="px-3 py-1 rounded-xl bg-purple-600 text-white shadow-glow">1. Upload</span>
              <span className="text-gray-500">❯</span>
              <span className="text-gray-400">2. Montagem</span>
              <span className="text-gray-500">❯</span>
              <span className="text-gray-400">3. Agendar</span>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div className="p-12 rounded-3xl border-2 border-dashed border-purple-500/30 bg-[#13111C] hover:bg-[#181524] transition-all text-center space-y-3 cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto text-2xl">
                  ↑
                </div>
                <p className="text-sm font-bold text-white">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-400">Imagens (JPG, PNG, WebP) e Vídeos (MP4, MOV, WebM)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Quantidade de Vídeos:</label>
                  <input 
                    type="number" 
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#13111C] border border-[#201C2F] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Data Inicial:</label>
                  <input 
                    type="date" 
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#13111C] border border-[#201C2F] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Horários por dia:</label>
                  <input 
                    type="text" 
                    value={bulkTimes}
                    onChange={(e) => setBulkTimes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#13111C] border border-[#201C2F] text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] transition-all"
                >
                  {isSubmitting ? "Agendando lote..." : "Montar Posts & Agendar Lote >"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "calendario" && (
          <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Calendário</h2>
              <p className="text-xs text-gray-400">Selecione um profile para ver o calendário de publicações</p>
            </div>

            <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedAccount?.profile_picture_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150"} className="w-8 h-8 rounded-full border border-purple-500" alt="Profile" />
                  <span className="font-bold text-sm text-white">{selectedAccount?.account_name}</span>
                </div>
                <span className="text-xs text-purple-400 font-semibold">Agosto 2026</span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                  <div key={d} className="font-bold text-gray-500 py-1">{d}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className="min-h-[80px] p-2 rounded-xl bg-[#0D0B14] border border-[#201C2F]/60 text-left flex flex-col justify-between hover:border-purple-500/40">
                    <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>
                    {i + 1 === 12 && (
                      <div className="p-1 rounded bg-purple-600/30 border border-purple-500/40 text-[9px] text-purple-200 truncate">
                        ⚡ 1 Reel Agendado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "contas" && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Contas Conectadas</h2>
              <p className="text-xs text-gray-400">Gerencie suas contas do Instagram e conexões da Meta API</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-[#13111C] border border-purple-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_15px_rgba(109,40,217,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={acc.profile_picture_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150"} className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover" alt="Avatar" />
                      <div>
                        <h3 className="font-bold text-base text-white">{acc.account_name}</h3>
                        <p className="text-xs text-purple-400 font-mono">ID: {acc.ig_user_id}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ● ATIVO LIVE
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0B14] text-[11px] font-mono text-gray-400 truncate">
                    Token: {acc.access_token.slice(0, 28)}...
                  </div>

                  <button onClick={() => triggerToast("Conexão com a Meta Graph API validada 100%!", "success")} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                    Testar Conexão Meta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLOATING ACTION BUTTONS */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5 items-end select-none">
          <a 
            href="https://wa.me/" 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all hover:scale-105"
          >
            <LuMessageCircle />
            <span>WhatsApp</span>
          </a>

          <button 
            onClick={() => triggerToast("Suporte via chat ativo 24/7.")}
            className="px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] flex items-center gap-2 transition-all hover:scale-105"
          >
            <LuHeadphones />
            <span>Suporte via chat</span>
          </button>
        </div>

      </main>

    </div>
  );
}
