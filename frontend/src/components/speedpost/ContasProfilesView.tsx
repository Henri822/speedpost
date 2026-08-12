import React, { useState } from 'react';
import { ConnectedAccount } from './types';
import { LuInstagram, LuPlus, LuTrash2, LuCheckCircle2, LuShieldCheck, LuKey } from 'react-icons/lu';

interface ContasProfilesViewProps {
  accounts: ConnectedAccount[];
  selectedAccount: ConnectedAccount | null;
  onSelectAccount: (acc: ConnectedAccount) => void;
  onAddAccount: (payload: { account_name: string; ig_user_id: string; access_token: string }) => Promise<void>;
  onDeleteAccount: (accountId: number) => Promise<void>;
}

export const ContasProfilesView: React.FC<ContasProfilesViewProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  onAddAccount,
  onDeleteAccount
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [accountName, setAccountName] = useState<string>("@");
  const [igUserId, setIgUserId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !igUserId || !accessToken) return;
    setIsSaving(true);
    try {
      await onAddAccount({
        account_name: accountName,
        ig_user_id: igUserId,
        access_token: accessToken
      });
      setShowModal(false);
      setAccountName("@");
      setIgUserId("");
      setAccessToken("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Contas / Perfis Conectados (Multi-Auth)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Gerencie múltiplos perfis do Instagram e escolha qual conta vai postar</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(109,40,217,0.4)] transition-all flex items-center gap-2 border border-purple-400/30"
        >
          <LuPlus className="text-sm" />
          <span>Conectar Nova Conta Instagram</span>
        </button>
      </div>

      {/* LISTA DE CONTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSelected = selectedAccount?.id === acc.id || selectedAccount?.ig_user_id === acc.ig_user_id;
          return (
            <div 
              key={acc.id || acc.ig_user_id}
              onClick={() => onSelectAccount(acc)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 relative ${
                isSelected 
                  ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_25px_rgba(109,40,217,0.25)]' 
                  : 'bg-[#13111C] border-[#201C2F] hover:border-gray-600'
              }`}
            >
              {isSelected && (
                <span className="absolute top-4 right-4 bg-purple-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <LuCheckCircle2 /> Conta Ativa p/ Posts
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5">
                  <img 
                    src={acc.profile_picture_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150"} 
                    alt={acc.account_name} 
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <LuInstagram className="text-pink-400" />
                    {acc.account_name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">ID: {acc.ig_user_id}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-[11px] text-gray-300 space-y-1">
                <p className="flex items-center justify-between text-gray-400">
                  <span>Status Meta API:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <LuShieldCheck /> Conectado / Ativo
                  </span>
                </p>
                <p className="flex items-center justify-between text-gray-400 font-mono text-[10px]">
                  <span>Token:</span>
                  <span className="text-purple-300 truncate max-w-[140px]">{acc.access_token.slice(0, 15)}...</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAccount(acc);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-[#0D0B14] text-gray-300 border-[#201C2F] hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  {isSelected ? '✓ Selecionada' : 'Selecionar Esta Conta'}
                </button>

                {acc.id && acc.id > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remover a conta ${acc.account_name}?`)) {
                        onDeleteAccount(acc.id);
                      }
                    }}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                    title="Excluir Conta"
                  >
                    <LuTrash2 className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADICIONAR CONTA */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13111C] border border-[#201C2F] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#201C2F] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LuInstagram className="text-pink-500 text-lg" />
                  Conectar Conta Instagram (Multi-Auth)
                </h3>
                <p className="text-xs text-gray-400">Insira o Token e o ID da Conta Instagram Business</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-300 block mb-1">Nome de Usuário (@usuario):</label>
                <input 
                  type="text" 
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="@seu_perfil"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">Instagram Business Account ID (IG User ID):</label>
                <input 
                  type="text" 
                  required
                  value={igUserId}
                  onChange={(e) => setIgUserId(e.target.value)}
                  placeholder="Ex: 17841427989289483 ou 28568074059463119"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">Meta Access Token (Token de Acesso):</label>
                <textarea 
                  rows={4}
                  required
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Cole aqui o Token do Meta Graph API (IGAGK... ou EAAG...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0B14] border border-[#201C2F] text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded-xl text-gray-400 hover:text-white font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all border border-purple-400/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <LuKey />
                  <span>{isSaving ? 'Salvando...' : 'Conectar e Salvar Conta'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
