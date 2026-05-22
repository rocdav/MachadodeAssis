---
title: Dicionário Geográfico e Literário de Machado de Assis
emoji: 🌍
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
header: mini
thumbnail: >-
  https://cdn-uploads.huggingface.co/production/uploads/650647450761d34d28ddd4c0/cE3WuXxWFJSmCu8Uft6KS.jpeg
short_description: Dicionário Geográfico e Literário de Machado de Assis
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

## Rodando localmente com Docker

Pré-requisitos: Docker Desktop (Windows/macOS) ou Docker Engine + plugin Compose (Linux).

A partir da pasta do projeto:

```bash
docker compose up -d
```

A página fica disponível em <http://localhost:8080>.

Para parar:

```bash
docker compose down
```

Para atualizar depois que o conteúdo do projeto for modificado (basta substituir
os arquivos da pasta e rodar novamente):

```bash
docker compose up -d --build
```

Para usar uma porta diferente da 8080 (ex.: 9090):

```bash
PORT=9090 docker compose up -d
```
