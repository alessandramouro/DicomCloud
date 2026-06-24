# ADR-002: Arquitetura do Edge Agent

**Status:** Accepted  
**Date:** 2025-01-01

## Contexto

Equipamentos de ultrassom nas clínicas enviam imagens via protocolo DICOM C-STORE SCP. Precisamos de um agente local que:
- Opere sem depender de conectividade contínua
- Sobreviva a quedas de rede e reinicializações
- Sincronize automaticamente quando a conexão for restaurada

## Decisão

Agente NestJS com:
1. **DICOM SCP via dcmtk** — wrapping do `storescp` como processo filho
2. **Fallback via chokidar** — quando dcmtk não está disponível
3. **SQLite** — fila local persistente (melhor que Redis para edge)
4. **BullMQ** — orquestração de jobs de upload

## Por que SQLite em vez de Redis no edge?

- Sem dependência de serviço externo
- Dados persistem após reinicialização do OS
- Suficiente para throughput esperado (< 1000 arquivos/dia por clínica)
- Redis pode ser adicionado opcionalmente para instalações maiores

## Protocolo DICOM

Em vez de implementar DICOM em Node.js nativo:
- `dcmtk storescp` lida com todo o protocolo DIMSE
- O agente monitora a saída stdout para detectar arquivos recebidos
- Fallback via chokidar para qualquer ferramenta DICOM que grave em disco

## Consequências

✅ Funciona offline indefinidamente  
✅ Retoma uploads interrompidos (chunk offset persistido no SQLite)  
✅ Suporta volumes altos sem saturar RAM  
✅ Compatível com qualquer modalidade DICOM  
❌ Requer instalação do dcmtk no host (incluído no Dockerfile)  
