'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Cloud, CheckCircle, ExternalLink, Save, Eye, EyeOff, Key, Loader2, Settings,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/use-permission';

interface EnvCredentials {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  MICROSOFT_TENANT_ID: string;
  MICROSOFT_REDIRECT_URI: string;
  configured: { google: boolean; microsoft: boolean };
}

const inputClass = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono';

export default function SettingsPage() {
  const { is } = usePermission();
  const [showSecrets, setShowSecrets] = useState(false);
  const [saved, setSaved] = useState(false);
  const [highlighted, setHighlighted] = useState<'google' | 'microsoft' | null>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const microsoftRef = useRef<HTMLDivElement>(null);

  // Scroll to and highlight the provider from the URL hash (#google or #microsoft)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as 'google' | 'microsoft';
    if (hash === 'google' || hash === 'microsoft') {
      setHighlighted(hash);
      setShowSecrets(true);
      setTimeout(() => {
        const ref = hash === 'google' ? googleRef.current : microsoftRef.current;
        ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlighted(null), 3500);
    }
  }, []);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<Record<string, string>>();

  const { data: creds, isLoading } = useQuery({
    queryKey: ['env-credentials'],
    queryFn: () => api.get<{ data: EnvCredentials }>('/settings/oauth-credentials').then((r) => r.data.data),
    enabled: is('SUPER_ADMIN'),
  });

  useEffect(() => {
    if (creds) {
      reset({
        GOOGLE_CLIENT_ID: creds.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: creds.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: creds.GOOGLE_REDIRECT_URI,
        MICROSOFT_CLIENT_ID: creds.MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET: creds.MICROSOFT_CLIENT_SECRET,
        MICROSOFT_TENANT_ID: creds.MICROSOFT_TENANT_ID,
        MICROSOFT_REDIRECT_URI: creds.MICROSOFT_REDIRECT_URI,
      });
    }
  }, [creds, reset]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => {
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v && !v.includes('*')));
      return api.patch<{ data: { updated: string[]; message: string } }>('/settings/oauth-credentials', clean);
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      reset(undefined, { keepValues: true });
    },
  });

  if (!is('SUPER_ADMIN')) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
        <Settings size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Acesso Restrito</p>
        <p className="text-xs mt-1">Apenas Super Admin pode acessar as configurações do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Credenciais OAuth</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as credenciais para integração com Google Drive e Microsoft OneDrive.
          Após salvar, vá para <strong>Storage</strong> para conectar cada clínica à sua conta.
        </p>
      </div>

      {/* Editor */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Key size={14} />
            Arquivo .env — Credenciais OAuth
          </h3>
          <button onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
            {showSecrets ? 'Ocultar' : 'Mostrar valores'}
          </button>
        </div>

        {isLoading ? (
          <div className="p-5"><div className="h-40 skeleton rounded-lg" /></div>
        ) : (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div className="p-5 space-y-5">
              {/* Google */}
              <div
                id="google"
                ref={googleRef}
                className={cn(
                  'rounded-xl transition-all duration-700 p-3 -m-3',
                  highlighted === 'google' ? 'bg-blue-400/10 ring-2 ring-blue-400/40' : '',
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Cloud size={14} className="text-blue-400" />
                  <span className="text-xs font-semibold text-foreground">Google Drive</span>
                  <span className={cn(
                    'px-1.5 py-0.5 text-xs rounded border',
                    creds?.configured.google
                      ? 'bg-status-success/10 text-status-success border-status-success/20'
                      : 'bg-status-warning/10 text-status-warning border-status-warning/20',
                  )}>
                    {creds?.configured.google ? '✓ Configurado' : 'Não configurado'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">GOOGLE_CLIENT_ID</label>
                    <input {...register('GOOGLE_CLIENT_ID')} type={showSecrets ? 'text' : 'password'}
                      placeholder="xxxxx.apps.googleusercontent.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">GOOGLE_CLIENT_SECRET</label>
                    <input {...register('GOOGLE_CLIENT_SECRET')} type={showSecrets ? 'text' : 'password'}
                      placeholder="GOCSPX-..." className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">GOOGLE_REDIRECT_URI</label>
                    <input {...register('GOOGLE_REDIRECT_URI')} type="text" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Microsoft */}
              <div
                id="microsoft"
                ref={microsoftRef}
                className={cn(
                  'border-t border-border pt-5 rounded-xl transition-all duration-700 p-3 -m-3 mt-2',
                  highlighted === 'microsoft' ? 'bg-blue-500/10 ring-2 ring-blue-500/40' : '',
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Cloud size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-foreground">Microsoft OneDrive</span>
                  <span className={cn(
                    'px-1.5 py-0.5 text-xs rounded border',
                    creds?.configured.microsoft
                      ? 'bg-status-success/10 text-status-success border-status-success/20'
                      : 'bg-status-warning/10 text-status-warning border-status-warning/20',
                  )}>
                    {creds?.configured.microsoft ? '✓ Configurado' : 'Não configurado'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">MICROSOFT_CLIENT_ID</label>
                    <input {...register('MICROSOFT_CLIENT_ID')} type={showSecrets ? 'text' : 'password'}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">MICROSOFT_CLIENT_SECRET</label>
                    <input {...register('MICROSOFT_CLIENT_SECRET')} type={showSecrets ? 'text' : 'password'}
                      placeholder="xxxx~xxxx..." className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">MICROSOFT_TENANT_ID</label>
                      <input {...register('MICROSOFT_TENANT_ID')} type="text" placeholder="common" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">MICROSOFT_REDIRECT_URI</label>
                      <input {...register('MICROSOFT_REDIRECT_URI')} type="text" className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
              <div className="text-xs">
                {mutation.isError && (
                  <span className="text-destructive">
                    {(mutation.error as any)?.response?.data?.message || 'Erro ao salvar'}
                  </span>
                )}
                {saved && (
                  <span className="text-status-success flex items-center gap-1">
                    <CheckCircle size={12} />
                    Salvo! {mutation.data?.data?.message}
                  </span>
                )}
                {!saved && !mutation.isError && (
                  <span className="text-muted-foreground">
                    Valores com **** não são sobrescritos ao salvar.
                  </span>
                )}
              </div>
              <button type="submit" disabled={mutation.isPending || !isDirty}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {mutation.isPending ? 'Salvando...' : 'Salvar no .env'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* How-to */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
          <Settings size={14} />
          Como obter as credenciais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Cloud size={12} className="text-blue-400" /> Google Drive
            </p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Acesse <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={9} /></a></li>
              <li>Crie um projeto e ative a <strong>Google Drive API</strong></li>
              <li>Crie uma credencial <strong>OAuth 2.0 → Aplicativo Web</strong></li>
              <li>URI autorizada:<br /><code className="bg-muted px-1 rounded">http://localhost:3001/api/v1/oauth/google/callback</code></li>
              <li>Copie o Client ID e Secret acima</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Cloud size={12} className="text-blue-500" /> Microsoft OneDrive
            </p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Acesse <a href="https://portal.azure.com" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">Azure Portal <ExternalLink size={9} /></a></li>
              <li><strong>Azure AD → App Registrations → New</strong></li>
              <li>Adicione URI de redirecionamento:<br /><code className="bg-muted px-1 rounded">http://localhost:3001/api/v1/oauth/microsoft/callback</code></li>
              <li>Crie um segredo em <strong>Certificates & secrets</strong></li>
              <li>Copie o Application ID e Secret acima</li>
            </ol>
          </div>
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <strong className="text-foreground">Fluxo completo:</strong> Configure as credenciais aqui →
          Vá para <strong>Storage</strong> → Crie ou edite um destino Google Drive/OneDrive →
          Clique em <strong>"Autorizar"</strong> dentro do destino.
        </div>
      </div>
    </div>
  );
}
