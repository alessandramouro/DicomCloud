# DicomCloud Edge Agent — Instalador

Dois modos de distribuição:

| Modo | Arquivo | Para quem |
|---|---|---|
| **Script PowerShell** | `install.ps1` | Dev / TI avançado — clona o repo e executa |
| **Setup .exe** | gerado por `build-installer.ps1` | Distribuição para clínicas — clica e instala |

---

## Opção A — Script PowerShell (install.ps1)

### Pré-requisito único

```powershell
# Verificar Node.js 22+
node --version
```

Se não tiver Node.js 22+: o próprio instalador baixa e instala.

### Executar

```powershell
# Clique com botão direito → "Executar como Administrador"
# ou em um terminal elevado:

cd DicomCloud\apps\edge-agent\installer
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

O assistente vai perguntar:

```
  Diretório de instalação [C:\DicomCloud\EdgeAgent] :
  Agent ID : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  API Key  : agt_xxx...
  URL da API DicomCloud [http://localhost:3001] :
  AE Title DICOM [DICOMCLOUD] :
  Porta DICOM [104] :
  Nome do serviço Windows [DicomCloudAgent] :
```

### Modo silencioso (MDM / automação)

```powershell
.\install.ps1 -Silent `
    -AgentId    "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ApiKey     "agt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" `
    -CloudApiUrl "https://api.dicomcloud.com.br" `
    -AeTitle    "CLINICA01" `
    -DicomPort  11112 `
    -InstallDir "C:\DicomCloud\EdgeAgent"
```

### Desinstalar

```powershell
.\install.ps1 -Uninstall
```

---

## Opção B — Instalador .exe (para distribuição)

### Pré-requisitos de build (máquina de desenvolvimento)

1. **Node.js 22+** — [nodejs.org](https://nodejs.org)
2. **Inno Setup 6** — [jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php)
3. Acesso à internet (para baixar DCMTK, NSSM, Node.js portátil)

### Gerar o instalador

```powershell
cd DicomCloud\apps\edge-agent\installer
.\build-installer.ps1
```

O script faz automaticamente:
1. `npm ci && npm run build` no Edge Agent
2. Download NSSM, DCMTK, Node.js portátil
3. Monta `installer\bundle\`
4. Chama `iscc.exe installer.iss`
5. Gera `installer\output\DicomCloudEdgeAgent-Setup-1.0.0.exe`

### Rebuild rápido (componentes já baixados)

```powershell
.\build-installer.ps1 -SkipNodeDownload -SkipDcmtkDownload -SkipNssmDownload
```

### Inno Setup em caminho não-padrão

```powershell
.\build-installer.ps1 -IsccPath "C:\MinhasPastas\InnoSetup\iscc.exe"
```

---

## O que o instalador entrega

### Componentes instalados

| Componente | Versão | Finalidade |
|---|---|---|
| Edge Agent | 1.0.0 | Aplicação principal |
| Node.js | 22 LTS | Runtime (portátil — não afeta Node do sistema) |
| DCMTK (storescp) | 3.6.8 | Receptor DICOM TCP (C-STORE SCP) |
| NSSM | 2.24 | Gerenciador de serviço Windows |

### Estrutura criada em `C:\DicomCloud\EdgeAgent\`

```
C:\DicomCloud\EdgeAgent\
  dist\            JavaScript compilado
  node_modules\    Dependências de produção
  node\            Node.js portátil
  dcmtk\           Binários DICOM (storescp.exe)
  nssm\            nssm.exe
  storage\
    received\      Arquivos DICOM recebidos (processando)
    processed\     Arquivos DICOM enviados à nuvem
    failed\        Arquivos com falha de processamento
    logs\
      agent.log         Saída padrão do serviço
      agent-error.log   Erros do serviço
  .env             Configuração (contém API Key — não compartilhar)
  package.json
```

### Serviço Windows

- **Nome:** DicomCloudAgent (configurável)
- **Tipo:** Automático — inicia com o Windows
- **Conta:** LocalSystem
- **Reinício automático:** configurado via NSSM

### Regra de firewall

- Regra inbound TCP na porta DICOM configurada (padrão: 104)
- Nome: "DicomCloud Edge Agent - DICOM SCP"

### Atalhos criados

- `Desktop Público\DicomCloud Agent - Logs` → abre pasta de logs
- `Desktop Público\DicomCloud Agent - Reiniciar` → reinicia o serviço

---

## Após a instalação — configurar o equipamento

No equipamento DICOM (ultrassom, raio-X, tomógrafo):

| Campo | Valor |
|---|---|
| Destination AE Title | valor configurado no instalador (ex.: `DICOMCLOUD`) |
| Destination IP | IP da workstation onde o agente está instalado |
| Destination Port | porta configurada (ex.: `104` ou `11112`) |

O agente aparecerá como **ONLINE** no portal em até 15 segundos após iniciar.

---

## Troubleshooting

### Serviço não inicia

```powershell
# Ver logs
Get-Content "C:\DicomCloud\EdgeAgent\storage\logs\agent-error.log" -Tail 50

# Status do serviço
Get-Service DicomCloudAgent

# Reiniciar manualmente
& "C:\DicomCloud\EdgeAgent\nssm\nssm.exe" restart DicomCloudAgent
```

### Porta 104 recusada

Porta 104 requer conta SYSTEM. O instalador configura `ObjectName = LocalSystem`.
Verifique se nenhum outro software DICOM está usando a porta:
```powershell
netstat -ano | findstr :104
```

### DCMTK não inicia (fallback para file-watcher)

```powershell
# Verificar se storescp está no PATH
storescp --version

# Se não estiver, adicionar manualmente
$env:Path += ";C:\DicomCloud\EdgeAgent\dcmtk\bin"
```

### Atualizar credenciais (.env)

```powershell
notepad "C:\DicomCloud\EdgeAgent\.env"
# Edite EDGE_AGENT_ID e EDGE_AGENT_API_KEY
# Depois reinicie o serviço:
& "C:\DicomCloud\EdgeAgent\nssm\nssm.exe" restart DicomCloudAgent
```
